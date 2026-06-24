/**
 * Shared "scene model" for the glass designer.
 *
 * buildScene() turns the designer's editable state (glass + works/holes + paint)
 * into a fully-resolved, renderer-agnostic description in millimetre space:
 * every outline, cutout, dimension and label is positioned ONCE here. Both the
 * live canvas renderer and the SVG print/export renderer consume the exact same
 * scene, which is what guarantees "what you print is what you see".
 *
 * Coordinate system (matches the rest of the designer): millimetres, Y=0 at the
 * bottom, Y increasing upward.
 *
 * Exposed as the global `DesignerScene`.
 */
(function (global) {
  "use strict";

  /** Compute polygon bounding box. */
  function bboxOf(points) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }

  /** Resolve the glass outline into points + per-side metadata + bbox. */
  function resolveOutline(outlinePoints, glass) {
    const points = outlinePoints.slice();
    const n = points.length;

    // Centroid (for outward side normals).
    let cx = 0,
      cy = 0;
    for (const p of points) {
      cx += p.x;
      cy += p.y;
    }
    cx /= n || 1;
    cy /= n || 1;

    const sides = [];
    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      // Outward normal = direction from centroid toward the side midpoint.
      let nx = mid.x - cx;
      let ny = mid.y - cy;
      const nlen = Math.hypot(nx, ny) || 1;
      nx /= nlen;
      ny /= nlen;
      sides.push({ index: i, p1, p2, length, mid, normal: { x: nx, y: ny } });
    }

    return { points, sides, bbox: bboxOf(points), centroid: { x: cx, y: cy } };
  }

  /**
   * Cast rays from a point in the 4 axis directions and find the nearest
   * outline edge crossing. Returns {left,right,bottom,top} positions in mm.
   * Falls back to the bounding box when no crossing is found.
   */
  function nearestEdges(outline, px, py) {
    const pts = outline.points;
    const n = pts.length;
    const bb = outline.bbox;
    let left = bb.minX,
      right = bb.maxX,
      bottom = bb.minY,
      top = bb.maxY;
    let leftFound = false,
      rightFound = false,
      botFound = false,
      topFound = false;

    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      // Horizontal ray (constant y = py): find x crossings.
      if ((a.y <= py && b.y >= py) || (a.y >= py && b.y <= py)) {
        const t = (py - a.y) / (b.y - a.y || 1e-9);
        const x = a.x + t * (b.x - a.x);
        if (x <= px && (!leftFound || x > left)) {
          left = x;
          leftFound = true;
        }
        if (x >= px && (!rightFound || x < right)) {
          right = x;
          rightFound = true;
        }
      }
      // Vertical ray (constant x = px): find y crossings.
      if ((a.x <= px && b.x >= px) || (a.x >= px && b.x <= px)) {
        const t = (px - a.x) / (b.x - a.x || 1e-9);
        const y = a.y + t * (b.y - a.y);
        if (y <= py && (!botFound || y > bottom)) {
          bottom = y;
          botFound = true;
        }
        if (y >= py && (!topFound || y < top)) {
          top = y;
          topFound = true;
        }
      }
    }
    return { left, right, bottom, top };
  }

  /**
   * Translate + mirror a works-library primitive list from its local frame
   * (centred on 0,0) to the placed anchor (ax,ay). Returns {items, bbox}.
   */
  function placeItems(items, ax, ay, mirror) {
    const sx = mirror && mirror.h ? -1 : 1;
    const sy = mirror && mirror.v ? -1 : 1;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    const eat = (x, y) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    };
    const tx = (x) => ax + x * sx;
    const ty = (y) => ay + y * sy;

    const out = items.map((it) => {
      if (it.t === "circle") {
        const c = { t: "circle", cx: tx(it.cx), cy: ty(it.cy), r: it.r };
        eat(c.cx - it.r, c.cy - it.r);
        eat(c.cx + it.r, c.cy + it.r);
        return c;
      }
      if (it.t === "ring") {
        const c = { t: "ring", cx: tx(it.cx), cy: ty(it.cy), r: it.r, rInner: it.rInner };
        eat(c.cx - it.r, c.cy - it.r);
        eat(c.cx + it.r, c.cy + it.r);
        return c;
      }
      if (it.t === "rect") {
        // bottom-left origin; mirroring may flip the corner, normalise.
        const x0 = tx(it.x),
          x1 = tx(it.x + it.w);
        const y0 = ty(it.y),
          y1 = ty(it.y + it.h);
        const r = {
          t: "rect",
          x: Math.min(x0, x1),
          y: Math.min(y0, y1),
          w: Math.abs(x1 - x0),
          h: Math.abs(y1 - y0),
        };
        eat(r.x, r.y);
        eat(r.x + r.w, r.y + r.h);
        return r;
      }
      if (it.t === "slot") {
        const c = {
          t: "slot",
          cx: tx(it.cx),
          cy: ty(it.cy),
          length: it.length,
          width: it.width,
          vertical: it.vertical,
        };
        const hw = (it.vertical ? it.width : it.length) / 2;
        const hh = (it.vertical ? it.length : it.width) / 2;
        eat(c.cx - hw, c.cy - hh);
        eat(c.cx + hw, c.cy + hh);
        return c;
      }
      // poly
      const points = it.points.map((p) => {
        const q = { x: tx(p.x), y: ty(p.y) };
        eat(q.x, q.y);
        return q;
      });
      return { t: "poly", points };
    });

    if (!isFinite(minX)) {
      minX = maxX = ax;
      minY = maxY = ay;
    }
    return { items: out, bbox: { minX, minY, maxX, maxY } };
  }

  /**
   * Resolve a single work (hole/cutout) into render-ready geometry primitives
   * in mm-space plus its center and bounding box.
   *
   * Phase 1 adapter: understands the legacy hole shapes
   * (circle, taladro, rectangle, avellanado, clip). The parametric works library
   * (Phase 5) plugs in here by providing geometry for new templateIds.
   */
  function resolveWork(hole, index, glass, selected) {
    const base = {
      id: hole.id != null ? hole.id : "w" + index,
      index,
      shape: hole.shape,
      selected: !!selected,
      herrajeId: hole.herrajes_herraje_id || hole.herrajeId || null,
      raw: hole,
    };

    switch (hole.shape) {
      case "circle":
      case "taladro": {
        const r = (hole.diameter || 0) / 2;
        return Object.assign(base, {
          center: { x: hole.x, y: hole.y },
          geom: {
            kind: hole.shape === "taladro" ? "drill" : "circle",
            cx: hole.x,
            cy: hole.y,
            r,
          },
          bbox: { minX: hole.x - r, minY: hole.y - r, maxX: hole.x + r, maxY: hole.y + r },
          size: { d: hole.diameter || 0 },
        });
      }
      case "avellanado": {
        const r = (hole.diameter || 0) / 2;
        const rInner = (hole.holeDiameter || 0) / 2;
        return Object.assign(base, {
          center: { x: hole.x, y: hole.y },
          geom: { kind: "ring", cx: hole.x, cy: hole.y, r, rInner },
          bbox: { minX: hole.x - r, minY: hole.y - r, maxX: hole.x + r, maxY: hole.y + r },
          size: { d: hole.diameter || 0, dInner: hole.holeDiameter || 0 },
        });
      }
      case "rectangle": {
        const w = hole.width || 0;
        const h = hole.height || 0;
        // (x,y) is the bottom-left corner.
        return Object.assign(base, {
          center: { x: hole.x + w / 2, y: hole.y + h / 2 },
          geom: { kind: "rect", x: hole.x, y: hole.y, w, h },
          bbox: { minX: hole.x, minY: hole.y, maxX: hole.x + w, maxY: hole.y + h },
          size: { w, h },
        });
      }
      case "clip": {
        const w = hole.width || 0;
        const depth = hole.depth || 0;
        const distLeft = hole.x;
        const distRight = glass.width - hole.x;
        const distBottom = hole.y;
        const distTop = glass.height - hole.y;
        const min = Math.min(distLeft, distRight, distBottom, distTop);
        let p1, p2, tip;
        if (min === distLeft) {
          p1 = { x: 0, y: hole.y + w / 2 };
          p2 = { x: 0, y: hole.y - w / 2 };
          tip = { x: depth, y: hole.y };
        } else if (min === distRight) {
          p1 = { x: glass.width, y: hole.y + w / 2 };
          p2 = { x: glass.width, y: hole.y - w / 2 };
          tip = { x: glass.width - depth, y: hole.y };
        } else if (min === distBottom) {
          p1 = { x: hole.x - w / 2, y: 0 };
          p2 = { x: hole.x + w / 2, y: 0 };
          tip = { x: hole.x, y: depth };
        } else {
          p1 = { x: hole.x - w / 2, y: glass.height };
          p2 = { x: hole.x + w / 2, y: glass.height };
          tip = { x: hole.x, y: glass.height - depth };
        }
        const poly = [p1, tip, p2];
        return Object.assign(base, {
          center: { x: hole.x, y: hole.y },
          geom: { kind: "clip", points: poly },
          bbox: bboxOf(poly),
          size: { w, depth },
        });
      }
      case "work": {
        // Parametric work from the works library (Phase 5).
        const lib = global.WORKS_LIBRARY || {};
        const tpl = lib[hole.templateId];
        const mirror = hole.mirror || { h: false, v: false };
        let items = [];
        if (tpl) {
          const res = tpl.generate(hole.params || {}, mirror, glass) || {};
          items = res.items || [];
        }
        const placed = placeItems(items, hole.x, hole.y, mirror);
        return Object.assign(base, {
          templateId: hole.templateId,
          params: hole.params || {},
          mirror,
          center: { x: hole.x, y: hole.y },
          geom: { kind: "group", items: placed.items },
          bbox: placed.bbox,
          size: {},
        });
      }
      default: {
        // Unknown shape: render a small marker so it is never silently dropped.
        return Object.assign(base, {
          center: { x: hole.x || 0, y: hole.y || 0 },
          geom: { kind: "circle", cx: hole.x || 0, cy: hole.y || 0, r: 5 },
          bbox: { minX: hole.x - 5, minY: hole.y - 5, maxX: hole.x + 5, maxY: hole.y + 5 },
          size: {},
        });
      }
    }
  }

  /**
   * Build the complete scene.
   *
   * @param {object} state
   *   - glass: {width,height,thickness,type,cpb,shape}
   *   - outlinePoints: [{x,y}] already flipped, glass coords
   *   - works: array of legacy hole objects
   *   - paint: array of paint areas
   *   - selectedIndex: index of selected work (or -1)
   * @param {object} opts
   *   - scale: live mm->px scale (used to size dimension labels consistently)
   *   - measureText: fn(text, fontPx)->pixel width
   *   - theme: theme tokens
   *   - showDims: boolean
   */
  function buildScene(state, opts) {
    opts = opts || {};
    const glass = state.glass;
    const outline = resolveOutline(state.outlinePoints, glass);

    const works = (state.works || []).map((h, i) =>
      resolveWork(h, i, glass, i === state.selectedIndex),
    );

    const scene = {
      glass: {
        width: glass.width,
        height: glass.height,
        thickness: glass.thickness,
        type: glass.type,
        cpb: glass.cpb,
        shape: glass.shape,
      },
      outline,
      works,
      paint: (state.paint || []).map((p) => Object.assign({}, p)),
      dims: [],
    };

    if (opts.showDims !== false && global.DesignerDimensions) {
      scene.dims = global.DesignerDimensions.layout(scene, opts);
    }

    return scene;
  }

  global.DesignerScene = {
    buildScene,
    resolveOutline,
    resolveWork,
    nearestEdges,
    bboxOf,
  };
})(typeof window !== "undefined" ? window : this);
