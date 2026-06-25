/**
 * Canvas renderer (live editing).
 *
 * Pure function: draws a scene (built by scene.js) onto a 2D context using a
 * view transform. It owns NO geometry decisions — every position comes from the
 * scene — so it stays in lock-step with the SVG print renderer.
 *
 * Returns the measurement hit-areas (in canvas pixels) so the designer can wire
 * click-to-edit.
 *
 * Exposed as the global `renderSceneToCanvas`.
 */
(function (global) {
  "use strict";

  function roundRectPath(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
    }
  }

  function renderSceneToCanvas(ctx, scene, view, theme) {
    const scale = view.scale;
    const ox = view.offsetX;
    const oy = view.offsetY;
    const gh = view.glassHeight;
    const W = view.canvasWidth;
    const H = view.canvasHeight;
    const hitAreas = [];

    // mm -> canvas px (Y inverted, 0 at bottom)
    const g2c = (x, y) => ({ x: x * scale + ox, y: (gh - y) * scale + oy });

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // ---- background ----
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, W, H);

    // ---- grid ----
    if (theme.mode === "live") drawGrid();

    // ---- paint areas (under the part) ----
    ctx.globalAlpha = theme.paintAlpha;
    for (const p of scene.paint) {
      ctx.fillStyle = p.color || "#ffffff";
      if (p.isWholeGlass) {
        drawPolygon(scene.outline.points);
        ctx.fill();
      } else {
        const a = g2c(p.x, p.y + (p.height || 0));
        ctx.fillRect(a.x, a.y, (p.width || 0) * scale, (p.height || 0) * scale);
      }
    }
    ctx.globalAlpha = 1;

    // ---- glass outline ----
    drawPolygon(scene.outline.points);
    ctx.fillStyle = theme.glassFill;
    ctx.fill();
    ctx.strokeStyle = theme.glassStroke;
    ctx.lineWidth = theme.glassStrokeWidth;
    ctx.lineJoin = "round";
    ctx.stroke();

    // ---- works ----
    for (const work of scene.works) drawWork(work);

    // ---- work number badges (cross-reference to the print legend) ----
    ctx.font = "700 10px " + theme.fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const work of scene.works) drawWorkTag(work);

    // ---- dimensions ----
    ctx.font = "600 " + theme.dimFontPx + "px " + theme.fontFamily;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const d of scene.dims) {
      if (d.kind === "linear") drawLinearDim(d);
      else if (d.kind === "edge") drawEdgeDim(d);
    }

    ctx.restore();
    return hitAreas;

    // ---------- helpers ----------

    function drawPolygon(points) {
      ctx.beginPath();
      points.forEach((p, i) => {
        const c = g2c(p.x, p.y);
        if (i === 0) ctx.moveTo(c.x, c.y);
        else ctx.lineTo(c.x, c.y);
      });
      ctx.closePath();
    }

    function drawGrid() {
      const minorMM = theme.gridStepMM / theme.gridSubdivisions;
      // mm extents covering the whole canvas
      const xMin = (0 - ox) / scale;
      const xMax = (W - ox) / scale;
      const yTop = gh - (0 - oy) / scale;
      const yBot = gh - (H - oy) / scale;
      const startX = Math.floor(Math.min(xMin, xMax) / minorMM) * minorMM;
      const endX = Math.ceil(Math.max(xMin, xMax) / minorMM) * minorMM;
      const startY = Math.floor(Math.min(yTop, yBot) / minorMM) * minorMM;
      const endY = Math.ceil(Math.max(yTop, yBot) / minorMM) * minorMM;

      ctx.lineWidth = 1;
      for (let x = startX; x <= endX; x += minorMM) {
        const isMajor = Math.abs(x % theme.gridStepMM) < 0.01;
        ctx.strokeStyle = isMajor ? theme.gridMajor : theme.gridMinor;
        const a = g2c(x, yBot);
        const b = g2c(x, yTop);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += minorMM) {
        const isMajor = Math.abs(y % theme.gridStepMM) < 0.01;
        ctx.strokeStyle = isMajor ? theme.gridMajor : theme.gridMinor;
        const a = g2c(xMin, y);
        const b = g2c(xMax, y);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    function drawWork(work) {
      const stroke = work.selected ? theme.workSelected : theme.workStroke;
      ctx.strokeStyle = stroke;
      ctx.fillStyle = theme.workFill;
      ctx.lineWidth = work.selected
        ? theme.workStrokeWidth + 1
        : theme.workStrokeWidth;
      const g = work.geom;

      if (g.kind === "circle" || g.kind === "drill") {
        const c = g2c(g.cx, g.cy);
        const r = g.r * scale;
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(r, 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (g.kind === "drill") {
          const ch = Math.max(5, r * 0.8);
          ctx.beginPath();
          ctx.moveTo(c.x - ch, c.y);
          ctx.lineTo(c.x + ch, c.y);
          ctx.moveTo(c.x, c.y - ch);
          ctx.lineTo(c.x, c.y + ch);
          ctx.stroke();
        }
        drawCenter(c, stroke);
      } else if (g.kind === "ring") {
        const c = g2c(g.cx, g.cy);
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(g.r * scale, 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(g.rInner * scale, 1), 0, Math.PI * 2);
        ctx.stroke();
        drawCenter(c, stroke);
      } else if (g.kind === "rect") {
        const tl = g2c(g.x, g.y + g.h);
        ctx.fillRect(tl.x, tl.y, g.w * scale, g.h * scale);
        ctx.strokeRect(tl.x, tl.y, g.w * scale, g.h * scale);
        drawCenter(g2c(g.x + g.w / 2, g.y + g.h / 2), stroke);
      } else if (g.kind === "clip" || g.kind === "poly") {
        ctx.beginPath();
        g.points.forEach((p, i) => {
          const c = g2c(p.x, p.y);
          if (i === 0) ctx.moveTo(c.x, c.y);
          else ctx.lineTo(c.x, c.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (work.center) drawCenter(g2c(work.center.x, work.center.y), stroke);
      } else if (g.kind === "group") {
        g.items.forEach(drawItem);
        if (work.center) drawCenter(g2c(work.center.x, work.center.y), stroke);
      }
    }

    function drawItem(it) {
      if (it.t === "circle") {
        const c = g2c(it.cx, it.cy);
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(it.r * scale, 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (it.t === "ring") {
        const c = g2c(it.cx, it.cy);
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(it.r * scale, 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(it.rInner * scale, 1), 0, Math.PI * 2);
        ctx.stroke();
      } else if (it.t === "rect") {
        const tl = g2c(it.x, it.y + it.h);
        ctx.fillRect(tl.x, tl.y, it.w * scale, it.h * scale);
        ctx.strokeRect(tl.x, tl.y, it.w * scale, it.h * scale);
      } else if (it.t === "slot") {
        slotPath(it);
        ctx.fill();
        ctx.stroke();
      } else if (it.t === "poly") {
        ctx.beginPath();
        it.points.forEach((p, i) => {
          const c = g2c(p.x, p.y);
          if (i === 0) ctx.moveTo(c.x, c.y);
          else ctx.lineTo(c.x, c.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    function slotPath(it) {
      const c = g2c(it.cx, it.cy);
      const L = it.length * scale;
      const Wd = it.width * scale;
      ctx.beginPath();
      if (!it.vertical) {
        const r = Wd / 2;
        const x0 = c.x - L / 2 + r;
        const x1 = c.x + L / 2 - r;
        ctx.arc(x1, c.y, r, -Math.PI / 2, Math.PI / 2);
        ctx.arc(x0, c.y, r, Math.PI / 2, (3 * Math.PI) / 2);
      } else {
        const r = Wd / 2;
        const y0 = c.y - L / 2 + r;
        const y1 = c.y + L / 2 - r;
        ctx.arc(c.x, y0, r, Math.PI, 0);
        ctx.arc(c.x, y1, r, 0, Math.PI);
      }
      ctx.closePath();
    }

    function drawWorkTag(work) {
      if (work.tag == null) return;
      // Badge sits just off the work's top-right corner.
      const corner = g2c(work.bbox.maxX, work.bbox.maxY);
      const bx = corner.x + 9;
      const by = corner.y - 9;
      ctx.fillStyle = work.selected ? theme.workSelected : theme.workStroke;
      ctx.beginPath();
      ctx.arc(bx, by, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = theme.background;
      ctx.fillText(String(work.tag), bx, by);
    }

    function drawCenter(c, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    function tick(c, ang) {
      // short architectural slash tick
      const len = 4;
      const dx = Math.cos(ang) * len;
      const dy = Math.sin(ang) * len;
      ctx.beginPath();
      ctx.moveTo(c.x - dx, c.y - dy);
      ctx.lineTo(c.x + dx, c.y + dy);
      ctx.stroke();
    }

    function drawLinearDim(d) {
      ctx.strokeStyle = theme.dimLine;
      ctx.lineWidth = 1;
      // extension / leader lines (dotted ones point at the notch they measure)
      (d.ext || []).forEach((e) => {
        const a = g2c(e.x, e.y);
        const b = g2c(e.x2, e.y2);
        ctx.setLineDash(e.dash ? [2, 3] : []);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      const lA = g2c(d.lineA.x, d.lineA.y);
      const lB = g2c(d.lineB.x, d.lineB.y);
      // dimension line
      ctx.beginPath();
      ctx.moveTo(lA.x, lA.y);
      ctx.lineTo(lB.x, lB.y);
      ctx.stroke();
      // ticks (45deg)
      tick(lA, Math.PI / 4);
      tick(lB, Math.PI / 4);
      // label
      drawDimLabel(d, g2c(d.textPos.x, d.textPos.y));
    }

    function drawDimLabel(d, tp) {
      const vertical = d.orient === "v";
      ctx.save();
      ctx.translate(tp.x, tp.y);
      if (vertical) ctx.rotate(-Math.PI / 2);
      const tw = ctx.measureText(d.text).width;
      const pw = tw + 10;
      const ph = theme.dimFontPx + 6;
      ctx.fillStyle = theme.dimTextBg;
      roundRectPath(ctx, -pw / 2, -ph / 2, pw, ph, 3);
      ctx.fill();
      ctx.fillStyle = theme.dimText;
      ctx.fillText(d.text, 0, 0);
      ctx.restore();
      // hit area (axis-aligned bbox in canvas px)
      const hw = (vertical ? (theme.dimFontPx + 6) : ctx.measureText(d.text).width + 10) / 2;
      const hh = (vertical ? ctx.measureText(d.text).width + 10 : theme.dimFontPx + 6) / 2;
      hitAreas.push({
        x: tp.x,
        y: tp.y,
        w: hw * 2 + 6,
        h: hh * 2 + 6,
        editable: d.editable,
        value: d.editable.value,
      });
    }

    function drawEdgeDim(d) {
      const tp = g2c(d.textPos.x, d.textPos.y);
      const tw = ctx.measureText(d.text).width;
      const pw = tw + 10;
      const ph = theme.dimFontPx + 5;
      ctx.fillStyle = theme.dimTextBg;
      roundRectPath(ctx, tp.x - pw / 2, tp.y - ph / 2, pw, ph, 3);
      ctx.fill();
      ctx.fillStyle = theme.dimText;
      ctx.fillText(d.text, tp.x, tp.y);
      // side badge on the edge
      const bp = g2c(d.badgePos.x, d.badgePos.y);
      ctx.fillStyle = theme.sideBadgeFill;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = theme.sideBadgeText;
      ctx.font = "700 9px " + theme.fontFamily;
      ctx.fillText(String(d.badgeNum), bp.x, bp.y);
      ctx.font = "600 " + theme.dimFontPx + "px " + theme.fontFamily;
      hitAreas.push({
        x: tp.x,
        y: tp.y,
        w: pw + 6,
        h: ph + 6,
        editable: d.editable,
        value: d.editable.value,
      });
    }
  }

  global.renderSceneToCanvas = renderSceneToCanvas;
})(typeof window !== "undefined" ? window : this);
