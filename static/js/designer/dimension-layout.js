/**
 * Dimension layout engine.
 *
 * Replaces the old "(holeIndex % 3)" vertical-stacking hack with a real
 * collision-free layout. All measurements are placed into dimension BANDS
 * outside the part (bottom = horizontal dims, left = vertical dims). Within a
 * band, overlapping dimensions are pushed into successive LANES via greedy
 * interval colouring, so labels and dimension lines never overlap.
 *
 * Everything is computed once in millimetre space (see scene.js) so the live
 * canvas and the SVG print output share identical placement.
 *
 * Exposed as the global `DesignerDimensions`.
 */
(function (global) {
  "use strict";

  // Pixel constants, converted to mm using the live scale so the band spacing
  // looks consistent regardless of zoom and is identical on screen and print.
  const BASE_GAP_PX = 38; // distance from part edge to the first lane
  const LANE_STEP_PX = 24; // distance between successive lanes
  const LABEL_MARGIN_PX = 8; // breathing room added around each label interval

  function roundMM(v) {
    return Math.round(v);
  }

  /**
   * Greedy lane assignment. Each item has a 1-D interval [s,e]; returns the
   * same items with a `.lane` (0-based) such that intervals on the same lane
   * never overlap.
   */
  function assignLanes(items) {
    items.sort((a, b) => a.s - b.s);
    const lanes = []; // lanes[i] = max-end so far on that lane
    for (const it of items) {
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        if (it.s >= lanes[i]) {
          it.lane = i;
          lanes[i] = it.e;
          placed = true;
          break;
        }
      }
      if (!placed) {
        it.lane = lanes.length;
        lanes.push(it.e);
      }
    }
    return items;
  }

  /**
   * @returns array of dimension primitives in mm-space:
   *   linear: { kind:'linear', orient, extA, extB, lineA, lineB, textPos,
   *             text, value, hitHalfW, hitHalfH, editable }
   *   edge:   { kind:'edge', textPos, badgePos, badgeNum, text, value,
   *             hitHalfW, hitHalfH, editable }
   */
  function layout(scene, opts) {
    const scale = opts.scale || 0.3;
    const fontPx = (opts.theme && opts.theme.dimFontPx) || 11;
    const measure =
      opts.measureText ||
      function (t) {
        return t.length * fontPx * 0.55;
      };

    const gapMM = BASE_GAP_PX / scale;
    const stepMM = LANE_STEP_PX / scale;
    const marginMM = LABEL_MARGIN_PX / scale;
    const textHmm = (fontPx * 1.5) / scale;

    const bb = scene.outline.bbox;
    const dims = [];

    const labelWmm = (text) => measure(text, fontPx) / scale;

    // ---- collect band requests ----
    const bottom = []; // horizontal dims
    const left = []; // vertical dims

    // Glass overall width (bottom) and height (left).
    {
      const wText = roundMM(bb.w) + "mm";
      bottom.push({
        s: bb.minX,
        e: bb.maxX,
        aX: bb.minX,
        bX: bb.maxX,
        anchorY: bb.minY,
        text: wText,
        value: bb.w,
        priority: 0,
        editable: { type: "glassW", value: roundMM(bb.w) },
      });
      const hText = roundMM(bb.h) + "mm";
      left.push({
        s: bb.minY,
        e: bb.maxY,
        aY: bb.minY,
        bY: bb.maxY,
        anchorX: bb.minX,
        text: hText,
        value: bb.h,
        priority: 0,
        editable: { type: "glassH", value: roundMM(bb.h) },
      });
    }

    // Per-work positional dimensions (distance from the nearest edges).
    scene.works.forEach((work) => {
      const c = work.center;
      const edges = global.DesignerScene.nearestEdges(scene.outline, c.x, c.y);

      // Horizontal: distance to nearest vertical edge -> bottom band.
      const dLeft = c.x - edges.left;
      const dRight = edges.right - c.x;
      const fromRight = dRight < dLeft;
      const exA = fromRight ? edges.right : edges.left;
      const exB = c.x;
      const hVal = Math.abs(exB - exA);
      if (hVal > 1) {
        const t = roundMM(hVal) + "mm";
        const w = Math.max(labelWmm(t), Math.abs(exB - exA)) + marginMM;
        const ctr = (exA + exB) / 2;
        bottom.push({
          s: ctr - w / 2,
          e: ctr + w / 2,
          aX: exA,
          bX: exB,
          anchorY: bb.minY,
          text: t,
          value: hVal,
          priority: 1,
          editable: {
            type: "workX",
            workIndex: work.index,
            ref: fromRight ? "right" : "left",
            edge: exA,
            value: roundMM(hVal),
          },
        });
      }

      // Vertical: distance to nearest horizontal edge -> left band.
      const dBottom = c.y - edges.bottom;
      const dTop = edges.top - c.y;
      const fromTop = dTop < dBottom;
      const eyA = fromTop ? edges.top : edges.bottom;
      const eyB = c.y;
      const vVal = Math.abs(eyB - eyA);
      if (vVal > 1) {
        const t = roundMM(vVal) + "mm";
        const h = Math.max(labelWmm(t), Math.abs(eyB - eyA)) + marginMM;
        const ctr = (eyA + eyB) / 2;
        left.push({
          s: ctr - h / 2,
          e: ctr + h / 2,
          aY: eyA,
          bY: eyB,
          anchorX: bb.minX,
          text: t,
          value: vVal,
          priority: 1,
          editable: {
            type: "workY",
            workIndex: work.index,
            ref: fromTop ? "top" : "bottom",
            edge: eyA,
            value: roundMM(vVal),
          },
        });
      }
    });

    // ---- resolve lanes & emit primitives ----
    assignLanes(bottom).forEach((it) => {
      const lineY = bb.minY - (gapMM + it.lane * stepMM);
      dims.push({
        kind: "linear",
        orient: "h",
        extA: { x: it.aX, y: it.anchorY },
        extB: { x: it.bX, y: it.anchorY },
        lineA: { x: it.aX, y: lineY },
        lineB: { x: it.bX, y: lineY },
        textPos: { x: (it.aX + it.bX) / 2, y: lineY - textHmm * 0.55 },
        text: it.text,
        value: it.value,
        hitHalfW: labelWmm(it.text) / 2 + marginMM / 2,
        hitHalfH: textHmm / 2,
        editable: it.editable,
      });
    });

    assignLanes(left).forEach((it) => {
      const lineX = bb.minX - (gapMM + it.lane * stepMM);
      dims.push({
        kind: "linear",
        orient: "v",
        extA: { x: it.anchorX, y: it.aY },
        extB: { x: it.anchorX, y: it.bY },
        lineA: { x: lineX, y: it.aY },
        lineB: { x: lineX, y: it.bY },
        textPos: { x: lineX - textHmm * 0.55, y: (it.aY + it.bY) / 2 },
        text: it.text,
        value: it.value,
        hitHalfW: textHmm / 2,
        hitHalfH: labelWmm(it.text) / 2 + marginMM / 2,
        editable: it.editable,
      });
    });

    // ---- polygon side-length labels (non-rectangular shapes) ----
    const shape = scene.glass.shape;
    const sides = scene.outline.sides;
    if (
      shape !== "rectangle" &&
      shape !== "circle" &&
      sides.length <= 12
    ) {
      const placed = []; // canvas-mm bboxes already taken, for simple de-overlap
      const baseOffMM = 16 / scale;
      sides.forEach((side) => {
        if (side.length < 10) return;
        const t = side.index + 1 + ": " + roundMM(side.length) + "mm";
        const halfW = labelWmm(t) / 2 + marginMM / 2;
        const halfH = textHmm / 2;
        let off = baseOffMM;
        let pos;
        // Push outward until it stops overlapping an already-placed label.
        for (let tries = 0; tries < 6; tries++) {
          pos = {
            x: side.mid.x + side.normal.x * off,
            y: side.mid.y + side.normal.y * off,
          };
          const overlap = placed.some(
            (q) =>
              Math.abs(q.x - pos.x) < q.halfW + halfW &&
              Math.abs(q.y - pos.y) < q.halfH + halfH,
          );
          if (!overlap) break;
          off += textHmm * 1.1;
        }
        placed.push({ x: pos.x, y: pos.y, halfW, halfH });
        dims.push({
          kind: "edge",
          textPos: pos,
          badgePos: { x: side.mid.x, y: side.mid.y },
          badgeNum: side.index + 1,
          text: roundMM(side.length) + "mm",
          value: side.length,
          hitHalfW: halfW,
          hitHalfH: halfH,
          editable: {
            type: "side",
            sideIndex: side.index,
            value: roundMM(side.length),
          },
        });
      });
    }

    return dims;
  }

  global.DesignerDimensions = { layout, assignLanes };
})(typeof window !== "undefined" ? window : this);
