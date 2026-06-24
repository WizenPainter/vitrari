/**
 * Designer theme tokens.
 *
 * A single source of truth for colors/typography used by BOTH renderers
 * (canvas live-editing and SVG print/export). Keeping screen and paper styling
 * here is what lets the two renderers stay visually consistent.
 *
 * `live`  -> dark CAD workspace shown on screen.
 * `print` -> white sheet with black vector lines for printing/exporting.
 *
 * Exposed as a global (the project loads plain <script> tags, no bundler).
 */
(function (global) {
  "use strict";

  const DESIGNER_THEME = {
    live: {
      mode: "live",
      background: "#0f1620", // deep slate workspace
      gridMinor: "rgba(120, 150, 190, 0.08)",
      gridMajor: "rgba(120, 150, 190, 0.16)",
      gridStepMM: 100, // major grid every 100mm
      gridSubdivisions: 5, // minor lines per major cell

      glassFill: "rgba(86, 156, 214, 0.06)",
      glassStroke: "#7fd1ff", // cyan part outline (AutoCAD-ish)
      glassStrokeWidth: 1.5,

      workFill: "rgba(15, 22, 32, 0.85)",
      workStroke: "#ff9d52", // amber cutouts
      workStrokeWidth: 1.4,
      workSelected: "#ffe066",
      workCenter: "#ff9d52",

      dimLine: "#9fb3c8", // dimension/extension lines
      dimText: "#e8eef5",
      dimTextBg: "rgba(20, 30, 42, 0.92)",
      dimTextBgHover: "rgba(40, 80, 120, 0.95)",
      dimAccent: "#7fd1ff",

      sideBadgeFill: "#7fd1ff",
      sideBadgeText: "#0f1620",

      paintAlpha: 0.45,
      snapGuide: "#ffe066",

      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      dimFontPx: 11,
    },

    print: {
      mode: "print",
      background: "#ffffff",
      gridMinor: "rgba(0,0,0,0)", // no grid on paper
      gridMajor: "rgba(0,0,0,0)",
      gridStepMM: 100,
      gridSubdivisions: 5,

      glassFill: "#ffffff",
      glassStroke: "#111111",
      glassStrokeWidth: 1.4,

      workFill: "#ffffff",
      workStroke: "#111111",
      workStrokeWidth: 1.2,
      workSelected: "#111111",
      workCenter: "#111111",

      dimLine: "#333333",
      dimText: "#111111",
      dimTextBg: "#ffffff",
      dimTextBgHover: "#ffffff",
      dimAccent: "#111111",

      sideBadgeFill: "#111111",
      sideBadgeText: "#ffffff",

      paintAlpha: 0.35,
      snapGuide: "rgba(0,0,0,0)",

      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      dimFontPx: 12,
    },
  };

  global.DESIGNER_THEME = DESIGNER_THEME;
})(typeof window !== "undefined" ? window : this);
