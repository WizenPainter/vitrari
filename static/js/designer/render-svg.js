/**
 * SVG renderer (print + export).
 *
 * Consumes the SAME scene object as the live canvas renderer, so the printed /
 * exported drawing is identical in layout to what is on screen — just crisp
 * vector instead of raster, and themed for paper (white background, black
 * lines). Because dimension lanes were already resolved in scene.js, there is
 * zero chance of measurement overlap on paper.
 *
 * Exposed as the global `renderSceneToSVG` -> returns an SVG markup string.
 */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s).replace(/[<>&"]/g, (c) => {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
    });
  }

  /** Collect the mm bounding box of everything drawable (part + works + dims). */
  function sceneBounds(scene) {
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
    scene.outline.points.forEach((p) => eat(p.x, p.y));
    scene.works.forEach((w) => {
      eat(w.bbox.minX, w.bbox.minY);
      eat(w.bbox.maxX, w.bbox.maxY);
    });
    scene.dims.forEach((d) => {
      if (d.kind === "linear") {
        [d.extA, d.extB, d.lineA, d.lineB].forEach((p) => eat(p.x, p.y));
      }
      const hw = d.hitHalfW || 0;
      const hh = d.hitHalfH || 0;
      eat(d.textPos.x - hw, d.textPos.y - hh);
      eat(d.textPos.x + hw, d.textPos.y + hh);
    });
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }

  function renderSceneToSVG(scene, opts) {
    opts = opts || {};
    const theme = opts.theme || global.DESIGNER_THEME.print;
    const targetW = opts.targetWidth || 1000;
    const pad = opts.padding != null ? opts.padding : 24;
    const fontPx = opts.fontPx || theme.dimFontPx || 12;

    const b = sceneBounds(scene);
    const scale = b.w > 0 ? targetW / b.w : 1;
    const W = b.w * scale + pad * 2;
    const H = b.h * scale + pad * 2;

    // mm -> svg px (Y down)
    const px = (x, y) => ({
      x: (x - b.minX) * scale + pad,
      y: (b.maxY - y) * scale + pad,
    });

    const out = [];
    out.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(1)}" height="${H.toFixed(
        1,
      )}" viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" font-family="${esc(
        theme.fontFamily,
      )}">`,
    );
    out.push(`<rect width="${W.toFixed(1)}" height="${H.toFixed(1)}" fill="${theme.background}"/>`);

    // paint
    scene.paint.forEach((p) => {
      const a = px(p.x, p.y + (p.height || 0));
      if (p.isWholeGlass) {
        out.push(polyPath(scene.outline.points, p.color || "#eee", "none", 0, theme.paintAlpha));
      } else {
        out.push(
          `<rect x="${a.x.toFixed(1)}" y="${a.y.toFixed(1)}" width="${(
            (p.width || 0) * scale
          ).toFixed(1)}" height="${((p.height || 0) * scale).toFixed(
            1,
          )}" fill="${p.color || "#eee"}" opacity="${theme.paintAlpha}"/>`,
        );
      }
    });

    // glass outline
    out.push(
      polyPath(
        scene.outline.points,
        theme.glassFill,
        theme.glassStroke,
        theme.glassStrokeWidth,
      ),
    );

    // works
    scene.works.forEach((work) => drawWork(work));

    // dimensions
    scene.dims.forEach((d) => {
      if (d.kind === "linear") drawLinear(d);
      else if (d.kind === "edge") drawEdge(d);
    });

    out.push("</svg>");
    return out.join("");

    // ---------- helpers ----------

    function polyPath(points, fill, stroke, sw, opacity) {
      const d =
        points
          .map((p, i) => {
            const c = px(p.x, p.y);
            return (i === 0 ? "M" : "L") + c.x.toFixed(1) + " " + c.y.toFixed(1);
          })
          .join(" ") + " Z";
      return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${
        sw || 0
      }" stroke-linejoin="round"${opacity != null ? ` opacity="${opacity}"` : ""}/>`;
    }

    function line(a2, b2, color, sw) {
      return `<line x1="${a2.x.toFixed(1)}" y1="${a2.y.toFixed(1)}" x2="${b2.x.toFixed(
        1,
      )}" y2="${b2.y.toFixed(1)}" stroke="${color}" stroke-width="${sw}"/>`;
    }

    function circle(c, r, fill, stroke, sw) {
      return `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${r.toFixed(
        1,
      )}" fill="${fill}" stroke="${stroke}" stroke-width="${sw || 0}"/>`;
    }

    function text(c, str, anchor, rotate) {
      const transform = rotate
        ? ` transform="rotate(${rotate} ${c.x.toFixed(1)} ${c.y.toFixed(1)})"`
        : "";
      return `<text x="${c.x.toFixed(1)}" y="${c.y.toFixed(
        1,
      )}" font-size="${fontPx}" font-weight="600" fill="${theme.dimText}" text-anchor="${
        anchor || "middle"
      }" dominant-baseline="central"${transform}>${esc(str)}</text>`;
    }

    function drawWork(work) {
      const stroke = theme.workStroke;
      const sw = theme.workStrokeWidth;
      const g = work.geom;
      if (g.kind === "circle" || g.kind === "drill") {
        const c = px(g.cx, g.cy);
        out.push(circle(c, Math.max(g.r * scale, 1), theme.workFill, stroke, sw));
        if (g.kind === "drill") {
          const ch = Math.max(5, g.r * scale * 0.8);
          out.push(line({ x: c.x - ch, y: c.y }, { x: c.x + ch, y: c.y }, stroke, sw));
          out.push(line({ x: c.x, y: c.y - ch }, { x: c.x, y: c.y + ch }, stroke, sw));
        }
      } else if (g.kind === "ring") {
        const c = px(g.cx, g.cy);
        out.push(circle(c, Math.max(g.r * scale, 1), theme.workFill, stroke, sw));
        out.push(circle(c, Math.max(g.rInner * scale, 1), "none", stroke, sw));
      } else if (g.kind === "rect") {
        const tl = px(g.x, g.y + g.h);
        out.push(
          `<rect x="${tl.x.toFixed(1)}" y="${tl.y.toFixed(1)}" width="${(
            g.w * scale
          ).toFixed(1)}" height="${(g.h * scale).toFixed(1)}" fill="${
            theme.workFill
          }" stroke="${stroke}" stroke-width="${sw}"/>`,
        );
      } else if (g.kind === "clip" || g.kind === "poly") {
        out.push(polyPath(g.points, theme.workFill, stroke, sw));
      } else if (g.kind === "group") {
        g.items.forEach((it) => drawItem(it, stroke, sw));
      }
    }

    function drawItem(it, stroke, sw) {
      if (it.t === "circle") {
        out.push(circle(px(it.cx, it.cy), Math.max(it.r * scale, 1), theme.workFill, stroke, sw));
      } else if (it.t === "ring") {
        const c = px(it.cx, it.cy);
        out.push(circle(c, Math.max(it.r * scale, 1), theme.workFill, stroke, sw));
        out.push(circle(c, Math.max(it.rInner * scale, 1), "none", stroke, sw));
      } else if (it.t === "rect") {
        const tl = px(it.x, it.y + it.h);
        out.push(
          `<rect x="${tl.x.toFixed(1)}" y="${tl.y.toFixed(1)}" width="${(
            it.w * scale
          ).toFixed(1)}" height="${(it.h * scale).toFixed(1)}" fill="${
            theme.workFill
          }" stroke="${stroke}" stroke-width="${sw}"/>`,
        );
      } else if (it.t === "slot") {
        const c = px(it.cx, it.cy);
        const L = it.length * scale;
        const Wd = it.width * scale;
        const w = it.vertical ? Wd : L;
        const h = it.vertical ? L : Wd;
        out.push(
          `<rect x="${(c.x - w / 2).toFixed(1)}" y="${(c.y - h / 2).toFixed(
            1,
          )}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${(Wd / 2).toFixed(
            1,
          )}" fill="${theme.workFill}" stroke="${stroke}" stroke-width="${sw}"/>`,
        );
      } else if (it.t === "poly") {
        out.push(polyPath(it.points, theme.workFill, stroke, sw));
      }
    }

    function drawLinear(d) {
      out.push(line(px(d.extA.x, d.extA.y), px(d.lineA.x, d.lineA.y), theme.dimLine, 0.6));
      out.push(line(px(d.extB.x, d.extB.y), px(d.lineB.x, d.lineB.y), theme.dimLine, 0.6));
      out.push(line(px(d.lineA.x, d.lineA.y), px(d.lineB.x, d.lineB.y), theme.dimLine, 0.8));
      const tp = px(d.textPos.x, d.textPos.y);
      const rotate = d.orient === "v" ? -90 : 0;
      out.push(bgRect(tp, d.text, rotate));
      out.push(text(tp, d.text, "middle", rotate));
    }

    function drawEdge(d) {
      const tp = px(d.textPos.x, d.textPos.y);
      out.push(bgRect(tp, d.text, 0));
      out.push(text(tp, d.text, "middle", 0));
      const bp = px(d.badgePos.x, d.badgePos.y);
      out.push(circle(bp, 8, theme.sideBadgeFill, "none", 0));
      out.push(
        `<text x="${bp.x.toFixed(1)}" y="${bp.y.toFixed(
          1,
        )}" font-size="9" font-weight="700" fill="${
          theme.sideBadgeText
        }" text-anchor="middle" dominant-baseline="central">${d.badgeNum}</text>`,
      );
    }

    function bgRect(tp, str, rotate) {
      const w = str.length * fontPx * 0.62 + 8;
      const h = fontPx + 6;
      const transform = rotate
        ? ` transform="rotate(${rotate} ${tp.x.toFixed(1)} ${tp.y.toFixed(1)})"`
        : "";
      return `<rect x="${(tp.x - w / 2).toFixed(1)}" y="${(tp.y - h / 2).toFixed(
        1,
      )}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${
        theme.dimTextBg
      }" stroke="${theme.dimLine}" stroke-width="0.4"${transform}/>`;
    }
  }

  global.renderSceneToSVG = renderSceneToSVG;
})(typeof window !== "undefined" ? window : this);
