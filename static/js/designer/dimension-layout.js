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
    // Four bands, one per side of the part. Each dimension is placed on the side
    // NEAREST its feature so its dotted leader stays short and never crosses the
    // part: horizontal dims go to top/bottom, vertical dims to left/right.
    // Each item has two endpoints: `pos` along the band axis, `anchor` is where
    // the extension line meets the feature, `dash` marks the dotted notch leader.
    const bands = { top: [], bottom: [], left: [], right: [] };

    // Glass overall width (bottom) and height (left) — conventional datum sides.
    bands.bottom.push({
      s: bb.minX,
      e: bb.maxX,
      p0: { pos: bb.minX, anchor: bb.minY, dash: false },
      p1: { pos: bb.maxX, anchor: bb.minY, dash: false },
      text: roundMM(bb.w) + "mm",
      value: bb.w,
      editable: { type: "glassW", value: roundMM(bb.w) },
    });
    bands.left.push({
      s: bb.minY,
      e: bb.maxY,
      p0: { pos: bb.minY, anchor: bb.minX, dash: false },
      p1: { pos: bb.maxY, anchor: bb.minX, dash: false },
      text: roundMM(bb.h) + "mm",
      value: bb.h,
      editable: { type: "glassH", value: roundMM(bb.h) },
    });

    // Per-work positional dimensions: gap from the NEAREST glass edge to the
    // notch's near edge, in each axis. Each dim sits on the hole's nearest side.
    scene.works.forEach((work) => {
      const c = work.center;
      const wbx = work.bbox;
      const edges = global.DesignerScene.nearestEdges(scene.outline, c.x, c.y);

      // Round holes are dimensioned to their centre; cutouts to their near edge.
      const toCenter = work.dimRef === "center";
      const leftRef = toCenter ? c.x : wbx.minX;
      const rightRef = toCenter ? c.x : wbx.maxX;
      const bottomRef = toCenter ? c.y : wbx.minY;
      const topRef = toCenter ? c.y : wbx.maxY;

      const gapLeft = leftRef - edges.left;
      const gapRight = edges.right - rightRef;
      const useRight = gapRight < gapLeft;
      const gapBottom = bottomRef - edges.bottom;
      const gapTop = edges.top - topRef;
      const useTop = gapTop < gapBottom;

      // ----- horizontal dim (gap to nearest L/R edge), placed top or bottom -----
      const hVal = useRight ? gapRight : gapLeft;
      if (hVal > 1) {
        const datumX = useRight ? edges.right : edges.left;
        const notchX = useRight ? rightRef : leftRef;
        const t = roundMM(hVal) + "mm";
        const w = Math.max(labelWmm(t), Math.abs(notchX - datumX)) + marginMM;
        const ctr = (datumX + notchX) / 2;
        const hBand = useTop ? "top" : "bottom"; // nearest horizontal side
        const datumAnchorY = useTop ? bb.maxY : bb.minY;
        bands[hBand].push({
          s: ctr - w / 2,
          e: ctr + w / 2,
          p0: { pos: datumX, anchor: datumAnchorY, dash: false }, // glass edge
          p1: { pos: notchX, anchor: c.y, dash: true }, // dotted notch leader
          text: t,
          value: hVal,
          editable: {
            type: "workX",
            workIndex: work.index,
            ref: useRight ? "right" : "left",
            edge: datumX,
            value: roundMM(hVal),
          },
        });
      }

      // ----- vertical dim (gap to nearest T/B edge), placed left or right -----
      const vVal = useTop ? gapTop : gapBottom;
      if (vVal > 1) {
        const datumY = useTop ? edges.top : edges.bottom;
        const notchY = useTop ? topRef : bottomRef;
        const t = roundMM(vVal) + "mm";
        const h = Math.max(labelWmm(t), Math.abs(notchY - datumY)) + marginMM;
        const ctr = (datumY + notchY) / 2;
        const vBand = useRight ? "right" : "left"; // nearest vertical side
        const datumAnchorX = useRight ? bb.maxX : bb.minX;
        bands[vBand].push({
          s: ctr - h / 2,
          e: ctr + h / 2,
          p0: { pos: datumY, anchor: datumAnchorX, dash: false },
          p1: { pos: notchY, anchor: c.x, dash: true },
          text: t,
          value: vVal,
          editable: {
            type: "workY",
            workIndex: work.index,
            ref: useTop ? "top" : "bottom",
            edge: datumY,
            value: roundMM(vVal),
          },
        });
      }
    });

    // ---- resolve lanes & emit primitives ----
    const emitH = (items, side) => {
      assignLanes(items).forEach((it) => {
        const off = gapMM + it.lane * stepMM;
        const lineY = side === "bottom" ? bb.minY - off : bb.maxY + off;
        const textY =
          side === "bottom" ? lineY - textHmm * 0.55 : lineY + textHmm * 0.55;
        dims.push({
          kind: "linear",
          orient: "h",
          ext: [
            { x: it.p0.pos, y: it.p0.anchor, x2: it.p0.pos, y2: lineY, dash: it.p0.dash },
            { x: it.p1.pos, y: it.p1.anchor, x2: it.p1.pos, y2: lineY, dash: it.p1.dash },
          ],
          lineA: { x: it.p0.pos, y: lineY },
          lineB: { x: it.p1.pos, y: lineY },
          textPos: { x: (it.p0.pos + it.p1.pos) / 2, y: textY },
          text: it.text,
          value: it.value,
          hitHalfW: labelWmm(it.text) / 2 + marginMM / 2,
          hitHalfH: textHmm / 2,
          editable: it.editable,
        });
      });
    };
    const emitV = (items, side) => {
      assignLanes(items).forEach((it) => {
        const off = gapMM + it.lane * stepMM;
        const lineX = side === "left" ? bb.minX - off : bb.maxX + off;
        const textX =
          side === "left" ? lineX - textHmm * 0.55 : lineX + textHmm * 0.55;
        dims.push({
          kind: "linear",
          orient: "v",
          ext: [
            { x: it.p0.anchor, y: it.p0.pos, x2: lineX, y2: it.p0.pos, dash: it.p0.dash },
            { x: it.p1.anchor, y: it.p1.pos, x2: lineX, y2: it.p1.pos, dash: it.p1.dash },
          ],
          lineA: { x: lineX, y: it.p0.pos },
          lineB: { x: lineX, y: it.p1.pos },
          textPos: { x: textX, y: (it.p0.pos + it.p1.pos) / 2 },
          text: it.text,
          value: it.value,
          hitHalfW: textHmm / 2,
          hitHalfH: labelWmm(it.text) / 2 + marginMM / 2,
          editable: it.editable,
        });
      });
    };
    emitH(bands.bottom, "bottom");
    emitH(bands.top, "top");
    emitV(bands.left, "left");
    emitV(bands.right, "right");

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
