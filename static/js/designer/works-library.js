/**
 * Parametric "works" library — the common architectural-glass notches and
 * cutouts used on doors, railings, mirrors and shower enclosures.
 *
 * Each work is a template with editable parameters and a generate() that
 * returns geometry PRIMITIVES in a local mm frame centred on (0,0). The scene
 * resolver translates them to the placed position and both renderers (canvas +
 * SVG) draw the primitives, so a new work needs zero renderer changes.
 *
 * Primitive item shapes:
 *   { t:'circle', cx, cy, r }
 *   { t:'ring',   cx, cy, r, rInner }
 *   { t:'rect',   x, y, w, h }          // bottom-left origin, +y up
 *   { t:'poly',   points:[{x,y}...] }
 *   { t:'slot',   cx, cy, length, width, vertical }  // rounded capsule
 *
 * Exposed as the global `WORKS_LIBRARY` (+ `WORKS_CATEGORIES`).
 */
(function (global) {
  "use strict";

  // Rounded-rectangle polygon helper (corner radius r).
  function roundedRectPoly(w, h, r, segs) {
    segs = segs || 4;
    r = Math.min(r, w / 2, h / 2);
    const x0 = -w / 2,
      y0 = -h / 2,
      x1 = w / 2,
      y1 = h / 2;
    const pts = [];
    const corner = (cx, cy, a0, a1) => {
      for (let i = 0; i <= segs; i++) {
        const a = a0 + (a1 - a0) * (i / segs);
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
    };
    corner(x1 - r, y0 + r, -Math.PI / 2, 0); // bottom-right
    corner(x1 - r, y1 - r, 0, Math.PI / 2); // top-right
    corner(x0 + r, y1 - r, Math.PI / 2, Math.PI); // top-left
    corner(x0 + r, y0 + r, Math.PI, 1.5 * Math.PI); // bottom-left
    return pts;
  }

  function quarterArcPoly(r, quadrant, segs) {
    // A filled quarter-circle notch poly (corner radius / rounding).
    segs = segs || 10;
    const base = { tr: 0, tl: Math.PI / 2, bl: Math.PI, br: 1.5 * Math.PI }[
      quadrant || "tr"
    ];
    const pts = [{ x: 0, y: 0 }];
    for (let i = 0; i <= segs; i++) {
      const a = base + (Math.PI / 2) * (i / segs);
      pts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
    }
    return pts;
  }

  const P = (k, label, def, min, max) => ({ key: k, label, def, min, max });

  const WORKS_CATEGORIES = [
    { id: "hinges", name: "Hinges & Pivots" },
    { id: "pulls", name: "Pulls & Handles" },
    { id: "drilling", name: "Drilling" },
    { id: "locks", name: "Locks" },
    { id: "corners", name: "Corners & Edges" },
    { id: "notches", name: "Notches" },
    { id: "passthrough", name: "Pass-throughs" },
  ];

  const WORKS_LIBRARY = {
    // ---- Hinges & pivots ----
    "hinge-cutout": {
      name: "Hinge Cutout",
      category: "hinges",
      params: [P("w", "Width", 25, 5, 200), P("h", "Height", 110, 5, 400), P("r", "Corner R", 3, 0, 40)],
      generate: (p) => ({ items: [{ t: "poly", points: roundedRectPoly(p.w, p.h, p.r) }] }),
    },
    "hinge-notch-radius": {
      name: "Radius Hinge Notch",
      category: "hinges",
      params: [P("r", "Radius", 30, 5, 150)],
      generate: (p) => ({ items: [{ t: "poly", points: quarterArcPoly(p.r, "tr") }] }),
    },
    "patch-fitting-corner": {
      name: "Patch Fitting (corner)",
      category: "hinges",
      params: [P("w", "Width", 55, 10, 250), P("h", "Height", 120, 10, 400)],
      generate: (p) => ({ items: [{ t: "rect", x: -p.w / 2, y: -p.h / 2, w: p.w, h: p.h }] }),
    },
    "patch-lock-keeper": {
      name: "Patch Lock / Keeper",
      category: "hinges",
      params: [P("w", "Width", 40, 10, 150), P("h", "Height", 60, 10, 200), P("d", "Bolt Ø", 14, 2, 40)],
      generate: (p) => ({
        items: [
          { t: "rect", x: -p.w / 2, y: -p.h / 2, w: p.w, h: p.h },
          { t: "circle", cx: 0, cy: 0, r: p.d / 2 },
        ],
      }),
    },

    // ---- Pulls & handles ----
    "door-pull-pair": {
      name: "Door Pull (pair)",
      category: "pulls",
      params: [P("d", "Hole Ø", 12, 4, 40), P("spacing", "Spacing", 200, 20, 800)],
      generate: (p) => ({
        items: [
          { t: "circle", cx: -p.spacing / 2, cy: 0, r: p.d / 2 },
          { t: "circle", cx: p.spacing / 2, cy: 0, r: p.d / 2 },
        ],
      }),
    },
    "c-pull-pair": {
      name: "C-Pull (pair)",
      category: "pulls",
      params: [P("d", "Hole Ø", 12, 4, 40), P("spacing", "Spacing", 100, 20, 400)],
      generate: (p) => ({
        items: [
          { t: "circle", cx: 0, cy: -p.spacing / 2, r: p.d / 2 },
          { t: "circle", cx: 0, cy: p.spacing / 2, r: p.d / 2 },
        ],
      }),
    },
    "finger-pull-oval": {
      name: "Finger Pull (oval)",
      category: "pulls",
      params: [P("length", "Length", 100, 20, 300), P("width", "Width", 25, 8, 100)],
      generate: (p) => ({ items: [{ t: "slot", cx: 0, cy: 0, length: p.length, width: p.width, vertical: false }] }),
    },
    "towel-bar-holes": {
      name: "Towel Bar Holes",
      category: "pulls",
      params: [P("d", "Hole Ø", 10, 4, 40), P("spacing", "Spacing", 600, 50, 1200)],
      generate: (p) => ({
        items: [
          { t: "circle", cx: -p.spacing / 2, cy: 0, r: p.d / 2 },
          { t: "circle", cx: p.spacing / 2, cy: 0, r: p.d / 2 },
        ],
      }),
    },

    // ---- Drilling ----
    "drill-hole": {
      name: "Drill Hole",
      category: "drilling",
      params: [P("d", "Diameter", 10, 2, 60)],
      generate: (p) => ({ items: [{ t: "circle", cx: 0, cy: 0, r: p.d / 2 }] }),
    },
    "countersink": {
      name: "Countersink (avellanado)",
      category: "drilling",
      params: [P("d", "Outer Ø", 20, 6, 80), P("dInner", "Bore Ø", 8, 2, 60)],
      generate: (p) => ({ items: [{ t: "ring", cx: 0, cy: 0, r: p.d / 2, rInner: p.dInner / 2 }] }),
    },
    "standoff-hole": {
      name: "Standoff Hole",
      category: "drilling",
      params: [P("d", "Diameter", 25, 6, 80)],
      generate: (p) => ({ items: [{ t: "circle", cx: 0, cy: 0, r: p.d / 2 }] }),
    },
    "spigot-slot": {
      name: "Spigot Slot",
      category: "drilling",
      params: [P("length", "Length", 60, 10, 200), P("width", "Width", 20, 5, 80)],
      generate: (p) => ({ items: [{ t: "slot", cx: 0, cy: 0, length: p.length, width: p.width, vertical: true }] }),
    },

    // ---- Locks ----
    "lock-keyhole": {
      name: "Lock Keyhole",
      category: "locks",
      params: [P("d", "Bore Ø", 22, 6, 60), P("slotW", "Slot W", 10, 2, 30), P("slotH", "Slot H", 18, 2, 60)],
      generate: (p) => ({
        items: [
          { t: "circle", cx: 0, cy: p.slotH / 2, r: p.d / 2 },
          { t: "rect", x: -p.slotW / 2, y: -p.slotH / 2, w: p.slotW, h: p.slotH },
        ],
      }),
    },
    "cylinder-cutout": {
      name: "Cylinder Cutout",
      category: "locks",
      params: [P("d", "Diameter", 22, 6, 60)],
      generate: (p) => ({ items: [{ t: "circle", cx: 0, cy: 0, r: p.d / 2 }] }),
    },

    // ---- Corners & edges ----
    "corner-radius": {
      name: "Corner Radius",
      category: "corners",
      params: [P("r", "Radius", 40, 5, 200)],
      generate: (p) => ({ items: [{ t: "poly", points: quarterArcPoly(p.r, "tr") }] }),
    },
    "corner-bevel-clip": {
      name: "Corner Bevel / Clip",
      category: "corners",
      params: [P("size", "Size", 40, 5, 200)],
      generate: (p) => ({
        items: [{ t: "poly", points: [{ x: 0, y: 0 }, { x: p.size, y: 0 }, { x: 0, y: p.size }] }],
      }),
    },
    "u-channel-notch": {
      name: "U-Channel / Sidelite Notch",
      category: "corners",
      params: [P("w", "Width", 300, 20, 1500), P("depth", "Depth", 20, 5, 120)],
      generate: (p) => ({ items: [{ t: "rect", x: -p.w / 2, y: -p.depth / 2, w: p.w, h: p.depth }] }),
    },

    // ---- Notches ----
    "tub-deck-L-notch": {
      name: 'Tub-Deck "L" Notch',
      category: "notches",
      params: [
        P("w", "Width", 250, 20, 1000),
        P("h", "Height", 200, 20, 1000),
        P("stepW", "Step W", 120, 10, 900),
        P("stepH", "Step H", 100, 10, 900),
      ],
      generate: (p) => {
        const sw = Math.min(p.stepW, p.w - 1);
        const sh = Math.min(p.stepH, p.h - 1);
        // L-shaped notch ("Oklahoma" panel): full rectangle minus a corner bite.
        return {
          items: [
            {
              t: "poly",
              points: [
                { x: 0, y: 0 },
                { x: p.w, y: 0 },
                { x: p.w, y: p.h - sh },
                { x: p.w - sw, y: p.h - sh },
                { x: p.w - sw, y: p.h },
                { x: 0, y: p.h },
              ],
            },
          ],
        };
      },
    },
    "knee-wall-notch": {
      name: "Knee-Wall Notch",
      category: "notches",
      params: [P("w", "Width", 150, 20, 1000), P("h", "Height", 900, 50, 2500)],
      generate: (p) => ({ items: [{ t: "rect", x: -p.w / 2, y: -p.h / 2, w: p.w, h: p.h }] }),
    },

    // ---- Pass-throughs ----
    "outlet-cutout": {
      name: "Outlet / Switch Cutout",
      category: "passthrough",
      params: [P("w", "Width", 70, 10, 400), P("h", "Height", 115, 10, 400), P("r", "Corner R", 6, 0, 40)],
      generate: (p) => ({ items: [{ t: "poly", points: roundedRectPoly(p.w, p.h, p.r) }] }),
    },
    "tv-cable-passthrough": {
      name: "TV / Cable Pass-through",
      category: "passthrough",
      params: [P("d", "Diameter", 60, 10, 200)],
      generate: (p) => ({ items: [{ t: "circle", cx: 0, cy: 0, r: p.d / 2 }] }),
    },
  };

  // Default parameter object for a template.
  function defaultParams(templateId) {
    const tpl = WORKS_LIBRARY[templateId];
    if (!tpl) return {};
    const out = {};
    tpl.params.forEach((p) => (out[p.key] = p.def));
    return out;
  }

  global.WORKS_LIBRARY = WORKS_LIBRARY;
  global.WORKS_CATEGORIES = WORKS_CATEGORIES;
  global.WorksLibrary = {
    defaultParams,
    roundedRectPoly,
    quarterArcPoly,
    list() {
      return Object.keys(WORKS_LIBRARY).map((id) => ({
        id,
        name: WORKS_LIBRARY[id].name,
        category: WORKS_LIBRARY[id].category,
      }));
    },
  };
})(typeof window !== "undefined" ? window : this);
