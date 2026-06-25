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

  function renderSceneToSVG(scene, opts) {
    opts = opts || {};
    const theme = opts.theme || global.DESIGNER_THEME.print;
    const targetW = opts.targetWidth || 1000;
    const pad = opts.padding != null ? opts.padding : 24;
    const fontPx = opts.fontPx || theme.dimFontPx || 12;

    const b = global.DesignerScene.sceneBounds(scene);
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

    // work number badges (cross-reference to the legend)
    scene.works.forEach((work) => {
      if (work.tag == null) return;
      const corner = px(work.bbox.maxX, work.bbox.maxY);
      const bx = corner.x + 10;
      const by = corner.y - 10;
      out.push(circle({ x: bx, y: by }, 8.5, theme.workStroke, "none", 0));
      out.push(
        `<text x="${bx.toFixed(1)}" y="${by.toFixed(
          1,
        )}" font-size="10" font-weight="700" fill="${theme.background}" text-anchor="middle" dominant-baseline="central">${work.tag}</text>`,
      );
    });

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

    function line(a2, b2, color, sw, dash) {
      const da = dash ? ` stroke-dasharray="2 3"` : "";
      return `<line x1="${a2.x.toFixed(1)}" y1="${a2.y.toFixed(1)}" x2="${b2.x.toFixed(
        1,
      )}" y2="${b2.y.toFixed(1)}" stroke="${color}" stroke-width="${sw}"${da}/>`;
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
      (d.ext || []).forEach((e) => {
        out.push(line(px(e.x, e.y), px(e.x2, e.y2), theme.dimLine, 0.6, e.dash));
      });
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

  /** Flatten any work geometry into a uniform primitive-item list. */
  function geomToItems(g) {
    if (!g) return [];
    if (g.kind === "group") return g.items;
    if (g.kind === "circle")
      return [{ t: "circle", cx: g.cx, cy: g.cy, r: g.r }];
    if (g.kind === "drill")
      return [
        { t: "circle", cx: g.cx, cy: g.cy, r: g.r },
        { t: "cross", cx: g.cx, cy: g.cy, r: g.r },
      ];
    if (g.kind === "ring")
      return [{ t: "ring", cx: g.cx, cy: g.cy, r: g.r, rInner: g.rInner }];
    if (g.kind === "rect")
      return [{ t: "rect", x: g.x, y: g.y, w: g.w, h: g.h }];
    if (g.kind === "clip" || g.kind === "poly")
      return [{ t: "poly", points: g.points }];
    return [];
  }

  /**
   * Decide which dimensions to annotate based on the primitive geometry, so the
   * thumbnail reads like a real CAD detail (a diameter line through a circle, a
   * width+height pair on a rectangle, length+width on a slot, etc.). Coordinates
   * are in the work's local (normalised) mm frame, Y up.
   */
  function geometryDimensions(items, w, h) {
    const r = (n) => Math.round(n || 0);
    const real = items.filter((i) => i.t !== "cross");
    const circles = real.filter((i) => i.t === "circle");
    const ann = [];

    if (real.length === 1 && real[0].t === "circle") {
      const c = real[0];
      ann.push({ kind: "dia", cx: c.cx, cy: c.cy, r: c.r, label: "Ø" + r(c.r * 2) });
    } else if (real.length === 1 && real[0].t === "ring") {
      const c = real[0];
      ann.push({ kind: "dia", cx: c.cx, cy: c.cy, r: c.r, label: "Ø" + r(c.r * 2), side: "up" });
      ann.push({ kind: "dia", cx: c.cx, cy: c.cy, r: c.rInner, label: "Ø" + r(c.rInner * 2), side: "down" });
    } else if (real.length === 1 && real[0].t === "rect") {
      const q = real[0];
      ann.push({ kind: "hbottom", x1: q.x, x2: q.x + q.w, label: r(q.w) });
      ann.push({ kind: "vleft", y1: q.y, y2: q.y + q.h, label: r(q.h) });
    } else if (real.length === 1 && real[0].t === "slot") {
      const s = real[0];
      const L = s.vertical ? s.width : s.length;
      const Hh = s.vertical ? s.length : s.width;
      ann.push({ kind: "hbottom", x1: s.cx - L / 2, x2: s.cx + L / 2, label: r(L) });
      ann.push({ kind: "vleft", y1: s.cy - Hh / 2, y2: s.cy + Hh / 2, label: r(Hh) });
    } else if (circles.length === 2 && real.length === 2) {
      const a = circles[0];
      const bC = circles[1];
      ann.push({ kind: "dia", cx: a.cx, cy: a.cy, r: a.r, label: "Ø" + r(a.r * 2) });
      ann.push({ kind: "span", x1: a.cx, y1: a.cy, x2: bC.cx, y2: bC.cy, label: r(Math.hypot(bC.cx - a.cx, bC.cy - a.cy)) });
    } else {
      // default: overall bounding box width × height
      ann.push({ kind: "hbottom", x1: 0, x2: w, label: r(w) });
      ann.push({ kind: "vleft", y1: 0, y2: h, label: r(h) });
    }
    return ann;
  }

  /**
   * Render a single work as a small, self-contained, FULLY DIMENSIONED outline
   * SVG (used in the print legend) — the actual notch drawn with its measurement
   * lines and values on it, like a CAD detail.
   */
  function renderWorkThumbnail(work, opts) {
    opts = opts || {};
    const theme = opts.theme || global.DESIGNER_THEME.print;
    const b = work.bbox;
    const w = b.maxX - b.minX || 1;
    const h = b.maxY - b.minY || 1;
    const md = Math.max(w, h);
    const fs = Math.max(md * 0.14, 6);
    const off = md * 0.26;
    const tick = md * 0.05;
    const sw = Math.max(md * 0.02, 0.4);
    const stroke = theme.workStroke;
    const dimColor = theme.dimLine;

    // Normalise geometry to a local frame (origin at bbox min, Y up).
    const items = geomToItems(work.geom).map((it) => {
      if (it.t === "poly")
        return { t: "poly", points: it.points.map((p) => ({ x: p.x - b.minX, y: p.y - b.minY })) };
      const o = Object.assign({}, it);
      if (o.cx != null) o.cx -= b.minX;
      if (o.cy != null) o.cy -= b.minY;
      if (o.x != null) o.x -= b.minX;
      if (o.y != null) o.y -= b.minY;
      return o;
    });

    // Collect drawable descriptors and track bounds (so the viewBox fits dims).
    const els = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const eat = (x, y) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    };
    const eatBox = (x, y, hw, hh) => { eat(x - hw, y - hh); eat(x + hw, y + hh); };
    const addLine = (x1, y1, x2, y2, color, dash) => {
      els.push({ type: "line", x1, y1, x2, y2, color, dash });
      eat(x1, y1); eat(x2, y2);
    };
    const addText = (x, y, str, rotate) => {
      els.push({ type: "text", x, y, str, rotate });
      const tw = str.length * fs * 0.62 + 2;
      if (rotate) eatBox(x, y, fs / 2 + 1, tw / 2); else eatBox(x, y, tw / 2, fs / 2 + 1);
    };

    // geometry
    items.forEach((it) => {
      if (it.t === "circle") {
        els.push({ type: "circle", cx: it.cx, cy: it.cy, r: it.r, color: stroke });
        eat(it.cx - it.r, it.cy - it.r); eat(it.cx + it.r, it.cy + it.r);
      } else if (it.t === "cross") {
        const cr = it.r * 0.7;
        addLine(it.cx - cr, it.cy, it.cx + cr, it.cy, stroke);
        addLine(it.cx, it.cy - cr, it.cx, it.cy + cr, stroke);
      } else if (it.t === "ring") {
        els.push({ type: "circle", cx: it.cx, cy: it.cy, r: it.r, color: stroke });
        els.push({ type: "circle", cx: it.cx, cy: it.cy, r: it.rInner, color: stroke });
        eat(it.cx - it.r, it.cy - it.r); eat(it.cx + it.r, it.cy + it.r);
      } else if (it.t === "rect") {
        els.push({ type: "rect", x: it.x, y: it.y, w: it.w, h: it.h, color: stroke });
        eat(it.x, it.y); eat(it.x + it.w, it.y + it.h);
      } else if (it.t === "slot") {
        const ww = it.vertical ? it.width : it.length;
        const hh = it.vertical ? it.length : it.width;
        els.push({ type: "rect", x: it.cx - ww / 2, y: it.cy - hh / 2, w: ww, h: hh, rx: it.width / 2, color: stroke });
        eat(it.cx - ww / 2, it.cy - hh / 2); eat(it.cx + ww / 2, it.cy + hh / 2);
      } else if (it.t === "poly") {
        els.push({ type: "poly", points: it.points, color: stroke });
        it.points.forEach((p) => eat(p.x, p.y));
      }
    });

    // dimension annotations on the geometry
    geometryDimensions(items, w, h).forEach((a) => {
      if (a.kind === "dia") {
        addLine(a.cx - a.r, a.cy, a.cx + a.r, a.cy, dimColor);
        const ly = a.side === "down" ? a.cy - fs * 0.95 : a.cy + fs * 0.95;
        addText(a.cx, ly, a.label);
      } else if (a.kind === "hbottom") {
        const yL = -off;
        addLine(a.x1, 0, a.x1, yL + tick, dimColor, true);
        addLine(a.x2, 0, a.x2, yL + tick, dimColor, true);
        addLine(a.x1, yL, a.x2, yL, dimColor);
        addText((a.x1 + a.x2) / 2, yL - fs * 0.85, String(a.label));
      } else if (a.kind === "vleft") {
        const xL = -off;
        addLine(0, a.y1, xL + tick, a.y1, dimColor, true);
        addLine(0, a.y2, xL + tick, a.y2, dimColor, true);
        addLine(xL, a.y1, xL, a.y2, dimColor);
        addText(xL - fs * 0.85, (a.y1 + a.y2) / 2, String(a.label), true);
      } else if (a.kind === "span") {
        addLine(a.x1, a.y1, a.x2, a.y2, dimColor);
        addText((a.x1 + a.x2) / 2, (a.y1 + a.y2) / 2 + fs * 0.85, String(a.label));
      }
    });

    // viewBox from accumulated bounds; emit with Y flipped to SVG space.
    const pad = md * 0.06 + fs * 0.3;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    const W = maxX - minX, H = maxY - minY;
    const fx = (x) => x - minX;
    const fy = (y) => maxY - y;
    const f = (n) => n.toFixed(2);

    const out = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(H)}" font-family="${esc(theme.fontFamily)}">`,
    ];
    els.forEach((e) => {
      if (e.type === "circle") {
        out.push(`<circle cx="${f(fx(e.cx))}" cy="${f(fy(e.cy))}" r="${f(e.r)}" fill="none" stroke="${e.color}" stroke-width="${f(sw)}"/>`);
      } else if (e.type === "line") {
        out.push(`<line x1="${f(fx(e.x1))}" y1="${f(fy(e.y1))}" x2="${f(fx(e.x2))}" y2="${f(fy(e.y2))}" stroke="${e.color}" stroke-width="${f(e.dash ? sw * 0.7 : sw)}"${e.dash ? ' stroke-dasharray="2 2"' : ""}/>`);
      } else if (e.type === "rect") {
        out.push(`<rect x="${f(fx(e.x))}" y="${f(fy(e.y + e.h))}" width="${f(e.w)}" height="${f(e.h)}"${e.rx ? ` rx="${f(e.rx)}"` : ""} fill="none" stroke="${e.color}" stroke-width="${f(sw)}"/>`);
      } else if (e.type === "poly") {
        out.push(`<polygon points="${e.points.map((p) => f(fx(p.x)) + "," + f(fy(p.y))).join(" ")}" fill="none" stroke="${e.color}" stroke-width="${f(sw)}"/>`);
      } else if (e.type === "text") {
        const x = fx(e.x), y = fy(e.y);
        const tw = e.str.length * fs * 0.62 + 2;
        const rot = e.rotate ? ` transform="rotate(-90 ${f(x)} ${f(y)})"` : "";
        const bw = e.rotate ? fs + 2 : tw;
        const bh = e.rotate ? tw : fs + 2;
        out.push(`<rect x="${f(x - bw / 2)}" y="${f(y - bh / 2)}" width="${f(bw)}" height="${f(bh)}" fill="${theme.background}"${rot}/>`);
        out.push(`<text x="${f(x)}" y="${f(y)}" font-size="${f(fs)}" font-weight="600" fill="${theme.dimText}" text-anchor="middle" dominant-baseline="central"${rot}>${esc(e.str)}</text>`);
      }
    });
    out.push("</svg>");
    return out.join("");
  }

  global.renderSceneToSVG = renderSceneToSVG;
  global.renderWorkThumbnail = renderWorkThumbnail;
})(typeof window !== "undefined" ? window : this);
