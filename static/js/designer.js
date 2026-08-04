/**
 * Glass Designer - Canvas-based design tool
 * Allows users to design glass pieces with holes at specific locations
 */

/**
 * Shape definitions for the glass designer.
 * Each shape has: name, category, params (array of {key, label, defaultFn}),
 * and generate(w, h, params) returning an array of {x, y} points.
 * Coordinate system: Y=0 at bottom, Y increases upward.
 */
const GLASS_SHAPES = {
  "rectangle": {
    name: "Rectangle",
    category: "basic",
    params: [],
    generate(w, h) {
      return [{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
    }
  },
  "circle": {
    name: "Circle",
    category: "basic",
    params: [],
    generate(w, h) {
      const cx = w/2, cy = h/2, r = Math.min(w,h)/2;
      const pts = [];
      for (let i=0; i<64; i++) {
        const a = (i/64)*Math.PI*2;
        pts.push({x: cx+r*Math.cos(a), y: cy+r*Math.sin(a)});
      }
      return pts;
    }
  },
  "oval": {
    name: "Oval / Ellipse",
    category: "basic",
    params: [],
    generate(w, h) {
      const cx = w/2, cy = h/2, rx = w/2, ry = h/2;
      const pts = [];
      for (let i=0; i<64; i++) {
        const a = (i/64)*Math.PI*2;
        pts.push({x: cx+rx*Math.cos(a), y: cy+ry*Math.sin(a)});
      }
      return pts;
    }
  },
  "triangle": {
    name: "Triangle",
    category: "basic",
    params: [],
    generate(w, h) {
      return [{x:0,y:0},{x:w,y:0},{x:w/2,y:h}];
    }
  },
  "right-triangle": {
    name: "Right Triangle",
    category: "basic",
    params: [],
    generate(w, h) {
      return [{x:0,y:0},{x:w,y:0},{x:0,y:h}];
    }
  },
  "semicircle": {
    name: "Semicircle",
    category: "basic",
    params: [],
    generate(w, h) {
      const pts = [{x:0,y:0},{x:w,y:0}];
      for (let i=1; i<=32; i++) {
        const a = (i/32)*Math.PI;
        pts.push({x: w/2 + (w/2)*Math.cos(a), y: (w/2)*Math.sin(a)});
      }
      return pts;
    }
  },
  "quarter-circle": {
    name: "Quarter Circle",
    category: "basic",
    params: [],
    generate(w, h) {
      const r = Math.min(w, h);
      const pts = [{x:0,y:0}];
      pts.push({x:r,y:0});
      for (let i=1; i<=32; i++) {
        const a = (i/32)*(Math.PI/2);
        pts.push({x: r*Math.cos(a), y: r*Math.sin(a)});
      }
      return pts;
    }
  },
  "trapezoid": {
    name: "Trapezoid",
    category: "trapezoids",
    params: [{key:"topWidth", label:"Top Width", defaultFn:(w)=>w*0.6}],
    generate(w, h, params) {
      const tw = params.topWidth || w*0.6;
      const off = (w-tw)/2;
      return [{x:0,y:0},{x:w,y:0},{x:w-off,y:h},{x:off,y:h}];
    }
  },
  "right-trapezoid": {
    name: "Right Trapezoid",
    category: "trapezoids",
    params: [{key:"topWidth", label:"Top Width", defaultFn:(w)=>w*0.6}],
    generate(w, h, params) {
      const tw = params.topWidth || w*0.6;
      return [{x:0,y:0},{x:w,y:0},{x:tw,y:h},{x:0,y:h}];
    }
  },
  "parallelogram": {
    name: "Parallelogram",
    category: "trapezoids",
    params: [{key:"offset", label:"Offset", defaultFn:(w)=>w*0.2}],
    generate(w, h, params) {
      const off = params.offset || w*0.2;
      return [{x:0,y:0},{x:w-off,y:0},{x:w,y:h},{x:off,y:h}];
    }
  },
  "pentagon": {
    name: "Pentagon",
    category: "polygons",
    params: [],
    generate(w, h) {
      const r = Math.min(w,h)/2, cx=w/2, cy=h/2, pts=[];
      for (let i=0;i<5;i++){const a=(i/5)*Math.PI*2 - Math.PI/2; pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});}
      return pts;
    }
  },
  "hexagon": {
    name: "Hexagon",
    category: "polygons",
    params: [],
    generate(w, h) {
      const r = Math.min(w,h)/2, cx=w/2, cy=h/2, pts=[];
      for (let i=0;i<6;i++){const a=(i/6)*Math.PI*2 - Math.PI/2; pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});}
      return pts;
    }
  },
  "octagon": {
    name: "Octagon",
    category: "polygons",
    params: [],
    generate(w, h) {
      const r = Math.min(w,h)/2, cx=w/2, cy=h/2, pts=[];
      for (let i=0;i<8;i++){const a=(i/8)*Math.PI*2 - Math.PI/2; pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});}
      return pts;
    }
  },
  "diamond": {
    name: "Diamond / Rhombus",
    category: "polygons",
    params: [],
    generate(w, h) {
      return [{x:w/2,y:0},{x:w,y:h/2},{x:w/2,y:h},{x:0,y:h/2}];
    }
  },
  "arch": {
    name: "Arch",
    category: "arched",
    params: [{key:"archHeight", label:"Arch Height", defaultFn:(w,h)=>Math.min(h*0.3, w/2)}],
    generate(w, h, params) {
      const ah = params.archHeight || Math.min(h*0.3, w/2);
      const rectTop = h - ah;
      const pts = [{x:0,y:0},{x:w,y:0},{x:w,y:rectTop}];
      for (let i=1;i<=32;i++){
        const a=(i/32)*Math.PI;
        pts.push({x: w/2+(w/2)*Math.cos(a), y: rectTop+ah*Math.sin(a)});
      }
      return pts;
    }
  },
  "gothic-arch": {
    name: "Gothic Arch",
    category: "arched",
    params: [{key:"archHeight", label:"Arch Height", defaultFn:(w,h)=>Math.min(h*0.4, w)}],
    generate(w, h, params) {
      const ah = params.archHeight || Math.min(h*0.4, w);
      const rectTop = h - ah;
      const pts = [{x:0,y:0},{x:w,y:0},{x:w,y:rectTop}];
      // Approximate gothic pointed arch with bezier-like points
      const segments = 16;
      // Right curve: from (w, rectTop) bending toward (w/2, h)
      for (let i=1;i<=segments;i++){
        const t=i/segments;
        // Quadratic bezier: P0=(w,rectTop), P1=(w, h), P2=(w/2, h)
        const x=(1-t)*(1-t)*w + 2*(1-t)*t*w + t*t*(w/2);
        const y=(1-t)*(1-t)*rectTop + 2*(1-t)*t*h + t*t*h;
        pts.push({x,y});
      }
      // Left curve: from (w/2, h) bending toward (0, rectTop)
      for (let i=1;i<=segments;i++){
        const t=i/segments;
        const x=(1-t)*(1-t)*(w/2) + 2*(1-t)*t*0 + t*t*0;
        const y=(1-t)*(1-t)*h + 2*(1-t)*t*h + t*t*rectTop;
        pts.push({x,y});
      }
      return pts;
    }
  },
  "tombstone": {
    name: "Tombstone",
    category: "arched",
    params: [],
    generate(w, h) {
      const archR = w/2;
      const rectTop = h - archR;
      if (rectTop <= 0) {
        // If height is too small, just make a semicircle on top of a line
        const pts = [{x:0,y:0},{x:w,y:0}];
        for (let i=1;i<=32;i++){const a=(i/32)*Math.PI; pts.push({x:w/2+(w/2)*Math.cos(a), y:(w/2)*Math.sin(a)});}
        return pts;
      }
      const pts = [{x:0,y:0},{x:w,y:0},{x:w,y:rectTop}];
      for (let i=1;i<=32;i++){
        const a=(i/32)*Math.PI;
        pts.push({x: w/2+archR*Math.cos(a), y: rectTop+archR*Math.sin(a)});
      }
      return pts;
    }
  },
  "house": {
    name: "House",
    category: "arched",
    params: [{key:"roofHeight", label:"Roof Height", defaultFn:(w,h)=>h*0.3}],
    generate(w, h, params) {
      const rh = params.roofHeight || h*0.3;
      const wallTop = h - rh;
      return [{x:0,y:0},{x:w,y:0},{x:w,y:wallTop},{x:w/2,y:h},{x:0,y:wallTop}];
    }
  },
  "corner-cut-1": {
    name: "Corner Cut (1)",
    category: "cuts",
    params: [{key:"cutSize", label:"Cut Size", defaultFn:(w,h)=>Math.min(w,h)*0.2}],
    generate(w, h, params) {
      const c = params.cutSize || Math.min(w,h)*0.2;
      return [{x:0,y:0},{x:w,y:0},{x:w,y:h-c},{x:w-c,y:h},{x:0,y:h}];
    }
  },
  "corner-cut-2": {
    name: "Corner Cut (2)",
    category: "cuts",
    params: [{key:"cutSize", label:"Cut Size", defaultFn:(w,h)=>Math.min(w,h)*0.2}],
    generate(w, h, params) {
      const c = params.cutSize || Math.min(w,h)*0.2;
      return [{x:c,y:0},{x:w,y:0},{x:w,y:h-c},{x:w-c,y:h},{x:0,y:h},{x:0,y:c}];
    }
  },
  "corner-cut-4": {
    name: "Corner Cut (4)",
    category: "cuts",
    params: [{key:"cutSize", label:"Cut Size", defaultFn:(w,h)=>Math.min(w,h)*0.15}],
    generate(w, h, params) {
      const c = params.cutSize || Math.min(w,h)*0.15;
      return [{x:c,y:0},{x:w-c,y:0},{x:w,y:c},{x:w,y:h-c},{x:w-c,y:h},{x:c,y:h},{x:0,y:h-c},{x:0,y:c}];
    }
  },
  "notch-top": {
    name: "Notch Top",
    category: "cuts",
    params: [{key:"notchWidth", label:"Notch Width", defaultFn:(w)=>w*0.3},{key:"notchDepth", label:"Notch Depth", defaultFn:(w,h)=>h*0.2}],
    generate(w, h, params) {
      const nw = params.notchWidth || w*0.3;
      const nd = params.notchDepth || h*0.2;
      const nx = (w-nw)/2;
      return [{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:nx+nw,y:h},{x:nx+nw,y:h-nd},{x:nx,y:h-nd},{x:nx,y:h},{x:0,y:h}];
    }
  },
  "notch-right": {
    name: "Notch Right",
    category: "cuts",
    params: [{key:"notchWidth", label:"Notch Width", defaultFn:(w,h)=>h*0.3},{key:"notchDepth", label:"Notch Depth", defaultFn:(w)=>w*0.2}],
    generate(w, h, params) {
      const nw = params.notchWidth || h*0.3;
      const nd = params.notchDepth || w*0.2;
      const ny = (h-nw)/2;
      return [{x:0,y:0},{x:w,y:0},{x:w,y:ny},{x:w-nd,y:ny},{x:w-nd,y:ny+nw},{x:w,y:ny+nw},{x:w,y:h},{x:0,y:h}];
    }
  },
  "notch-bottom": {
    name: "Notch Bottom",
    category: "cuts",
    params: [{key:"notchWidth", label:"Notch Width", defaultFn:(w)=>w*0.3},{key:"notchDepth", label:"Notch Depth", defaultFn:(w,h)=>h*0.2}],
    generate(w, h, params) {
      const nw = params.notchWidth || w*0.3;
      const nd = params.notchDepth || h*0.2;
      const nx = (w-nw)/2;
      return [{x:0,y:0},{x:nx,y:0},{x:nx,y:nd},{x:nx+nw,y:nd},{x:nx+nw,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
    }
  },
  "v-notch-top": {
    name: "V-Notch Top",
    category: "cuts",
    params: [{key:"notchWidth", label:"Notch Width", defaultFn:(w)=>w*0.3},{key:"notchDepth", label:"Notch Depth", defaultFn:(w,h)=>h*0.2}],
    generate(w, h, params) {
      const nw = params.notchWidth || w*0.3;
      const nd = params.notchDepth || h*0.2;
      const nx = (w-nw)/2;
      return [{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:nx+nw,y:h},{x:w/2,y:h-nd},{x:nx,y:h},{x:0,y:h}];
    }
  },
  "half-circle-top": {
    name: "Half-Circle Top",
    category: "curves",
    params: [{key:"circleDiameter", label:"Circle Diameter", defaultFn:(w)=>w*0.4}],
    generate(w, h, params) {
      const d = params.circleDiameter || w*0.4;
      const r = d/2;
      const pts = [{x:0,y:0},{x:w,y:0},{x:w,y:h}];
      // Flat top then bump
      const cx = w/2;
      pts.push({x:cx+r,y:h});
      for (let i=1;i<=32;i++){
        const a=(i/32)*Math.PI;
        pts.push({x:cx+r*Math.cos(a), y:h+r*Math.sin(a)});
      }
      pts.push({x:cx-r,y:h});
      pts.push({x:0,y:h});
      return pts;
    }
  },
  "half-circle-right": {
    name: "Half-Circle Right",
    category: "curves",
    params: [{key:"circleDiameter", label:"Circle Diameter", defaultFn:(w,h)=>h*0.4}],
    generate(w, h, params) {
      const d = params.circleDiameter || h*0.4;
      const r = d/2;
      const cy = h/2;
      const pts = [{x:0,y:0},{x:w,y:0}];
      pts.push({x:w,y:cy-r});
      for (let i=0;i<=32;i++){
        const a=-Math.PI/2+(i/32)*Math.PI;
        pts.push({x:w+r*Math.cos(a+Math.PI/2), y:cy+r*Math.sin(a+Math.PI/2)});
      }
      // Correct: semicircle bulging right from (w, cy-r) to (w, cy+r)
      // Clear and redo
      pts.length = 2; // keep first two
      pts.push({x:w,y:cy-r});
      for (let i=1;i<=32;i++){
        const a=(i/32)*Math.PI - Math.PI/2;
        pts.push({x:w+r*Math.cos(a), y:cy+r*Math.sin(a)});
      }
      pts.push({x:w,y:cy+r});
      pts.push({x:w,y:h});
      pts.push({x:0,y:h});
      return pts;
    }
  },
  "half-circle-bottom": {
    name: "Half-Circle Bottom",
    category: "curves",
    params: [{key:"circleDiameter", label:"Circle Diameter", defaultFn:(w)=>w*0.4}],
    generate(w, h, params) {
      const d = params.circleDiameter || w*0.4;
      const r = d/2;
      const cx = w/2;
      const pts = [];
      pts.push({x:0,y:0});
      pts.push({x:cx-r,y:0});
      for (let i=0;i<=32;i++){
        const a=Math.PI+(i/32)*Math.PI;
        pts.push({x:cx+r*Math.cos(a), y:r*Math.sin(a)});
      }
      pts.push({x:cx+r,y:0});
      pts.push({x:w,y:0});
      pts.push({x:w,y:h});
      pts.push({x:0,y:h});
      return pts;
    }
  },
  "half-circle-left": {
    name: "Half-Circle Left",
    category: "curves",
    params: [{key:"circleDiameter", label:"Circle Diameter", defaultFn:(w,h)=>h*0.4}],
    generate(w, h, params) {
      const d = params.circleDiameter || h*0.4;
      const r = d/2;
      const cy = h/2;
      const pts = [{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
      // Insert bump on left side: between (0,h) and (0,0)
      // Rebuild: go CW: bottom-left -> bottom-right -> top-right -> top-left side with bump
      pts.length = 0;
      pts.push({x:0,y:0});
      pts.push({x:w,y:0});
      pts.push({x:w,y:h});
      pts.push({x:0,y:h});
      pts.push({x:0,y:cy+r});
      for (let i=0;i<=32;i++){
        const a=Math.PI/2+(i/32)*Math.PI;
        pts.push({x:r*Math.cos(a), y:cy+r*Math.sin(a)});
      }
      pts.push({x:0,y:cy-r});
      return pts;
    }
  },
  "l-shape": {
    name: "L-Shape",
    category: "complex",
    params: [{key:"notchWidth", label:"Notch Width", defaultFn:(w)=>w*0.4},{key:"notchHeight", label:"Notch Height", defaultFn:(w,h)=>h*0.4}],
    generate(w, h, params) {
      const nw = params.notchWidth || w*0.4;
      const nh = params.notchHeight || h*0.4;
      return [{x:0,y:0},{x:w,y:0},{x:w,y:h-nh},{x:w-nw,y:h-nh},{x:w-nw,y:h},{x:0,y:h}];
    }
  },
  "t-shape": {
    name: "T-Shape",
    category: "complex",
    params: [{key:"stemWidth", label:"Stem Width", defaultFn:(w)=>w*0.4},{key:"barHeight", label:"Bar Height", defaultFn:(w,h)=>h*0.35}],
    generate(w, h, params) {
      const sw = params.stemWidth || w*0.4;
      const bh = params.barHeight || h*0.35;
      const sx = (w-sw)/2;
      return [{x:sx,y:0},{x:sx+sw,y:0},{x:sx+sw,y:h-bh},{x:w,y:h-bh},{x:w,y:h},{x:0,y:h},{x:0,y:h-bh},{x:sx,y:h-bh}];
    }
  },
  "u-shape": {
    name: "U-Shape",
    category: "complex",
    params: [{key:"wallThickness", label:"Wall Thickness", defaultFn:(w)=>w*0.25}],
    generate(w, h, params) {
      const wt = params.wallThickness || w*0.25;
      return [{x:0,y:0},{x:wt,y:0},{x:wt,y:h-wt},{x:w-wt,y:h-wt},{x:w-wt,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
    }
  },
  "cross": {
    name: "Cross / Plus",
    category: "complex",
    params: [{key:"armWidth", label:"Arm Width", defaultFn:(w,h)=>Math.min(w,h)*0.33}],
    generate(w, h, params) {
      const aw = params.armWidth || Math.min(w,h)*0.33;
      const ax = (w-aw)/2;
      const ay = (h-aw)/2;
      return [
        {x:ax,y:0},{x:ax+aw,y:0},{x:ax+aw,y:ay},{x:w,y:ay},{x:w,y:ay+aw},
        {x:ax+aw,y:ay+aw},{x:ax+aw,y:h},{x:ax,y:h},{x:ax,y:ay+aw},{x:0,y:ay+aw},
        {x:0,y:ay},{x:ax,y:ay}
      ];
    }
  },
  "freeform": {
    name: "Freeform",
    category: "custom",
    params: [],
    generate(w, h, params, glass) {
      if (glass && glass.freeformPoints && glass.freeformPoints.length >= 3) {
        return glass.freeformPoints;
      }
      return [{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
    }
  }
};

const SHAPE_CATEGORIES = [
  { id: "basic", name: "Basic" },
  { id: "trapezoids", name: "Trapezoids" },
  { id: "polygons", name: "Polygons" },
  { id: "arched", name: "Arched" },
  { id: "cuts", name: "With Cuts" },
  { id: "curves", name: "With Curves" },
  { id: "complex", name: "Complex" },
  { id: "custom", name: "Custom" }
];

/**
 * Generate an SVG thumbnail from a shape's points.
 * Calls generate(100, 70, defaultParams) to get points,
 * scales to fit in a 50x36 viewBox with 3px padding,
 * flips Y axis for SVG, returns an SVG string.
 */
function generateShapeSVG(shapeId) {
  const shapeDef = GLASS_SHAPES[shapeId];
  if (!shapeDef) return "";

  // Build default params
  const defaultParams = {};
  (shapeDef.params || []).forEach(p => {
    defaultParams[p.key] = p.defaultFn(100, 70);
  });

  let points;
  if (shapeId === "freeform") {
    // Use a sample freeform polygon for the thumbnail
    points = [{x:10,y:5},{x:90,y:8},{x:95,y:55},{x:50,y:65},{x:5,y:45}];
  } else {
    points = shapeDef.generate(100, 70, defaultParams);
  }

  if (!points || points.length < 2) return "";

  // Find bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  });

  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const pad = 3;
  const vw = 50, vh = 36;
  const availW = vw - pad*2, availH = vh - pad*2;
  const scale = Math.min(availW / bw, availH / bh);
  const offX = pad + (availW - bw*scale)/2;
  const offY = pad + (availH - bh*scale)/2;

  // Build path data with Y flip for SVG
  const pathParts = points.map((p, i) => {
    const sx = offX + (p.x - minX) * scale;
    const sy = offY + (maxY - p.y) * scale; // Flip Y
    return (i === 0 ? "M" : "L") + sx.toFixed(1) + "," + sy.toFixed(1);
  });
  pathParts.push("Z");

  return `<svg viewBox="0 0 ${vw} ${vh}" width="50" height="36"><path d="${pathParts.join(" ")}" fill="none" stroke="currentColor" stroke-width="1.5"${shapeId === "freeform" ? ' stroke-dasharray="2,1.5"' : ""}/></svg>`;
}

class GlassDesigner {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error("Canvas element not found:", canvasId);
      return;
    }

    this.ctx = this.canvas.getContext("2d");
    this.scale = 0.25; // 1 pixel = 4mm (for reasonable canvas size)

    // Glass properties (dimensions in mm)
    this.glass = {
      width: 1200,
      height: 800,
      thickness: 6,
      type: "clear", // clear, mirror, gray, tinted, frosted
      cpb: false, // Canto Pulido (polished edge)
      shape: "rectangle", // rectangle, circle, triangle, etc.
      shapeParams: {}, // Shape-specific parameters
      freeformPoints: [], // Custom polygon points for freeform shape
      flipH: false, // Flip shape horizontally
      flipV: false, // Flip shape vertically
    };

    // Paint areas - array of painted rectangles
    this.paintAreas = [];
    this.paintColor = "#FFFFFF"; // Default white color

    // Freeform shape drawing state
    this.isDrawingFreeform = false;
    this.freeformTempPoints = [];
    this.freeformCursorPos = null;
    this.shiftKeyDown = false;

    // Snap alignment guides
    this.snapGuides = [];

    // Clickable measurement label hit areas (populated during render)
    this.measurementHitAreas = [];

    // Holes array - each hole has {x, y, diameter, shape}
    this.holes = [];

    // Selected hole for editing
    this.selectedHoleIndex = -1;

    // Current tool
    this.currentTool = "select"; // 'select', 'rectangle', 'circle', 'hole'

    // Track measurement label positions to prevent overlaps
    this.measurementLabels = [];

    // Mouse state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;

    // Initialize
    this.setupCanvas();
    this.setupEventListeners();
    this.render();
  }

  setupCanvas() {
    // Get canvas container dimensions
    const container = this.canvas.parentElement;
    const containerRect = container.getBoundingClientRect();

    // Check if mobile
    const isMobile = window.innerWidth <= 768;
    const padding = isMobile ? 40 : 80; // Less padding on mobile

    let canvasWidth, canvasHeight;

    if (isMobile) {
      // Mobile: Use full container width minus some margin
      const margin = 20;
      canvasWidth = Math.min(
        window.innerWidth - margin,
        containerRect.width || window.innerWidth - margin,
      );
      canvasHeight = Math.min(window.innerHeight * 0.6, 400); // Max 60% of screen height or 400px
    } else {
      // Desktop: Use fixed size or container size
      canvasWidth = Math.min(800, containerRect.width || 800);
      canvasHeight = Math.min(600, containerRect.height || 600);
    }

    // Set canvas pixel dimensions
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    // Set CSS size to match pixel dimensions for proper touch handling
    this.canvas.style.width = canvasWidth + "px";
    this.canvas.style.height = canvasHeight + "px";

    // Calculate scale to fit glass within available space while maintaining aspect ratio
    const availableWidth = canvasWidth - padding * 2;
    const availableHeight = canvasHeight - padding * 2;

    const scaleX = availableWidth / this.glass.width;
    const scaleY = availableHeight / this.glass.height;

    // Use the smaller scale to ensure glass fits in both dimensions
    this.scale = Math.min(scaleX, scaleY);
    // Remember the glass-only fit scale; render() auto-fits down from this so
    // dimension bands/leaders always stay on screen.
    this.baseScale = this.scale;

    // Calculate actual glass size on canvas
    const glassCanvasWidth = this.glass.width * this.scale;
    const glassCanvasHeight = this.glass.height * this.scale;

    // Center the glass in the canvas
    this.offsetX = (canvasWidth - glassCanvasWidth) / 2;
    this.offsetY = (canvasHeight - glassCanvasHeight) / 2;

    // Store canvas dimensions for mobile handling
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("mouseleave", this.onMouseUp.bind(this));
    this.canvas.addEventListener("dblclick", this.onDoubleClick.bind(this));

    // Touch events for mobile
    this.canvas.addEventListener("touchstart", this.onTouchStart.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener("touchmove", this.onTouchMove.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.onTouchEnd.bind(this), {
      passive: false,
    });

    // Window resize handler for responsive canvas
    window.addEventListener("resize", this.onWindowResize.bind(this));

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Shift") this.shiftKeyDown = true;
      if (e.key === "Delete" && this.selectedHoleIndex >= 0) {
        this.deleteHole(this.selectedHoleIndex);
      }
      if (e.key === "Escape") {
        this.selectedHoleIndex = -1;
        this.render();
        this.renderHolesList();
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.key === "Shift") this.shiftKeyDown = false;
    });
  }

  // Convert canvas coordinates to glass coordinates (mm)
  // Y-axis is inverted so 0 is at bottom
  canvasToGlass(canvasX, canvasY) {
    return {
      x: (canvasX - this.offsetX) / this.scale,
      y: this.glass.height - (canvasY - this.offsetY) / this.scale,
    };
  }

  // Convert glass coordinates (mm) to canvas coordinates
  // Y-axis is inverted so 0 is at bottom
  glassToCanvas(glassX, glassY) {
    return {
      x: glassX * this.scale + this.offsetX,
      y: (this.glass.height - glassY) * this.scale + this.offsetY,
    };
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();

    // Scale mouse coordinates from display size to pixel size
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    // Check if clicking on a measurement label (before anything else)
    const hitMeasurement = this.findMeasurementAtPoint(canvasX, canvasY);
    if (hitMeasurement) {
      e.preventDefault();
      e.stopPropagation();
      // Delay so the mousedown event fully completes before creating the input
      setTimeout(() => this.showInlineMeasurementEditor(hitMeasurement), 0);
      return;
    }

    const glassCoords = this.canvasToGlass(canvasX, canvasY);

    // Handle freeform shape drawing mode
    if (this.isDrawingFreeform) {
      let x = Math.max(0, Math.min(this.glass.width, glassCoords.x));
      let y = Math.max(0, Math.min(this.glass.height, glassCoords.y));

      // Shift-key snapping to nearest 45-degree angle
      if (e.shiftKey && this.freeformTempPoints.length > 0) {
        const last = this.freeformTempPoints[this.freeformTempPoints.length - 1];
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx);
        const snapped = Math.round(angle / (Math.PI/4)) * (Math.PI/4);
        x = last.x + dist * Math.cos(snapped);
        y = last.y + dist * Math.sin(snapped);
        x = Math.max(0, Math.min(this.glass.width, x));
        y = Math.max(0, Math.min(this.glass.height, y));
      }

      // Check if near first point to close shape
      if (this.freeformTempPoints.length >= 3) {
        const first = this.freeformTempPoints[0];
        const dist = Math.sqrt((x - first.x) ** 2 + (y - first.y) ** 2);
        if (dist < 20) {
          this.finalizeFreeformShape();
          return;
        }
      }

      this.freeformTempPoints.push({ x, y });
      this.render();
      return;
    }

    // Check if click is within glass shape
    if (!this.isPointInGlass(glassCoords.x, glassCoords.y)) {
      return;
    }

    // First check if clicking on existing hole (works for all tools)
    const clickedHoleIndex = this.findHoleAtPoint(glassCoords.x, glassCoords.y);

    if (clickedHoleIndex >= 0 && this.currentTool === "select") {
      // Select existing hole for dragging
      this.selectedHoleIndex = clickedHoleIndex;
      this.isDragging = true;

      const hole = this.holes[clickedHoleIndex];
      if (hole.shape === "circle") {
        // For circles, x,y is the center
        this.dragStartX = glassCoords.x - hole.x;
        this.dragStartY = glassCoords.y - hole.y;
      } else if (hole.shape === "rectangle") {
        // For rectangles, calculate offset from center
        const centerX = hole.x + hole.width / 2;
        const centerY = hole.y + hole.height / 2;
        this.dragStartX = glassCoords.x - centerX;
        this.dragStartY = glassCoords.y - centerY;
      }

      this.render();
      this.updatePropertiesPanel();
    } else if (clickedHoleIndex >= 0) {
      // Clicked on existing hole with circle/rectangle tool - just select it
      this.selectedHoleIndex = clickedHoleIndex;
      this.render();
      this.updatePropertiesPanel();
    } else if (this.currentTool === "hole" || this.currentTool === "circle") {
      // Create a new circular hole centered on cursor (50mm diameter)
      const newHole = {
        x: glassCoords.x, // Center X
        y: glassCoords.y, // Center Y
        diameter: 50,
        shape: "circle",
      };
      this.holes.push(newHole);
      this.selectedHoleIndex = this.holes.length - 1;
      this.updatePropertiesPanel();
      this.render();
    } else if (this.currentTool === "taladro") {
      // Create a new drill hole centered on cursor (smaller, 6mm diameter)
      const newHole = {
        x: glassCoords.x, // Center X
        y: glassCoords.y, // Center Y
        diameter: 6,
        shape: "taladro",
      };
      this.holes.push(newHole);
      this.selectedHoleIndex = this.holes.length - 1;
      this.updatePropertiesPanel();
      this.render();
    } else if (this.currentTool === "avellanado") {
      // Create a new countersink hole centered on cursor
      const newHole = {
        x: glassCoords.x, // Center X
        y: glassCoords.y, // Center Y
        diameter: 20, // Outer countersink diameter
        holeDiameter: 6, // Inner hole diameter
        shape: "avellanado",
      };
      this.holes.push(newHole);
      this.selectedHoleIndex = this.holes.length - 1;
      this.updatePropertiesPanel();
      this.render();
    } else if (this.currentTool === "rectangle") {
      // Create a new rectangular hole centered on cursor (100x100mm)
      // Store bottom-left corner coordinates
      const newHole = {
        x: glassCoords.x - 50, // Bottom-left X (centered)
        y: glassCoords.y - 50, // Bottom-left Y (centered)
        width: 100,
        height: 100,
        shape: "rectangle",
      };
      this.holes.push(newHole);
      this.selectedHoleIndex = this.holes.length - 1;
      this.updatePropertiesPanel();
      this.render();
    } else if (this.currentTool === "clip") {
      // Create a new edge clip - rectangular notch cut into the edge
      const newClip = {
        x: glassCoords.x, // Position along edge
        y: glassCoords.y, // Position along edge
        width: 40, // Width of notch (along the edge)
        depth: 20, // Depth of notch (into the glass)
        shape: "clip",
      };
      this.holes.push(newClip);
      this.selectedHoleIndex = this.holes.length - 1;
      this.updatePropertiesPanel();
      this.render();
     } else if (this.currentTool === "work" && this.pendingWorkTemplate) {
       // Place a parametric work from the works library at the cursor.
       const id = this.pendingWorkTemplate;
       const params = window.WorksLibrary
         ? window.WorksLibrary.defaultParams(id)
         : {};
       const newWork = {
         shape: "work",
         templateId: id,
         params,
         x: glassCoords.x,
         y: glassCoords.y,
         mirror: { h: false, v: false },
       };
       this.holes.push(newWork);
       this.selectedHoleIndex = this.holes.length - 1;
       this.render();
       this.renderWorkProperties();
       if (typeof this.renderHolesList === "function") this.renderHolesList();
     } else if (this.currentTool === "paint") {
       // Start painting - create a new paint area
       this.isPainting = true;
       this.paintStartX = glassCoords.x;
       this.paintStartY = glassCoords.y;
       this.currentPaintArea = {
         x: glassCoords.x,
         y: glassCoords.y,
         width: 0,
         height: 0,
       };
     } else if (this.currentTool === "select" && clickedHoleIndex < 0) {
       // Clicked on empty space with select tool - deselect
       this.selectedHoleIndex = -1;
       this.render();
       this.updatePropertiesPanel();
     }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();

    // Scale mouse coordinates from display size to pixel size
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const glassCoords = this.canvasToGlass(canvasX, canvasY);

    // Track freeform cursor position for preview line
    if (this.isDrawingFreeform && this.freeformTempPoints.length > 0) {
      let cx = Math.max(0, Math.min(this.glass.width, glassCoords.x));
      let cy = Math.max(0, Math.min(this.glass.height, glassCoords.y));
      if (this.shiftKeyDown) {
        const last = this.freeformTempPoints[this.freeformTempPoints.length - 1];
        const dx = cx - last.x;
        const dy = cy - last.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx);
        const snapped = Math.round(angle / (Math.PI/4)) * (Math.PI/4);
        cx = last.x + dist * Math.cos(snapped);
        cy = last.y + dist * Math.sin(snapped);
        cx = Math.max(0, Math.min(this.glass.width, cx));
        cy = Math.max(0, Math.min(this.glass.height, cy));
      }
      this.freeformCursorPos = { x: cx, y: cy };
      this.render();
      return;
    }

    if (this.isDragging && this.selectedHoleIndex >= 0) {
      // Drag existing hole
      const hole = this.holes[this.selectedHoleIndex];

      if (hole.shape === "circle" || hole.shape === "taladro" || hole.shape === "avellanado") {
        // For circles, x,y is the center
        hole.x = glassCoords.x - this.dragStartX;
        hole.y = glassCoords.y - this.dragStartY;

        // Keep hole within bounds
        hole.x = Math.max(0, Math.min(this.glass.width, hole.x));
        hole.y = Math.max(0, Math.min(this.glass.height, hole.y));
      } else if (hole.shape === "rectangle") {
        // For rectangles, update center position then convert to bottom-left
        const centerX = glassCoords.x - this.dragStartX;
        const centerY = glassCoords.y - this.dragStartY;

        hole.x = centerX - hole.width / 2;
        hole.y = centerY - hole.height / 2;

        // Keep hole within bounds (check center position)
        const minCenterX = hole.width / 2;
        const maxCenterX = this.glass.width - hole.width / 2;
        const minCenterY = hole.height / 2;
        const maxCenterY = this.glass.height - hole.height / 2;

        const clampedCenterX = Math.max(
          minCenterX,
          Math.min(maxCenterX, centerX),
        );
        const clampedCenterY = Math.max(
          minCenterY,
          Math.min(maxCenterY, centerY),
        );

        hole.x = clampedCenterX - hole.width / 2;
        hole.y = clampedCenterY - hole.height / 2;
      }

      // Snap alignment guides
      this.snapGuides = [];
      const snapThreshold = 5; // mm
      // Get the center of the dragged hole
      let hcx, hcy;
      if (hole.shape === "rectangle") {
        hcx = hole.x + hole.width / 2;
        hcy = hole.y + hole.height / 2;
      } else {
        hcx = hole.x;
        hcy = hole.y;
      }

      // Snap targets: glass center, glass edges, other hole centers
      const snapTargetsX = [0, this.glass.width, this.glass.width / 2];
      const snapTargetsY = [0, this.glass.height, this.glass.height / 2];

      this.holes.forEach((otherHole, idx) => {
        if (idx === this.selectedHoleIndex) return;
        if (otherHole.shape === "rectangle") {
          snapTargetsX.push(otherHole.x + otherHole.width / 2);
          snapTargetsY.push(otherHole.y + otherHole.height / 2);
        } else {
          snapTargetsX.push(otherHole.x);
          snapTargetsY.push(otherHole.y);
        }
      });

      for (const tx of snapTargetsX) {
        if (Math.abs(hcx - tx) < snapThreshold) {
          const dx = tx - hcx;
          if (hole.shape === "rectangle") {
            hole.x += dx;
          } else {
            hole.x += dx;
          }
          this.snapGuides.push({ type: "vertical", pos: tx });
          break;
        }
      }

      for (const ty of snapTargetsY) {
        if (Math.abs(hcy - ty) < snapThreshold) {
          const dy = ty - hcy;
          if (hole.shape === "rectangle") {
            hole.y += dy;
          } else {
            hole.y += dy;
          }
          this.snapGuides.push({ type: "horizontal", pos: ty });
          break;
        }
      }

       this.render();
       this.updatePropertiesPanel();
     } else if (this.isPainting && this.currentPaintArea) {
       // Update paint area dimensions while dragging
       const width = Math.abs(glassCoords.x - this.paintStartX);
       const height = Math.abs(glassCoords.y - this.paintStartY);

       this.currentPaintArea.x = Math.min(this.paintStartX, glassCoords.x);
       this.currentPaintArea.y = Math.min(this.paintStartY, glassCoords.y);
       this.currentPaintArea.width = width;
       this.currentPaintArea.height = height;

       this.render();
     }

     // Update cursor — check measurement labels first
    const hitMeasure = this.findMeasurementAtPoint(canvasX, canvasY);
    if (hitMeasure) {
      this.canvas.style.cursor = "pointer";
    } else if (this.currentTool === "select") {
      const holeIndex = this.findHoleAtPoint(glassCoords.x, glassCoords.y);
      this.canvas.style.cursor = holeIndex >= 0 ? "move" : "default";
    } else if (this.currentTool === "paint") {
      this.canvas.style.cursor = "crosshair";
    } else {
      this.canvas.style.cursor = "crosshair";
    }
  }

  onMouseUp(e) {
    this.isDragging = false;
    this.snapGuides = [];

    // Finish painting if we were painting
    if (this.isPainting && this.currentPaintArea) {
      // Only add the paint area if it has meaningful dimensions
      if (this.currentPaintArea.width > 5 && this.currentPaintArea.height > 5) {
        this.paintAreas.push(this.currentPaintArea);
        this.updatePaintAreasList();
      }
      this.currentPaintArea = null;
      this.isPainting = false;
      this.render();
    }
  }

  findHoleAtPoint(x, y) {
    for (let i = this.holes.length - 1; i >= 0; i--) {
      const hole = this.holes[i];

      if (hole.shape === "work") {
        // Use the resolved scene bounding box for hit testing.
        const sw = this.scene && this.scene.works && this.scene.works[i];
        if (sw && sw.bbox) {
          const b = sw.bbox;
          if (x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY) {
            return i;
          }
        }
        continue;
      }

      if (hole.shape === "clip") {
        // Check if click is within the triangular notch area
        const distToLeft = hole.x;
        const distToRight = this.glass.width - hole.x;
        const distToBottom = hole.y;
        const distToTop = this.glass.height - hole.y;
        const minDist = Math.min(
          distToLeft,
          distToRight,
          distToBottom,
          distToTop,
        );

        let p1, p2, p3; // Triangle vertices

        if (minDist === distToLeft) {
          // Left edge triangle
          p1 = { x: 0, y: hole.y + hole.width / 2 };
          p2 = { x: hole.depth, y: hole.y };
          p3 = { x: 0, y: hole.y - hole.width / 2 };
        } else if (minDist === distToRight) {
          // Right edge triangle
          p1 = { x: this.glass.width, y: hole.y + hole.width / 2 };
          p2 = { x: this.glass.width - hole.depth, y: hole.y };
          p3 = { x: this.glass.width, y: hole.y - hole.width / 2 };
        } else if (minDist === distToBottom) {
          // Bottom edge triangle
          p1 = { x: hole.x - hole.width / 2, y: 0 };
          p2 = { x: hole.x, y: hole.depth };
          p3 = { x: hole.x + hole.width / 2, y: 0 };
        } else {
          // Top edge triangle
          p1 = { x: hole.x - hole.width / 2, y: this.glass.height };
          p2 = { x: hole.x, y: this.glass.height - hole.depth };
          p3 = { x: hole.x + hole.width / 2, y: this.glass.height };
        }

        // Point-in-triangle test using barycentric coordinates
        const sign = (px, py, ax, ay, bx, by) => {
          return (px - bx) * (ay - by) - (ax - bx) * (py - by);
        };

        const d1 = sign(x, y, p1.x, p1.y, p2.x, p2.y);
        const d2 = sign(x, y, p2.x, p2.y, p3.x, p3.y);
        const d3 = sign(x, y, p3.x, p3.y, p1.x, p1.y);

        const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
        const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

        if (!(hasNeg && hasPos)) {
          return i;
        }
      } else if (
        hole.shape === "circle" ||
        hole.shape === "taladro" ||
        hole.shape === "avellanado"
      ) {
        const radius = hole.diameter / 2;
        const dx = x - hole.x;
        const dy = y - hole.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius) {
          return i;
        }
      } else if (hole.shape === "rectangle") {
        // Rectangle: hole.x, hole.y is bottom-left corner
        if (
          x >= hole.x &&
          x <= hole.x + hole.width &&
          y >= hole.y &&
          y <= hole.y + hole.height
        ) {
          return i;
        }
      }
    }

    return -1;
  }

  setTool(tool) {
    this.currentTool = tool;
    // Don't deselect holes when changing tools - let users keep editing
    // this.selectedHoleIndex = -1;
    this.render();

    // Update cursor based on tool
    if (tool === "select") {
      this.canvas.style.cursor = "default";
    } else if (tool === "paint") {
      this.canvas.style.cursor = "crosshair";
    } else {
      this.canvas.style.cursor = "crosshair";
    }

    // Update tool button states
    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector('[data-tool="' + tool + '"]')
      ?.classList.add("active");

    // Leaving the works tool clears the pending placement template.
    if (tool !== "work") this.pendingWorkTemplate = null;
  }

  // ----- Works library palette (Phase 5) -----

  /** Build the searchable, categorised works palette. */
  buildWorksPalette(filter) {
    const list = document.getElementById("works-list");
    if (!list || !window.WORKS_CATEGORIES || !window.WORKS_LIBRARY) return;
    const q = (filter || "").trim().toLowerCase();
    list.innerHTML = "";

    window.WORKS_CATEGORIES.forEach((cat) => {
      const items = Object.keys(window.WORKS_LIBRARY)
        .filter((id) => window.WORKS_LIBRARY[id].category === cat.id)
        .filter((id) => {
          if (!q) return true;
          return (
            window.WORKS_LIBRARY[id].name.toLowerCase().includes(q) ||
            cat.name.toLowerCase().includes(q)
          );
        });
      if (items.length === 0) return;

      const group = document.createElement("div");
      group.className = "works-group";
      const h = document.createElement("div");
      h.className = "works-group-title";
      h.textContent = cat.name;
      group.appendChild(h);

      items.forEach((id) => {
        const tpl = window.WORKS_LIBRARY[id];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "work-item";
        btn.dataset.work = id;
        btn.innerHTML =
          '<span class="work-thumb">' +
          this.workThumbnailSVG(id) +
          "</span><span>" +
          tpl.name +
          "</span>";
        btn.addEventListener("click", () => this.selectWorkTemplate(id));
        group.appendChild(btn);
      });
      list.appendChild(group);
    });
  }

  /** Tiny preview SVG of a work, drawn in its own little viewport. */
  workThumbnailSVG(id) {
    const tpl = window.WORKS_LIBRARY[id];
    if (!tpl) return "";
    const params = window.WorksLibrary.defaultParams(id);
    const res = tpl.generate(params, { h: false, v: false }, this.glass) || {};
    const items = res.items || [];
    // bounds
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    const eat = (x, y) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    };
    items.forEach((it) => {
      if (it.t === "circle" || it.t === "ring") {
        eat(it.cx - it.r, it.cy - it.r);
        eat(it.cx + it.r, it.cy + it.r);
      } else if (it.t === "rect") {
        eat(it.x, it.y);
        eat(it.x + it.w, it.y + it.h);
      } else if (it.t === "slot") {
        const hw = (it.vertical ? it.width : it.length) / 2;
        const hh = (it.vertical ? it.length : it.width) / 2;
        eat(it.cx - hw, it.cy - hh);
        eat(it.cx + hw, it.cy + hh);
      } else if (it.t === "poly") {
        it.points.forEach((p) => eat(p.x, p.y));
      }
    });
    if (!isFinite(minX)) return "";
    const w = maxX - minX || 1;
    const hh = maxY - minY || 1;
    const pad = Math.max(w, hh) * 0.15 + 1;
    const vb = `${minX - pad} ${-(maxY + pad)} ${w + pad * 2} ${hh + pad * 2}`;
    const parts = [];
    const yf = (y) => -y; // flip Y for SVG
    items.forEach((it) => {
      if (it.t === "circle") {
        parts.push(`<circle cx="${it.cx}" cy="${yf(it.cy)}" r="${it.r}"/>`);
      } else if (it.t === "ring") {
        parts.push(`<circle cx="${it.cx}" cy="${yf(it.cy)}" r="${it.r}"/>`);
        parts.push(`<circle cx="${it.cx}" cy="${yf(it.cy)}" r="${it.rInner}"/>`);
      } else if (it.t === "rect") {
        parts.push(`<rect x="${it.x}" y="${yf(it.y + it.h)}" width="${it.w}" height="${it.h}"/>`);
      } else if (it.t === "slot") {
        const ww = it.vertical ? it.width : it.length;
        const hgt = it.vertical ? it.length : it.width;
        parts.push(
          `<rect x="${it.cx - ww / 2}" y="${yf(it.cy + hgt / 2)}" width="${ww}" height="${hgt}" rx="${it.width / 2}"/>`,
        );
      } else if (it.t === "poly") {
        parts.push(
          `<polygon points="${it.points.map((p) => p.x + "," + yf(p.y)).join(" ")}"/>`,
        );
      }
    });
    const sw = Math.max(w, hh) * 0.04;
    return `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linejoin="round">${parts.join("")}</svg>`;
  }

  /** Enter placement mode for a works-library template. */
  selectWorkTemplate(id) {
    this.pendingWorkTemplate = id;
    this.setTool("work");
    document.querySelectorAll(".work-item").forEach((b) => {
      b.classList.toggle("active", b.dataset.work === id);
    });
  }

  /** Render the parameter + mirror editor for the selected work. */
  renderWorkProperties() {
    const panel = document.getElementById("work-properties");
    if (!panel) return;
    const hole = this.holes[this.selectedHoleIndex];
    if (!hole || hole.shape !== "work") {
      panel.style.display = "none";
      panel.innerHTML = "";
      return;
    }
    const tpl = window.WORKS_LIBRARY[hole.templateId];
    if (!tpl) {
      panel.style.display = "none";
      return;
    }
    panel.style.display = "block";
    let html = '<div class="work-prop-title">' + tpl.name + "</div>";
    tpl.params.forEach((p) => {
      const val = hole.params[p.key] != null ? hole.params[p.key] : p.def;
      html +=
        '<label class="work-prop-row"><span>' +
        p.label +
        ' (mm)</span><input type="number" data-param="' +
        p.key +
        '" value="' +
        Math.round(val) +
        '" min="' +
        (p.min != null ? p.min : 0) +
        '" step="1"></label>';
    });
    html +=
      '<div class="work-prop-mirror">' +
      '<label><input type="checkbox" data-mirror="h"' +
      (hole.mirror && hole.mirror.h ? " checked" : "") +
      "> Mirror H</label>" +
      '<label><input type="checkbox" data-mirror="v"' +
      (hole.mirror && hole.mirror.v ? " checked" : "") +
      "> Mirror V</label></div>";
    html +=
      '<button type="button" class="btn btn-outline work-prop-delete">Delete Work</button>';
    panel.innerHTML = html;

    const self = this;
    panel.querySelectorAll("input[data-param]").forEach((inp) => {
      inp.addEventListener("change", () => {
        const v = parseFloat(inp.value);
        if (!isNaN(v)) {
          hole.params[inp.dataset.param] = v;
          self.render();
        }
      });
    });
    panel.querySelectorAll("input[data-mirror]").forEach((inp) => {
      inp.addEventListener("change", () => {
        hole.mirror = hole.mirror || { h: false, v: false };
        hole.mirror[inp.dataset.mirror] = inp.checked;
        self.render();
      });
    });
    const del = panel.querySelector(".work-prop-delete");
    if (del)
      del.addEventListener("click", () => {
        self.holes.splice(self.selectedHoleIndex, 1);
        self.selectedHoleIndex = -1;
        self.render();
        self.renderWorkProperties();
        if (typeof self.renderHolesList === "function") self.renderHolesList();
      });
  }

  updateGlassDimensions(width, height, thickness) {
    this.glass.width = parseFloat(width) || 1200;
    this.glass.height = parseFloat(height) || 800;
    this.glass.thickness = parseFloat(thickness) || 6;

    this.setupCanvas();
    this.render();
  }

  // --- Glass Shape Methods ---

  /**
   * Get the polygon points defining the glass outline in glass coordinates (mm).
   * Y=0 is at the bottom.
   */
  getGlassPoints() {
    const shapeDef = GLASS_SHAPES[this.glass.shape] || GLASS_SHAPES["rectangle"];
    let points = shapeDef.generate(this.glass.width, this.glass.height, this.glass.shapeParams || {}, this.glass);

    const w = this.glass.width;
    const h = this.glass.height;

    if (this.glass.flipH) {
      points = points.map((p) => ({ x: w - p.x, y: p.y }));
    }
    if (this.glass.flipV) {
      points = points.map((p) => ({ x: p.x, y: h - p.y }));
    }

    return points;
  }

  /**
   * Rotate the glass shape 90 degrees clockwise.
   * Swaps width/height and transforms the shape accordingly.
   */
  rotateShape90() {
    if (this.glass.shape === "rectangle" || this.glass.shape === "circle") {
      // For rectangle/circle just swap dimensions
      const tmp = this.glass.width;
      this.glass.width = this.glass.height;
      this.glass.height = tmp;
    } else if (this.glass.shape === "freeform") {
      // Rotate freeform points: (x, y) → (y, oldW - x), then swap w/h
      const oldW = this.glass.width;
      this.glass.freeformPoints = this.glass.freeformPoints.map((p) => ({
        x: p.y,
        y: oldW - p.x,
      }));
      const tmp = this.glass.width;
      this.glass.width = this.glass.height;
      this.glass.height = tmp;
    } else {
      // For predefined shapes, cycle through flip combinations
      // to achieve rotation: rotate CW = flipH then swap flips diagonally
      const wasFlipH = this.glass.flipH;
      const wasFlipV = this.glass.flipV;
      // CW rotation: flipH,flipV → new states
      // 0,0 → 0,1 → 1,1 → 1,0 → 0,0
      if (!wasFlipH && !wasFlipV) {
        this.glass.flipV = true;
      } else if (!wasFlipH && wasFlipV) {
        this.glass.flipH = true;
      } else if (wasFlipH && wasFlipV) {
        this.glass.flipV = false;
      } else {
        this.glass.flipH = false;
      }
      // Also swap width and height
      const tmp = this.glass.width;
      this.glass.width = this.glass.height;
      this.glass.height = tmp;
    }

    // Update dimension inputs
    const widthInput = document.getElementById("glass-width");
    const heightInput = document.getElementById("glass-height");
    if (widthInput) widthInput.value = Math.round(this.glass.width);
    if (heightInput) heightInput.value = Math.round(this.glass.height);

    this.setupCanvas();
    this.render();
    this.updateShapeParamsUI();
  }

  /**
   * Flip the glass shape horizontally (mirror left-right).
   */
  flipShapeH() {
    if (this.glass.shape === "freeform") {
      const w = this.glass.width;
      this.glass.freeformPoints = this.glass.freeformPoints.map((p) => ({
        x: w - p.x,
        y: p.y,
      }));
    } else {
      this.glass.flipH = !this.glass.flipH;
    }
    this.render();
    this.updateShapeParamsUI();
  }

  /**
   * Flip the glass shape vertically (mirror top-bottom).
   */
  flipShapeV() {
    if (this.glass.shape === "freeform") {
      const h = this.glass.height;
      this.glass.freeformPoints = this.glass.freeformPoints.map((p) => ({
        x: p.x,
        y: h - p.y,
      }));
    } else {
      this.glass.flipV = !this.glass.flipV;
    }
    this.render();
    this.updateShapeParamsUI();
  }

  /**
   * Find a measurement label at the given canvas pixel coordinates.
   */
  findMeasurementAtPoint(canvasX, canvasY) {
    for (const area of this.measurementHitAreas) {
      if (
        canvasX >= area.x - area.w / 2 &&
        canvasX <= area.x + area.w / 2 &&
        canvasY >= area.y - area.h / 2 &&
        canvasY <= area.y + area.h / 2
      ) {
        return area;
      }
    }
    return null;
  }

  /**
   * Show an inline input over a measurement label for direct editing.
   */
  showInlineMeasurementEditor(hitArea) {
    // Remove any existing editor
    const existing = document.getElementById("inline-measurement-editor");
    if (existing) {
      existing.remove();
    }

    // Convert canvas pixel position to page position
    const canvasRect = this.canvas.getBoundingClientRect();
    const displayScaleX = canvasRect.width / this.canvas.width;
    const displayScaleY = canvasRect.height / this.canvas.height;
    const pageX = canvasRect.left + hitArea.x * displayScaleX;
    const pageY = canvasRect.top + hitArea.y * displayScaleY;

    const input = document.createElement("input");
    input.id = "inline-measurement-editor";
    input.type = "number";
    input.value = Math.round(hitArea.value);
    input.step = "1";
    input.min = "1";
    input.style.cssText = `
      position: fixed;
      left: ${pageX - 40}px;
      top: ${pageY - 14}px;
      width: 80px;
      height: 28px;
      font-size: 13px;
      font-weight: bold;
      text-align: center;
      border: 2px solid #2563eb;
      border-radius: 6px;
      outline: none;
      z-index: 10000;
      background: white;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      color: #1e293b;
    `;

    // Prevent mousedown on the input from bubbling to the canvas
    input.addEventListener("mousedown", (ev) => ev.stopPropagation());

    document.body.appendChild(input);

    // Delay focus so the original mousedown event fully completes first
    let ready = false;
    requestAnimationFrame(() => {
      input.focus();
      input.select();
      // Only enable blur-to-apply after input is fully ready
      setTimeout(() => {
        ready = true;
      }, 150);
    });

    let applied = false;
    const self = this;

    // The new scene-based hit areas carry an `editable` descriptor. Older call
    // sites may still pass a flat `{type, sideIndex}` shape, so support both.
    const ed = hitArea.editable || hitArea;

    const applyValue = () => {
      if (applied) return;
      applied = true;
      const newVal = parseFloat(input.value);
      input.remove();

      if (!newVal || newVal <= 0) return;

      switch (ed.type) {
        case "glassW":
        case "width": {
          self.glass.width = newVal;
          const el = document.getElementById("glass-width");
          if (el) el.value = Math.round(newVal);
          self.setupCanvas();
          self.render();
          self.updateShapeParamsUI();
          break;
        }
        case "glassH":
        case "height": {
          self.glass.height = newVal;
          const el = document.getElementById("glass-height");
          if (el) el.value = Math.round(newVal);
          self.setupCanvas();
          self.render();
          self.updateShapeParamsUI();
          break;
        }
        case "thickness": {
          self.glass.thickness = newVal;
          const el = document.getElementById("glass-thickness");
          if (el) el.value = newVal;
          const sel = document.getElementById("glass-thickness-select");
          if (sel) {
            const presets = ["4", "6", "8", "9.5", "12"];
            sel.value = presets.includes(String(newVal))
              ? String(newVal)
              : "custom";
          }
          self.render();
          break;
        }
        case "side": {
          if (self.glass.shape === "freeform") {
            self.updateSideLength(ed.sideIndex, String(newVal));
          } else {
            self.updatePredefinedSideLength(ed.sideIndex, String(newVal));
          }
          break;
        }
        case "workX":
        case "workY": {
          self.setWorkDistance(ed, newVal);
          break;
        }
      }
    };

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        applyValue();
      }
      if (ev.key === "Escape") {
        applied = true;
        input.remove();
      }
    });

    input.addEventListener("blur", () => {
      // Only apply on blur if the input was fully initialized
      if (!ready) return;
      setTimeout(applyValue, 100);
    });
  }

  /**
   * Fit the whole dimensioned scene into the canvas. Only ever shrinks from the
   * glass-only base scale (never zooms past it) and recentres the drawing so the
   * dimension bands, dotted leaders and labels are always visible.
   */
  fitViewToScene() {
    if (!window.DesignerScene || !this.scene) return;
    const b = window.DesignerScene.sceneBounds(this.scene);
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const margin = 22;
    const base = this.baseScale || this.scale;
    let fit = Math.min((cw - 2 * margin) / (b.w || 1), (ch - 2 * margin) / (b.h || 1));
    if (!isFinite(fit) || fit <= 0) fit = base;
    this.scale = Math.min(base, fit);
    this.offsetX = (cw - b.w * this.scale) / 2 - b.minX * this.scale;
    this.offsetY =
      (ch - b.h * this.scale) / 2 - (this.glass.height - b.maxY) * this.scale;
  }

  /**
   * Move a work (hole/cutout) so the gap between the reference glass edge and
   * the work's near edge equals `newVal` mm (matches the nearest-edge dimension
   * shown on screen).
   */
  setWorkDistance(ed, newVal) {
    const hole = this.holes[ed.workIndex];
    if (!hole) return;
    const isRect = hole.shape === "rectangle";
    const sw = this.scene && this.scene.works && this.scene.works[ed.workIndex];
    // Round holes are measured to their centre (no edge offset); cutouts to the
    // near edge, so we shift by the centre->edge distance.
    const toCenter = !sw || sw.dimRef === "center";

    if (ed.type === "workX") {
      let newCenterX;
      if (sw && !toCenter) {
        const offMin = sw.center.x - sw.bbox.minX; // centre -> left edge
        const offMax = sw.bbox.maxX - sw.center.x; // centre -> right edge
        newCenterX =
          ed.ref === "right"
            ? ed.edge - newVal - offMax
            : ed.edge + newVal + offMin;
      } else {
        newCenterX = ed.ref === "right" ? ed.edge - newVal : ed.edge + newVal;
      }
      hole.x = isRect ? newCenterX - (hole.width || 0) / 2 : newCenterX;
    } else if (ed.type === "workY") {
      let newCenterY;
      if (sw && !toCenter) {
        const offMin = sw.center.y - sw.bbox.minY; // centre -> bottom edge
        const offMax = sw.bbox.maxY - sw.center.y; // centre -> top edge
        newCenterY =
          ed.ref === "top"
            ? ed.edge - newVal - offMax
            : ed.edge + newVal + offMin;
      } else {
        newCenterY = ed.ref === "top" ? ed.edge - newVal : ed.edge + newVal;
      }
      hole.y = isRect ? newCenterY - (hole.height || 0) / 2 : newCenterY;
    }

    this.render();
    if (typeof this.renderHolesList === "function") this.renderHolesList();
  }

  /**
   * Create a canvas path for the glass shape outline.
   */
  createGlassCanvasPath(ctx) {
    const points = this.getGlassPoints();
    ctx.beginPath();
    const first = this.glassToCanvas(points[0].x, points[0].y);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < points.length; i++) {
      const p = this.glassToCanvas(points[i].x, points[i].y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
  }

  /**
   * Test whether a point (in glass mm coordinates) is inside the glass shape.
   */
  isPointInGlass(x, y) {
    // Quick bounding box check first
    if (
      x < 0 ||
      x > this.glass.width ||
      y < 0 ||
      y > this.glass.height
    ) {
      return false;
    }
    if (this.glass.shape === "rectangle") {
      return true; // Already passed bounding box check
    }
    return this.pointInPolygon(x, y, this.getGlassPoints());
  }

  /**
   * Ray-casting point-in-polygon test.
   */
  pointInPolygon(px, py, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;
      if (
        yi > py !== yj > py &&
        px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
    return inside;
  }

  /**
   * Update the glass shape type.
   */
  updateGlassShape(shape) {
    this.glass.shape = shape;

    // Set default params from shape definition for any missing params
    const shapeDef = GLASS_SHAPES[shape];
    if (shapeDef && shapeDef.params) {
      shapeDef.params.forEach(p => {
        if (this.glass.shapeParams[p.key] === undefined || this.glass.shapeParams[p.key] === null) {
          this.glass.shapeParams[p.key] = p.defaultFn(this.glass.width, this.glass.height);
        }
      });
    }

    this.render();
    this.updateShapeParamsUI();

    // Update shape picker button
    const pickerName = document.getElementById("shape-picker-name");
    const pickerIcon = document.getElementById("shape-picker-icon");
    if (pickerName && shapeDef) {
      pickerName.textContent = shapeDef.name;
    }
    if (pickerIcon) {
      pickerIcon.innerHTML = generateShapeSVG(shape);
    }
  }

  /**
   * Update a shape-specific parameter.
   */
  updateShapeParam(key, value) {
    this.glass.shapeParams[key] = parseFloat(value) || 0;
    this.render();
  }

  /**
   * Enter freeform shape drawing mode.
   */
  startFreeformDrawing() {
    this.isDrawingFreeform = true;
    this.freeformTempPoints = [];
    // Temporarily show as rectangle while drawing
    this.glass.shape = "rectangle";
    this.render();
    this.updateShapeParamsUI();
  }

  /**
   * Cancel freeform shape drawing.
   */
  cancelFreeformDrawing() {
    this.isDrawingFreeform = false;
    this.freeformTempPoints = [];
    this.freeformCursorPos = null;
    // Restore freeform shape if it had points, otherwise stay rectangle
    if (
      this.glass.freeformPoints &&
      this.glass.freeformPoints.length >= 3
    ) {
      this.glass.shape = "freeform";
    }
    this.render();
    this.updateShapeParamsUI();
  }

  /**
   * Finalize the freeform shape from drawn points.
   */
  finalizeFreeformShape() {
    if (this.freeformTempPoints.length >= 3) {
      this.glass.freeformPoints = this.freeformTempPoints.map((p) => ({
        ...p,
      }));
      this.glass.shape = "freeform";
    }
    this.isDrawingFreeform = false;
    this.freeformTempPoints = [];
    this.freeformCursorPos = null;
    this.render();
    this.renderHolesList();
    this.updateShapeParamsUI();

    // Show side lengths modal for exact measurements
    if (this.glass.freeformPoints.length >= 3) {
      this.showSideLengthsModal();
    }
  }

  /**
   * Handle double-click for freeform shape closing.
   */
  onDoubleClick(e) {
    if (this.isDrawingFreeform && this.freeformTempPoints.length >= 3) {
      // Remove the last point (added by the mousedown of double-click)
      this.freeformTempPoints.pop();
      this.finalizeFreeformShape();
    }
  }

  /**
   * Update the shape parameters UI panel.
   */
  updateShapeParamsUI() {
    const container = document.getElementById("shape-params");
    if (!container) return;

    const shape = this.glass.shape;
    const params = this.glass.shapeParams;
    const t = window.i18n ? window.i18n.t : (key) => key;
    const shapeDef = GLASS_SHAPES[shape];

    let html = "";

    // Auto-generate parameter inputs from shape definition (for non-freeform shapes)
    if (shape !== "freeform" && !this.isDrawingFreeform && shapeDef && shapeDef.params.length > 0) {
      shapeDef.params.forEach(p => {
        const val = params[p.key] !== undefined ? params[p.key] : p.defaultFn(this.glass.width, this.glass.height);
        html += `
          <label>
            <span>${t(p.key) || p.label} (mm):</span>
            <input type="number" value="${Math.round(val)}"
              onchange="designer.updateShapeParam('${p.key}', this.value)">
          </label>
        `;
      });
    }

    // Freeform-specific UI
    if (shape === "freeform" || this.isDrawingFreeform) {
      const hasPoints =
        this.glass.freeformPoints && this.glass.freeformPoints.length >= 3;
      html += `
        <button class="btn btn-outline" style="width: 100%; margin-top: 0.5rem;"
          onclick="designer.startFreeformDrawing()">
          ${hasPoints ? t("redrawShape") || "Redraw Shape" : t("drawShape") || "Draw Shape"}
        </button>
        ${
          this.isDrawingFreeform
            ? `
          <button class="btn btn-outline" style="width: 100%; margin-top: 0.25rem;"
            onclick="designer.cancelFreeformDrawing()">
            ${t("cancelDrawing") || "Cancel Drawing"}
          </button>
          <p style="font-size: 0.75rem; color: #64748b; margin-top: 0.5rem;">
            ${t("freeformInstructions") || "Click to place points. Hold Shift for straight lines. Double-click or click near the first point to close the shape."}
          </p>
        `
            : ""
        }
      `;

      // Show editable side lengths for existing freeform shapes
      if (hasPoints && !this.isDrawingFreeform) {
        const sideLengths = this.calculateSideLengths();
        html += `
          <div style="margin-top: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.8rem; font-weight: 600; color: #374151;">
                ${t("sideLengths") || "Side Lengths"}
              </span>
              <button class="btn btn-outline" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;"
                onclick="designer.showSideLengthsModal()">
                ${t("editAll") || "Edit All"}
              </button>
            </div>
        `;
        sideLengths.forEach((side, i) => {
          const isClosing = i === sideLengths.length - 1;
          html += `
            <label style="display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.25rem; font-size: 0.8rem;">
              <span style="min-width: 48px; color: ${isClosing ? "#94a3b8" : "#374151"};">
                ${i + 1}${isClosing ? "*" : ""}:
              </span>
              <input type="number" value="${Math.round(side.length)}" step="1" min="1"
                style="flex: 1; padding: 0.2rem 0.35rem; border: 1px solid #cbd5e1; border-radius: 3px; font-size: 0.8rem;"
                onchange="designer.updateSideLength(${i}, this.value)">
              <span style="color: #94a3b8; font-size: 0.75rem;">mm</span>
            </label>
          `;
        });
        html += `
            <p style="font-size: 0.7rem; color: #94a3b8; margin: 0.25rem 0 0;">* closing side (auto-adjusts)</p>
          </div>
        `;
      }
    }

    // Show side lengths for predefined non-rectangular shapes
    // Shapes with updatePredefinedSideLength support get editable inputs;
    // others get read-only display.
    const editableShapes = ["rectangle", "trapezoid", "right-trapezoid", "triangle", "right-triangle", "l-shape"];
    if (
      !this.isDrawingFreeform &&
      shape !== "rectangle" &&
      shape !== "circle" &&
      shape !== "oval" &&
      shape !== "freeform"
    ) {
      const points = this.getGlassPoints();
      if (points.length <= 12) {
        const sideLengths = this.calculateSideLengths();
        const isEditable = editableShapes.includes(shape);
        html += `
          <div style="margin-top: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 0.5rem;">
            <span style="font-size: 0.8rem; font-weight: 600; color: #374151; display: block; margin-bottom: 0.5rem;">
              ${t("sideLengths") || "Side Lengths"}
            </span>
        `;
        sideLengths.forEach((side, i) => {
          if (isEditable) {
            html += `
              <label style="display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.25rem; font-size: 0.8rem;">
                <span style="min-width: 48px; color: #374151;">
                  ${i + 1}:
                </span>
                <input type="number" value="${Math.round(side.length)}" step="1" min="1"
                  style="flex: 1; padding: 0.2rem 0.35rem; border: 1px solid #cbd5e1; border-radius: 3px; font-size: 0.8rem;"
                  onchange="designer.updatePredefinedSideLength(${i}, this.value)">
                <span style="color: #94a3b8; font-size: 0.75rem;">mm</span>
              </label>
            `;
          } else {
            html += `
              <div style="display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.25rem; font-size: 0.8rem;">
                <span style="min-width: 48px; color: #374151;">${i + 1}:</span>
                <span style="flex: 1; padding: 0.2rem 0.35rem; color: #64748b;">${Math.round(side.length)}mm</span>
              </div>
            `;
          }
        });
        html += `</div>`;
      }
    }

    container.innerHTML = html;
  }

  /**
   * Draw overlay for freeform shape drawing mode.
   */
  drawFreeformOverlay() {
    const ctx = this.ctx;
    const points = this.freeformTempPoints;

    // Draw semi-transparent bounding box
    ctx.fillStyle = "rgba(5, 150, 105, 0.05)";
    ctx.fillRect(
      this.offsetX,
      this.offsetY,
      this.glass.width * this.scale,
      this.glass.height * this.scale,
    );

    // Draw instruction text
    ctx.fillStyle = "#059669";
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    const msg =
      points.length < 3
        ? "Click to add points (min 3)"
        : "Double-click or click near first point to close";
    ctx.fillText(msg, this.canvas.width / 2, 25);

    if (points.length === 0) return;

    // Draw lines between points
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    const first = this.glassToCanvas(points[0].x, points[0].y);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < points.length; i++) {
      const p = this.glassToCanvas(points[i].x, points[i].y);
      ctx.lineTo(p.x, p.y);
    }
    // Draw closing line (dashed) back to first point
    if (points.length >= 3) {
      ctx.lineTo(first.x, first.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Fill the polygon area with semi-transparent green
    if (points.length >= 3) {
      ctx.fillStyle = "rgba(5, 150, 105, 0.15)";
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < points.length; i++) {
        const p = this.glassToCanvas(points[i].x, points[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fill();
    }

    // Draw cursor preview line from last point to cursor
    if (this.freeformCursorPos && points.length > 0) {
      const lastPt = points[points.length - 1];
      const lastCanvas = this.glassToCanvas(lastPt.x, lastPt.y);
      const curCanvas = this.glassToCanvas(this.freeformCursorPos.x, this.freeformCursorPos.y);

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(lastCanvas.x, lastCanvas.y);
      ctx.lineTo(curCanvas.x, curCanvas.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw cursor dot
      ctx.fillStyle = "rgba(16, 185, 129, 0.5)";
      ctx.beginPath();
      ctx.arc(curCanvas.x, curCanvas.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw dots at each point
    points.forEach((pt, i) => {
      const cp = this.glassToCanvas(pt.x, pt.y);
      ctx.fillStyle = i === 0 ? "#059669" : "#10b981";
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, i === 0 ? 7 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label the first point
      if (i === 0 && points.length >= 3) {
        ctx.fillStyle = "#059669";
        ctx.font = "bold 11px -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Close", cp.x + 10, cp.y - 5);
      }
    });
  }

  /**
   * Calculate the length and angle of each side of the glass outline.
   */
  calculateSideLengths() {
    const points = this.getGlassPoints();
    const n = points.length;
    const sides = [];

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      sides.push({
        from: i,
        to: (i + 1) % n,
        length: Math.sqrt(dx * dx + dy * dy),
        angle: Math.atan2(dy, dx),
      });
    }
    return sides;
  }

  /**
   * Adjust freeform points based on new side lengths while preserving angles.
   * Sides 0..N-2 keep their drawn angle; the closing side auto-adjusts.
   */
  adjustPointsFromSideLengths(newLengths) {
    const oldPoints = this.glass.freeformPoints.map((p) => ({ ...p }));
    const n = oldPoints.length;
    const newPoints = oldPoints.map((p) => ({ ...p }));

    for (let i = 0; i < n - 1; i++) {
      const p1 = newPoints[i];
      const p2 = newPoints[i + 1];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const currentLength = Math.sqrt(dx * dx + dy * dy);
      if (currentLength < 0.001) continue;

      const dirX = dx / currentLength;
      const dirY = dy / currentLength;
      const newP2x = p1.x + dirX * newLengths[i];
      const newP2y = p1.y + dirY * newLengths[i];

      const deltaX = newP2x - p2.x;
      const deltaY = newP2y - p2.y;

      for (let j = i + 1; j < n; j++) {
        newPoints[j] = {
          x: newPoints[j].x + deltaX,
          y: newPoints[j].y + deltaY,
        };
      }
    }

    // Normalize so min coords are at 0
    const allX = newPoints.map((p) => p.x);
    const allY = newPoints.map((p) => p.y);
    const minX = Math.min(...allX);
    const minY = Math.min(...allY);
    if (minX < 0 || minY < 0) {
      newPoints.forEach((p) => {
        p.x -= Math.min(minX, 0);
        p.y -= Math.min(minY, 0);
      });
    }

    return newPoints;
  }

  /**
   * Show modal to set exact side lengths after freeform drawing.
   */
  showSideLengthsModal() {
    const sides = this.calculateSideLengths();
    const n = sides.length;
    if (n > 20) return;

    const modal = document.createElement("div");
    modal.className = "side-lengths-modal";
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex;
      justify-content: center; align-items: center; z-index: 5000;
    `;

    let sidesHtml = "";
    sides.forEach((side, i) => {
      const isClosing = i === n - 1;
      sidesHtml += `
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
          <span style="min-width: 65px; font-weight: 500; font-size: 0.875rem; color: ${isClosing ? "#64748b" : "#1e293b"};">
            Side ${i + 1}${isClosing ? " *" : ""}:
          </span>
          <input type="number" id="side-length-${i}" value="${Math.round(side.length)}" step="1" min="1"
            style="flex: 1; padding: 0.5rem; border: 1px solid ${isClosing ? "#e2e8f0" : "#cbd5e1"}; border-radius: 4px; font-size: 0.875rem;
            ${isClosing ? "background: #f8fafc; color: #64748b;" : ""}">
          <span style="color: #64748b; font-size: 0.875rem;">mm</span>
        </div>
      `;
    });

    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 2rem; max-width: 450px; width: 90%; box-shadow: 0 20px 25px rgba(0,0,0,0.15);">
        <h3 style="margin: 0 0 0.5rem; color: #1e293b;">Set Side Lengths</h3>
        <p style="color: #64748b; font-size: 0.875rem; margin: 0 0 1.5rem;">
          Enter the exact length for each side. The closing side (*) auto-adjusts to close the shape.
        </p>
        ${sidesHtml}
        <div id="closing-side-info" style="display: none; background: #eff6ff; border-left: 4px solid #3b82f6; padding: 0.75rem; border-radius: 4px; margin: 1rem 0; font-size: 0.875rem; color: #1e40af;">
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
          <button class="btn btn-outline" id="side-lengths-skip">Skip</button>
          <button class="btn btn-primary" id="side-lengths-apply">Apply</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const self = this;

    document
      .getElementById("side-lengths-skip")
      .addEventListener("click", () => {
        modal.remove();
      });

    document
      .getElementById("side-lengths-apply")
      .addEventListener("click", () => {
        const newLengths = [];
        for (let i = 0; i < n; i++) {
          newLengths.push(
            parseFloat(document.getElementById(`side-length-${i}`).value) ||
              sides[i].length,
          );
        }

        const newPoints = self.adjustPointsFromSideLengths(newLengths);
        self.glass.freeformPoints = newPoints;

        // Update bounding box to fit shape
        const maxX = Math.max(...newPoints.map((p) => p.x));
        const maxY = Math.max(...newPoints.map((p) => p.y));
        if (maxX > 0) self.glass.width = Math.ceil(maxX);
        if (maxY > 0) self.glass.height = Math.ceil(maxY);

        // Update dimension inputs
        const widthInput = document.getElementById("glass-width");
        const heightInput = document.getElementById("glass-height");
        if (widthInput) widthInput.value = self.glass.width;
        if (heightInput) heightInput.value = self.glass.height;

        self.setupCanvas();

        // Calculate closing side
        const lastP = newPoints[n - 1];
        const firstP = newPoints[0];
        const closingLength = Math.sqrt(
          (firstP.x - lastP.x) ** 2 + (firstP.y - lastP.y) ** 2,
        );

        const infoDiv = document.getElementById("closing-side-info");
        infoDiv.style.display = "block";
        infoDiv.innerHTML = `Closing side (Side ${n}) is now <strong>${Math.round(closingLength)}mm</strong>.`;

        // Update closing side input to show actual value
        document.getElementById(`side-length-${n - 1}`).value =
          Math.round(closingLength);

        self.render();
        self.updateShapeParamsUI();
      });

    // Close on backdrop click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * Update a single freeform side length from the sidebar panel.
   */
  updateSideLength(sideIndex, newLengthStr) {
    const newLength = parseFloat(newLengthStr);
    if (!newLength || newLength <= 0) return;

    const sides = this.calculateSideLengths();
    const lengths = sides.map((s) => s.length);
    lengths[sideIndex] = newLength;

    const newPoints = this.adjustPointsFromSideLengths(lengths);
    this.glass.freeformPoints = newPoints;

    // Update bounding box
    const maxX = Math.max(...newPoints.map((p) => p.x));
    const maxY = Math.max(...newPoints.map((p) => p.y));
    if (maxX > 0) this.glass.width = Math.ceil(maxX);
    if (maxY > 0) this.glass.height = Math.ceil(maxY);

    const widthInput = document.getElementById("glass-width");
    const heightInput = document.getElementById("glass-height");
    if (widthInput) widthInput.value = this.glass.width;
    if (heightInput) heightInput.value = this.glass.height;

    this.setupCanvas();
    this.render();
  }

  /**
   * Update a side length for a predefined (non-freeform) shape.
   * Reverse-computes the shape parameters from the desired side length.
   */
  updatePredefinedSideLength(sideIndex, newLengthStr) {
    const val = parseFloat(newLengthStr);
    if (!val || val <= 0) return;

    const shape = this.glass.shape;
    const w = this.glass.width;
    const h = this.glass.height;
    const params = this.glass.shapeParams;

    switch (shape) {
      case "right-trapezoid": {
        // Sides: 0=bottom(w), 1=right hypotenuse, 2=top(topWidth), 3=left(h)
        const topWidth = params.topWidth || w * 0.6;
        if (sideIndex === 0) {
          this.glass.width = val;
        } else if (sideIndex === 1) {
          // hyp² = (w - topWidth)² + h²  →  h = sqrt(hyp² - (w-topWidth)²)
          const diff = w - topWidth;
          const hSq = val * val - diff * diff;
          if (hSq > 0) this.glass.height = Math.round(Math.sqrt(hSq));
        } else if (sideIndex === 2) {
          this.glass.shapeParams.topWidth = val;
        } else if (sideIndex === 3) {
          this.glass.height = val;
        }
        break;
      }
      case "trapezoid": {
        // Sides: 0=bottom(w), 1=right leg, 2=top(topWidth), 3=left leg
        const topWidth = params.topWidth || w * 0.6;
        if (sideIndex === 0) {
          this.glass.width = val;
        } else if (sideIndex === 1 || sideIndex === 3) {
          // leg = sqrt(offset² + h²)  →  h = sqrt(leg² - offset²)
          const offset = (w - topWidth) / 2;
          const hSq = val * val - offset * offset;
          if (hSq > 0) this.glass.height = Math.round(Math.sqrt(hSq));
        } else if (sideIndex === 2) {
          this.glass.shapeParams.topWidth = val;
        }
        break;
      }
      case "triangle": {
        // Sides: 0=bottom(w), 1=right leg, 2=left leg
        if (sideIndex === 0) {
          this.glass.width = val;
        } else if (sideIndex === 1 || sideIndex === 2) {
          const halfW = w / 2;
          const hSq = val * val - halfW * halfW;
          if (hSq > 0) this.glass.height = Math.round(Math.sqrt(hSq));
        }
        break;
      }
      case "right-triangle": {
        // Sides: 0=bottom(w), 1=hypotenuse, 2=left(h)
        if (sideIndex === 0) {
          this.glass.width = val;
        } else if (sideIndex === 1) {
          const hSq = val * val - w * w;
          if (hSq > 0) this.glass.height = Math.round(Math.sqrt(hSq));
        } else if (sideIndex === 2) {
          this.glass.height = val;
        }
        break;
      }
      case "l-shape": {
        // Points: (0,0),(w,0),(w,h-nh),(w-nw,h-nh),(w-nw,h),(0,h)
        // Sides: 0=w, 1=h-nh, 2=nw, 3=nh, 4=w-nw, 5=h
        const nw = params.notchWidth || w * 0.4;
        const nh = params.notchHeight || h * 0.4;
        if (sideIndex === 0) {
          this.glass.width = val;
        } else if (sideIndex === 1) {
          // h - nh = val → adjust notch height, keep overall height fixed
          const newNh = h - val;
          if (newNh > 0) this.glass.shapeParams.notchHeight = newNh;
        } else if (sideIndex === 2) {
          this.glass.shapeParams.notchWidth = val;
        } else if (sideIndex === 3) {
          this.glass.shapeParams.notchHeight = val;
        } else if (sideIndex === 4) {
          // w - nw = val → adjust notch width, keep overall width fixed
          const newNw = w - val;
          if (newNw > 0) this.glass.shapeParams.notchWidth = newNw;
        } else if (sideIndex === 5) {
          this.glass.height = val;
        }
        break;
      }
      default:
        return;
    }

    // Update dimension inputs
    const widthInput = document.getElementById("glass-width");
    const heightInput = document.getElementById("glass-height");
    if (widthInput) widthInput.value = Math.round(this.glass.width);
    if (heightInput) heightInput.value = Math.round(this.glass.height);

    this.setupCanvas();
    this.render();
    this.updateShapeParamsUI();
  }

  /**
   * Draw side length labels on the glass outline for non-rectangular shapes.
   */
  drawSideLengths() {
    const shape = this.glass.shape;
    if (shape === "rectangle" || shape === "circle") return;

    const points = this.getGlassPoints();
    const n = points.length;
    if (n > 12) return; // Skip arch curves with many segments

    const ctx = this.ctx;
    ctx.save();

    // Centroid for outward direction
    let cx = 0,
      cy = 0;
    points.forEach((p) => {
      cx += p.x;
      cy += p.y;
    });
    cx /= n;
    cy /= n;

    ctx.font =
      'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length < 10) continue;

      // Midpoint
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      // Direction away from centroid
      const toCX = cx - midX;
      const toCY = cy - midY;
      const toCDist = Math.sqrt(toCX * toCX + toCY * toCY);
      if (toCDist < 0.001) continue;

      const normalX = -toCX / toCDist;
      const normalY = -toCY / toCDist;

      const offsetMM = 14 / this.scale;
      const labelCanvas = this.glassToCanvas(
        midX + normalX * offsetMM,
        midY + normalY * offsetMM,
      );

      const sideNum = i + 1;
      const text = sideNum + ": " + Math.round(length) + "mm";
      const textWidth = ctx.measureText(text).width;
      const pillW = textWidth + 10;
      const pillH = 16;

      // Background pill
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.strokeStyle = "rgba(37, 99, 235, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(
          labelCanvas.x - pillW / 2,
          labelCanvas.y - pillH / 2,
          pillW,
          pillH,
          4,
        );
      } else {
        ctx.rect(
          labelCanvas.x - pillW / 2,
          labelCanvas.y - pillH / 2,
          pillW,
          pillH,
        );
      }
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = "#1e40af";
      ctx.fillText(text, labelCanvas.x, labelCanvas.y);

      // Draw small circled number on the glass edge (midpoint of the side)
      const edgeMid = this.glassToCanvas(midX, midY);
      const badgeR = 8;
      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.arc(edgeMid.x, edgeMid.y, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(String(sideNum), edgeMid.x, edgeMid.y);
      // Restore font for next label
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

      // Store hit area for click-to-edit
      this.measurementHitAreas.push({
        x: labelCanvas.x,
        y: labelCanvas.y,
        w: pillW + 6,
        h: pillH + 6,
        sideIndex: i,
        type: "side",
        value: length,
      });
    }

    ctx.restore();
  }

  /**
   * Draw side length labels on a target canvas context (for print).
   */
  drawSideLengthsOnCanvas(ctx) {
    const points = this.getGlassPoints();
    const n = points.length;
    if (n > 12) return;

    ctx.save();

    let cx = 0,
      cy = 0;
    points.forEach((p) => {
      cx += p.x;
      cy += p.y;
    });
    cx /= n;
    cy /= n;

    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length < 10) continue;

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      const toCX = cx - midX;
      const toCY = cy - midY;
      const toCDist = Math.sqrt(toCX * toCX + toCY * toCY);
      if (toCDist < 0.001) continue;

      const normalX = -toCX / toCDist;
      const normalY = -toCY / toCDist;

      const offsetMM = 18 / this.scale;
      const labelCanvas = this.glassToCanvas(
        midX + normalX * offsetMM,
        midY + normalY * offsetMM,
      );

      const text = Math.round(length) + "mm";
      const textWidth = ctx.measureText(text).width;
      const pillW = textWidth + 10;
      const pillH = 18;

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(
          labelCanvas.x - pillW / 2,
          labelCanvas.y - pillH / 2,
          pillW,
          pillH,
          3,
        );
      } else {
        ctx.rect(
          labelCanvas.x - pillW / 2,
          labelCanvas.y - pillH / 2,
          pillW,
          pillH,
        );
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.fillText(text, labelCanvas.x, labelCanvas.y);
    }

    ctx.restore();
  }

  // Window resize handler for responsive canvas
  onWindowResize() {
    // Debounce resize events
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.setupCanvas();
      this.render();
    }, 250);
  }

  // Touch event handlers for mobile support
  onTouchStart(e) {
    if (e.cancelable) {
      e.preventDefault();
    }
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      this.canvas.dispatchEvent(mouseEvent);
    }
  }

  onTouchMove(e) {
    if (e.cancelable) {
      e.preventDefault();
    }
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      this.canvas.dispatchEvent(mouseEvent);
    }
  }

  onTouchEnd(e) {
    if (e.cancelable) {
      e.preventDefault();
    }
    const mouseEvent = new MouseEvent("mouseup", {});
    this.canvas.dispatchEvent(mouseEvent);
  }

  updatePropertiesPanel() {
    this.renderHolesList();
    this.renderWorkProperties();
  }

  renderHolesList() {
    const listContainer = document.getElementById("holes-list");

    if (!listContainer) {
      console.error("Holes list container not found");
      return;
    }

    if (this.holes.length === 0) {
      listContainer.innerHTML = `<p style="color: #64748b; font-size: 0.875rem; font-style: italic;" data-i18n="noHoles">${window.i18n ? window.i18n.t("noHoles") : "No holes yet. Click on canvas to add."}</p>`;
      return;
    }

    listContainer.innerHTML = this.holes
      .map((hole, index) => {
        const isSelected = index === this.selectedHoleIndex;
        const selectedClass = isSelected ? "selected" : "";

        const t = window.i18n ? window.i18n.t : (key) => key;

        // Build common herraje selection HTML
          const herrajes_herraje_id = hole.herrajes_herraje_id || "";
          const herraje_html = `
                              <label style="display: block; margin-bottom: 0.5rem;">
                                  <span style="font-size: 0.875rem; color: #374151;">${t("hardware")}:</span>
                                  <div id="herraje-menu-${index}" class="herraje-menu-wrapper" style="margin-top: 0.25rem; position: relative;">
                                      <button type="button" id="herraje-btn-${index}" class="herraje-menu-button" style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px; background: white; cursor: pointer; text-align: left; display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; transition: all 0.2s;">
                                          <span id="herraje-btn-text-${index}" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">-- ${t("selectHardware")} --</span>
                                          <span style="margin-left: 0.5rem; flex-shrink: 0;">▼</span>
                                      </button>
                                      <div id="herraje-dropdown-${index}" class="herraje-dropdown-menu" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #cbd5e1; border-radius: 4px; z-index: 100; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-top: 0.25rem; max-height: 400px; overflow-y: auto;">
                                          <div style="padding: 0.5rem;">
                                              <p style="margin: 0; padding: 0.5rem; color: #64748b; font-size: 0.875rem; text-align: center;">Loading hardware...</p>
                                          </div>
                                      </div>
                                      <input type="hidden" id="herraje-select-${index}" value="">
                                  </div>
                              </label>
                              <div id="herraje-preview-${index}" style="margin-top: 0.5rem; display: none; border: 1px solid #e2e8f0; border-radius: 4px; padding: 0.5rem; background: #f8fafc;">
                                  <img id="herraje-img-${index}" style="width: 100%; height: 60px; object-fit: contain; border-radius: 2px;">
                              </div>
                          `;

        if (hole.shape === "clip") {
          return `
                    <div class="hole-item ${selectedClass}" data-hole-index="${index}">
                        <div class="hole-item-header">
                            <span class="hole-item-title">${t("edgeClipLabel")} ${index + 1}</span>
                            <button class="hole-item-delete" onclick="designer.deleteHole(${index})" title="Delete">×</button>
                        </div>
                        <div class="hole-item-props">
                            <label>
                                ${t("xPosition")} (mm):
                                <input type="number" value="${Math.round(hole.x)}"
                                    onchange="designer.updateHoleProperty(${index}, 'x', this.value)">
                            </label>
                            <label>
                                ${t("yPosition")} (mm):
                                <input type="number" value="${Math.round(hole.y)}"
                                    onchange="designer.updateHoleProperty(${index}, 'y', this.value)">
                            </label>
                            <label>
                                ${t("width")} (mm):
                                <input type="number" value="${Math.round(hole.width)}"
                                    onchange="designer.updateHoleProperty(${index}, 'width', this.value)">
                            </label>
                            <label>
                                ${t("depth")} (mm):
                                <input type="number" value="${Math.round(hole.depth)}"
                                    onchange="designer.updateHoleProperty(${index}, 'depth', this.value)">
                            </label>
                            ${herraje_html}
                        </div>
                    </div>
                `;
        } else if (hole.shape === "circle" || hole.shape === "taladro") {
          const label =
            hole.shape === "taladro" ? t("taladroLabel") : t("circleHoleLabel");
          return `
                    <div class="hole-item ${selectedClass}" data-hole-index="${index}">
                        <div class="hole-item-header">
                            <span class="hole-item-title">${label} ${index + 1}</span>
                            <button class="hole-item-delete" onclick="designer.deleteHole(${index})" title="Delete">×</button>
                        </div>
                        <div class="hole-item-props">
                            <label>
                                ${t("xPosition")} (mm):
                                <input type="number" value="${Math.round(hole.x)}"
                                    onchange="designer.updateHoleProperty(${index}, 'x', this.value)">
                            </label>
                            <label>
                                ${t("yPosition")} (mm):
                                <input type="number" value="${Math.round(hole.y)}"
                                    onchange="designer.updateHoleProperty(${index}, 'y', this.value)">
                            </label>
                            <label>
                                ${t("diameter")} (mm):
                                <input type="number" value="${Math.round(hole.diameter)}"
                                    onchange="designer.updateHoleProperty(${index}, 'diameter', this.value)">
                            </label>
                            ${herraje_html}
                        </div>
                    </div>
                `;
        } else if (hole.shape === "avellanado") {
          return `
                    <div class="hole-item ${selectedClass}" data-hole-index="${index}">
                        <div class="hole-item-header">
                            <span class="hole-item-title">${t("avellanadoLabel")} ${index + 1}</span>
                            <button class="hole-item-delete" onclick="designer.deleteHole(${index})" title="Delete">×</button>
                        </div>
                        <div class="hole-item-props">
                            <label>
                                ${t("xPosition")} (mm):
                                <input type="number" value="${Math.round(hole.x)}"
                                    onchange="designer.updateHoleProperty(${index}, 'x', this.value)">
                            </label>
                            <label>
                                ${t("yPosition")} (mm):
                                <input type="number" value="${Math.round(hole.y)}"
                                    onchange="designer.updateHoleProperty(${index}, 'y', this.value)">
                            </label>
                            <label>
                                ${t("counterDiameter")} (mm):
                                <input type="number" value="${Math.round(hole.diameter)}"
                                    onchange="designer.updateHoleProperty(${index}, 'diameter', this.value)">
                            </label>
                            <label>
                                ${t("holeDiameter")} (mm):
                                <input type="number" value="${Math.round(hole.holeDiameter)}"
                                    onchange="designer.updateHoleProperty(${index}, 'holeDiameter', this.value)">
                            </label>
                            ${herraje_html}
                        </div>
                    </div>
                `;
        } else if (hole.shape === "rectangle") {
          const centerX = hole.x + hole.width / 2;
          const centerY = hole.y + hole.height / 2;
          return `
                    <div class="hole-item ${selectedClass}" data-hole-index="${index}">
                        <div class="hole-item-header">
                            <span class="hole-item-title">${t("rectangleHoleLabel")} ${index + 1}</span>
                            <button class="hole-item-delete" onclick="designer.deleteHole(${index})" title="Delete">×</button>
                        </div>
                        <div class="hole-item-props">
                            <label>
                                ${t("xPosition")} (mm):
                                <input type="number" value="${Math.round(centerX)}"
                                    onchange="designer.updateHoleProperty(${index}, 'centerX', this.value)">
                            </label>
                            <label>
                                ${t("yPosition")} (mm):
                                <input type="number" value="${Math.round(centerY)}"
                                    onchange="designer.updateHoleProperty(${index}, 'centerY', this.value)">
                            </label>
                            <label>
                                ${t("width")} (mm):
                                <input type="number" value="${Math.round(hole.width)}"
                                    onchange="designer.updateHoleProperty(${index}, 'width', this.value)">
                            </label>
                            <label>
                                ${t("height")} (mm):
                                <input type="number" value="${Math.round(hole.height)}"
                                    onchange="designer.updateHoleProperty(${index}, 'height', this.value)">
                            </label>
                            ${herraje_html}
                        </div>
                    </div>
                `;
        }
      })
      .join("");

    // Add click listeners to hole items for selection
    listContainer.querySelectorAll(".hole-item").forEach((item, index) => {
      item.addEventListener("click", (e) => {
        if (
          !e.target.classList.contains("hole-item-delete") &&
          e.target.tagName !== "INPUT" &&
          e.target.tagName !== "BUTTON" &&
          e.target.tagName !== "SELECT"
        ) {
          this.selectedHoleIndex = index;
          this.render();
          this.renderHolesList();
        }
      });
    });

    // Populate herraje dropdowns
    this.populateHerrajes();
  }

  /**
    * Validate hardware compatibility with hole size and insertion depth
    */
  async validateHardwareCompatibility(holeIndex, herrajeId) {
    try {
      const response = await fetch(`/api/herrajes/${herrajeId}`);
      if (!response.ok) return true; // Allow if can't fetch
      
      const data = await response.json();
      const herraje = data.herraje;
      if (!herraje) return true;
      
      const hole = this.holes[holeIndex];
      const holeDiameter = hole.diameter || hole.holeDiameter || 0;
      const herrajeHoleSize = herraje.hole_size;
      
      // Check hole size tolerance (allow ±1mm)
      const tolerance = 1;
      const isSizeCompatible = Math.abs(holeDiameter - herrajeHoleSize) <= tolerance;
      
      // Check insertion depth against glass thickness
      const glassThickness = this.glass.thickness;
      const insertionDepth = herraje.specs?.insertion_depth || 0;
      const isDepthCompatible = insertionDepth <= glassThickness;
      
      if (!isSizeCompatible) {
        const message = `Hardware requires ${herrajeHoleSize}mm hole, but this hole is ${holeDiameter}mm. Difference: ${Math.abs(holeDiameter - herrajeHoleSize).toFixed(1)}mm`;
        
        // Show warning modal
        this.showHardwareWarningModal(message, herraje, hole, holeIndex);
        return false;
      }
      
      if (!isDepthCompatible) {
        const message = `Hardware insertion depth (${insertionDepth}mm) exceeds glass thickness (${glassThickness}mm). Hardware will not fit properly.`;
        
        // Show warning modal
        this.showHardwareDepthWarningModal(message, herraje, hole, holeIndex);
        return false;
      }
      
      // Show hardware details
      this.showHardwareDetailsModal(herraje, hole);
      return true;
    } catch (error) {
      console.error("Error validating hardware:", error);
      return true; // Allow if error
    }
  }

  /**
   * Show warning when hardware and hole size don't match
   */
  showHardwareWarningModal(message, herraje, hole, holeIndex) {
    const modal = document.createElement('div');
    modal.className = 'hardware-warning-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 5000;
    `;
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 8px; padding: 2rem; max-width: 500px; box-shadow: 0 20px 25px rgba(0,0,0,0.15);">
        <h3 style="margin-top: 0; color: #dc2626;">Hardware Size Mismatch</h3>
        <p style="color: #4b5563; line-height: 1.6;">${message}</p>
        <div style="background: #fef3c7; border-left: 4px solid #eab308; padding: 1rem; border-radius: 4px; margin: 1rem 0; font-size: 0.875rem;">
          <strong>Note:</strong> You can still assign this hardware, but ensure the hole is drilled to the correct size during fabrication.
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button class="btn btn-outline" onclick="this.closest('.hardware-warning-modal').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="designer.assignHardwareForced(${holeIndex}, ${herraje.id}); this.closest('.hardware-warning-modal').remove();">Assign Anyway</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Show warning when hardware insertion depth exceeds glass thickness
   */
  showHardwareDepthWarningModal(message, herraje, hole, holeIndex) {
    const modal = document.createElement('div');
    modal.className = 'hardware-depth-warning-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 5000;
    `;
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 8px; padding: 2rem; max-width: 500px; box-shadow: 0 20px 25px rgba(0,0,0,0.15);">
        <h3 style="margin-top: 0; color: #dc2626;">Hardware Insertion Depth Warning</h3>
        <p style="color: #4b5563; line-height: 1.6;">${message}</p>
        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 1rem; border-radius: 4px; margin: 1rem 0; font-size: 0.875rem;">
          <strong>⚠️ Warning:</strong> This hardware will not fit properly in the glass at this thickness. Consider using thicker glass or a different hardware piece.
        </div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button class="btn btn-outline" onclick="this.closest('.hardware-depth-warning-modal').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="designer.assignHardwareForced(${holeIndex}, ${herraje.id}); this.closest('.hardware-depth-warning-modal').remove();">Assign Anyway</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Assign hardware even with size mismatch
   */
  assignHardwareForced(holeIndex, herrajeId) {
    if (holeIndex >= 0 && holeIndex < this.holes.length) {
      this.holes[holeIndex].herrajes_herraje_id = herrajeId;
      this.renderHolesList();
      this.render();
      
      // Show details modal after assignment
      this.fetchAndShowHardwareDetails(herrajeId, this.holes[holeIndex]);
    }
  }

  /**
   * Show hardware details modal
   */
  async showHardwareDetailsModal(herraje, hole) {
    const modal = document.createElement('div');
    modal.className = 'hardware-details-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 5000;
      overflow-y: auto;
    `;
    
    const t = window.i18n ? window.i18n.t : (key) => key;
    const specs = herraje.specs || {};
    
    const detailsHtml = `
      <div style="background: white; border-radius: 8px; padding: 2rem; max-width: 600px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); margin: 2rem 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
          <div>
            <h2 style="margin: 0; color: #1e293b;">${herraje.code}</h2>
            <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 1.05rem;">${herraje.name}</p>
          </div>
          <button onclick="this.closest('.hardware-details-modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8;">×</button>
        </div>
        
        ${herraje.picture_url ? `<img src="${herraje.picture_url}" alt="${herraje.name}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 4px; margin-bottom: 1.5rem;">` : ''}
        
        <div style="background: #f1f5f9; padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem;">
          <p style="margin: 0; color: #475569;">${herraje.description || t('loading')}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <div>
            <label style="display: block; font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">${t('holeSize')}</label>
            <p style="margin: 0; font-weight: 600; color: #1e293b;">${herraje.hole_size}mm</p>
          </div>
          <div>
            <label style="display: block; font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">${t('category')}</label>
            <p style="margin: 0; font-weight: 600; color: #1e293b; text-transform: capitalize;">${herraje.category || 'N/A'}</p>
          </div>
          <div>
            <label style="display: block; font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">${t('material')}</label>
            <p style="margin: 0; font-weight: 600; color: #1e293b;">${herraje.material}</p>
          </div>
          <div>
            <label style="display: block; font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">${t('finish')}</label>
            <p style="margin: 0; font-weight: 600; color: #1e293b;">${herraje.finish || 'N/A'}</p>
          </div>
          <div>
            <label style="display: block; font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">${t('maxLoad')}</label>
            <p style="margin: 0; font-weight: 600; color: #1e293b;">${herraje.max_load} ${t('maxLoadUnit')}</p>
          </div>
          <div>
            <label style="display: block; font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">${t('glassThicknessRange')}</label>
            <p style="margin: 0; font-weight: 600; color: #1e293b;">${herraje.min_thickness}-${herraje.max_thickness}mm</p>
          </div>
          <div>
            <label style="display: block; font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">${t('holePattern')}</label>
            <p style="margin: 0; font-weight: 600; color: #1e293b; text-transform: capitalize;">${herraje.hole_pattern || 'N/A'}</p>
          </div>
          <div>
            <label style="display: block; font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">${t('positions')}</label>
            <p style="margin: 0; font-weight: 600; color: #1e293b;">${herraje.positions || 1}</p>
          </div>
          ${herraje.specs && herraje.specs.insertion_depth ? `
          <div style="background: #dbeafe; border-left: 4px solid #0284c7; padding: 0.75rem; border-radius: 4px; grid-column: 1 / -1;">
           <label style="display: block; font-size: 0.875rem; color: #0369a1; margin-bottom: 0.25rem; font-weight: 600;">${t('insertionDepth')}</label>
           <p style="margin: 0; font-weight: 600; color: #0369a1;">${herraje.specs.insertion_depth}mm into glass</p>
           ${herraje.min_thickness && herraje.max_thickness ? `<p style="margin: 0.5rem 0 0; font-size: 0.8rem; color: #0369a1;">Glass range: ${herraje.min_thickness}-${herraje.max_thickness}mm</p>` : ''}
          </div>
          ` : ''}
        </div>

        ${herraje.countersink_size ? `
          <div style="background: #e0f2fe; padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem;">
            <p style="margin: 0.5rem 0 0; color: #0369a1;"><strong>${t('avellanado')}:</strong> ${herraje.countersink_size}mm (${herraje.countersink_type || 'standard'})</p>
          </div>
        ` : ''}
        
        ${specs.installation ? `
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem; font-weight: 600;">${t('installation')}</label>
            <p style="margin: 0; color: #475569; text-transform: capitalize;">${specs.installation}</p>
          </div>
        ` : ''}
        
        ${specs.safety_notes ? `
          <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem;">
            <p style="margin: 0.5rem 0 0; color: #991b1b;"><strong>${t('notasSeguridad')}:</strong> ${specs.safety_notes}</p>
          </div>
        ` : ''}
        
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          <button class="btn btn-outline" onclick="this.closest('.hardware-details-modal').remove()">${t('closeModal')}</button>
        </div>
      </div>
    `;
    
    modal.innerHTML = detailsHtml;
    document.body.appendChild(modal);
  }

  /**
   * Fetch and show hardware details by ID
   */
  async fetchAndShowHardwareDetails(herrajeId, hole) {
    try {
      const response = await fetch(`/api/herrajes/${herrajeId}`);
      if (!response.ok) throw new Error('Failed to load hardware');
      
      const data = await response.json();
      this.showHardwareDetailsModal(data.herraje, hole);
    } catch (error) {
      console.error("Error fetching hardware details:", error);
    }
  }

  /**
    * Load herrajes and populate dropdowns
    */
  async populateHerrajes() {
    try {
      const response = await fetch("/api/herrajes?limit=100");
      if (!response.ok) {
        console.warn("Failed to load herrajes:", response.statusText);
        return;
      }
      const data = await response.json();
      const herrajes = data.herrajes || [];
      
      // Debug logging
      console.log("populateHerrajes: Found", herrajes.length, "herrajes");

      // Update all herraje inputs (hidden fields)
      const inputs = document.querySelectorAll('input[id^="herraje-select-"]');
      console.log("populateHerrajes: Found", inputs.length, "input elements");
      
      inputs.forEach((input) => {
        const currentValue = input.value;
        const holeIndex = input.id.replace('herraje-select-', '');
        
        console.log(`populateHerrajes: Processing input #${holeIndex}`);
        
        const btn = document.getElementById(`herraje-btn-${holeIndex}`);
        const dropdown = document.getElementById(`herraje-dropdown-${holeIndex}`);
        
        if (!btn || !dropdown) return;
        
        // Build dropdown menu items
        const dropdownHTML = herrajes.map((herraje) => `
          <div class="herraje-menu-item" data-value="${herraje.id}" data-code="${herraje.code}" data-name="${herraje.name}" data-material="${herraje.material || ''}" data-picture="${herraje.picture_url || ''}" style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0; cursor: pointer; transition: background-color 0.2s; display: flex; gap: 0.5rem; align-items: center;">
            ${herraje.picture_url ? `<img src="${herraje.picture_url}" style="width: 40px; height: 40px; object-fit: contain; flex-shrink: 0;" alt="${herraje.name}">` : ''}
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 500; font-size: 0.875rem; color: #1f2937;">${herraje.code} - ${herraje.name}</div>
              ${herraje.material ? `<div style="font-size: 0.75rem; color: #6b7280;">${herraje.material}</div>` : ''}
            </div>
          </div>
        `).join('');
        
        dropdown.innerHTML = dropdownHTML;
        
        // Add event listeners to menu items
        dropdown.querySelectorAll('.herraje-menu-item').forEach((item) => {
          item.addEventListener('click', () => {
            const value = item.dataset.value;
            const code = item.dataset.code;
            const name = item.dataset.name;
            const material = item.dataset.material;
            
            // Update hidden input and button text
            input.value = value;
            const btnText = document.getElementById(`herraje-btn-text-${holeIndex}`);
            btnText.textContent = `${code} - ${name}${material ? ` (${material})` : ''}`;
            
            // Close dropdown
            dropdown.style.display = 'none';
            
            // Update property
            designer.updateHoleProperty(holeIndex, 'herrajes_herraje_id', value);
            
            // Update preview
            this.updateHerrrajePreview(holeIndex, value);
          });
          
          // Add hover effect
          item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#f0f9ff';
          });
          item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
          });
        });
        
        // Setup button click to toggle dropdown
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const isOpen = dropdown.style.display !== 'none';
          
          // Close all other dropdowns
          document.querySelectorAll('.herraje-dropdown-menu').forEach((d) => {
            d.style.display = 'none';
          });
          
          // Toggle this dropdown
          dropdown.style.display = isOpen ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
          }
        });

        // Restore selected value if it existed
        if (currentValue) {
          input.value = currentValue;
          const selectedHerraje = herrajes.find(h => h.id == currentValue);
          if (selectedHerraje) {
            const btnText = document.getElementById(`herraje-btn-text-${holeIndex}`);
            btnText.textContent = `${selectedHerraje.code} - ${selectedHerraje.name}${selectedHerraje.material ? ` (${selectedHerraje.material})` : ''}`;
            this.updateHerrrajePreview(holeIndex, currentValue);
          }
        }
      });
    } catch (error) {
      console.error("Error loading herrajes:", error);
    }
  }

  /**
   * Update herraje preview image
   */
  updateHerrrajePreview(holeIndex, herrajeId) {
    const imgElement = document.getElementById(`herraje-img-${holeIndex}`);
    const previewDiv = document.getElementById(`herraje-preview-${holeIndex}`);
    const selectElement = document.getElementById(`herraje-select-${holeIndex}`);

    if (!herrajeId || !selectElement) return;

    const selectedOption = selectElement.querySelector(`option[value="${herrajeId}"]`);
    if (selectedOption && selectedOption.dataset.picture) {
      const pictureUrl = selectedOption.dataset.picture;
      if (pictureUrl && imgElement && previewDiv) {
        imgElement.src = pictureUrl;
        imgElement.onerror = () => {
          previewDiv.style.display = 'none';
        };
        imgElement.onload = () => {
          previewDiv.style.display = 'block';
        };
      }
    } else if (previewDiv) {
      previewDiv.style.display = 'none';
    }
  }

  updateHoleProperty(index, property, value) {
    if (index < 0 || index >= this.holes.length) return;

    const hole = this.holes[index];
    const numValue = parseFloat(value);

    // Handle herraje (hardware) selection - applies to all hole types
    if (property === "herrajes_herraje_id") {
      const herrajeId = value ? parseInt(value) : null;
      
      if (herrajeId) {
        // Update preview immediately
        this.updateHerrrajePreview(index, herrajeId);
        
        // Validate hole size and depth compatibility
        this.validateHardwareCompatibility(index, herrajeId).then(isCompatible => {
          if (isCompatible) {
            hole.herrajes_herraje_id = herrajeId;
            this.renderHolesList();
          }
        });
      } else {
        hole.herrajes_herraje_id = null;
        this.updateHerrrajePreview(index, null);
        this.renderHolesList();
      }
      return;
    }

    if (hole.shape === "clip") {
      if (property === "x") hole.x = numValue;
      else if (property === "y") hole.y = numValue;
      else if (property === "width") hole.width = numValue;
      else if (property === "depth") hole.depth = numValue;
    } else if (hole.shape === "circle" || hole.shape === "taladro") {
      if (property === "x") hole.x = numValue;
      else if (property === "y") hole.y = numValue;
      else if (property === "diameter") hole.diameter = numValue;
    } else if (hole.shape === "avellanado") {
      if (property === "x") hole.x = numValue;
      else if (property === "y") hole.y = numValue;
      else if (property === "diameter") hole.diameter = numValue;
      else if (property === "holeDiameter") hole.holeDiameter = numValue;
    } else if (hole.shape === "rectangle") {
      if (property === "centerX") {
        hole.x = numValue - hole.width / 2;
      } else if (property === "centerY") {
        hole.y = numValue - hole.height / 2;
      } else if (property === "width") {
        const oldCenterX = hole.x + hole.width / 2;
        hole.width = numValue;
        hole.x = oldCenterX - hole.width / 2;
      } else if (property === "height") {
        const oldCenterY = hole.y + hole.height / 2;
        hole.height = numValue;
        hole.y = oldCenterY - hole.height / 2;
      }
    }

    this.render();
  }

  deleteHole(index) {
    if (index >= 0 && index < this.holes.length) {
      this.holes.splice(index, 1);
      if (this.selectedHoleIndex === index) {
        this.selectedHoleIndex = -1;
      } else if (this.selectedHoleIndex > index) {
        this.selectedHoleIndex--;
      }
      this.render();
      this.renderHolesList();
    }
  }

  updateSelectedHoleFromProperties() {
    if (this.selectedHoleIndex >= 0) {
      const hole = this.holes[this.selectedHoleIndex];

      if (hole.shape === "circle") {
        // For circles, x,y are center coordinates
        hole.x = parseFloat(document.getElementById("hole-x").value) || hole.x;
        hole.y = parseFloat(document.getElementById("hole-y").value) || hole.y;
        hole.diameter =
          parseFloat(document.getElementById("hole-diameter").value) ||
          hole.diameter;
      } else if (hole.shape === "rectangle") {
        // For rectangles, convert center coordinates to bottom-left
        const centerX =
          parseFloat(document.getElementById("hole-x").value) ||
          hole.x + hole.width / 2;
        const centerY =
          parseFloat(document.getElementById("hole-y").value) ||
          hole.y + hole.height / 2;
        const width =
          parseFloat(document.getElementById("hole-width").value) || hole.width;
        const height =
          parseFloat(document.getElementById("hole-height").value) ||
          hole.height;

        hole.x = centerX - width / 2;
        hole.y = centerY - height / 2;
        hole.width = width;
        hole.height = height;
      }

       this.render();
     } else if (this.isPainting && this.currentPaintArea) {
       // Update paint area dimensions while dragging
       const width = Math.abs(glassCoords.x - this.paintStartX);
       const height = Math.abs(glassCoords.y - this.paintStartY);

       this.currentPaintArea.x = Math.min(this.paintStartX, glassCoords.x);
       this.currentPaintArea.y = Math.min(this.paintStartY, glassCoords.y);
       this.currentPaintArea.width = width;
       this.currentPaintArea.height = height;

       this.render();
     }
   }

  /**
   * Show the shape picker modal.
   */
  showShapePickerModal() {
    // Remove existing modal if any
    const existing = document.querySelector(".shape-modal-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "shape-modal-overlay";
    overlay.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:5000;";

    const currentShape = this.glass.shape;
    let contentHtml = `
      <div class="shape-modal" style="background:white;border-radius:12px;padding:1.5rem;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 25px rgba(0,0,0,0.15);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h3 style="margin:0;color:#1e293b;">Choose Glass Shape</h3>
          <button class="shape-modal-close" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#94a3b8;">&times;</button>
        </div>
    `;

    SHAPE_CATEGORIES.forEach(cat => {
      const shapesInCat = Object.entries(GLASS_SHAPES).filter(([, def]) => def.category === cat.id);
      if (shapesInCat.length === 0) return;

      contentHtml += `
        <div style="margin-bottom:1rem;">
          <div style="font-size:0.8rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.5rem;">${cat.name}</div>
          <div class="shape-modal-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:0.5rem;">
      `;

      shapesInCat.forEach(([id, def]) => {
        const isActive = id === currentShape;
        const svg = generateShapeSVG(id);
        contentHtml += `
          <button class="shape-modal-item${isActive ? " active" : ""}" data-shape="${id}"
            style="display:flex;flex-direction:column;align-items:center;gap:0.25rem;padding:0.5rem;border:2px solid ${isActive ? "#2563eb" : "#e2e8f0"};border-radius:8px;background:${isActive ? "#eff6ff" : "white"};cursor:pointer;transition:all 0.2s;color:${isActive ? "#2563eb" : "#64748b"};">
            <span style="display:flex;align-items:center;justify-content:center;height:36px;">${svg}</span>
            <span style="font-size:0.7rem;text-align:center;line-height:1.2;">${def.name}</span>
          </button>
        `;
      });

      contentHtml += `</div></div>`;
    });

    contentHtml += `</div>`;
    overlay.innerHTML = contentHtml;
    document.body.appendChild(overlay);

    // Event listeners
    overlay.querySelector(".shape-modal-close").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    overlay.querySelectorAll(".shape-modal-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const shapeId = btn.getAttribute("data-shape");
        this.glass.shapeParams = {}; // Reset params for new shape
        this.glass.flipH = false;
        this.glass.flipV = false;
        this.updateGlassShape(shapeId);
        overlay.remove();
      });
    });
  }

  /**
   * Draw snap alignment guides on the canvas.
   */
  drawSnapGuides() {
    if (this.snapGuides.length === 0) return;
    const ctx = this.ctx;
    ctx.save();

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    this.snapGuides.forEach(guide => {
      if (guide.type === "vertical") {
        const cp = this.glassToCanvas(guide.pos, 0);
        const cp2 = this.glassToCanvas(guide.pos, this.glass.height);
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y);
        ctx.lineTo(cp2.x, cp2.y);
        ctx.stroke();
      } else if (guide.type === "horizontal") {
        const cp = this.glassToCanvas(0, guide.pos);
        const cp2 = this.glassToCanvas(this.glass.width, guide.pos);
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y);
        ctx.lineTo(cp2.x, cp2.y);
        ctx.stroke();
      }
    });

    ctx.setLineDash([]);
    ctx.restore();
  }

  /**
   * Build the renderer-agnostic scene from the current editable state.
   * Both the live canvas and the SVG print/export consume this same scene.
   */
  buildScene(themeOverride) {
    const ctx = this.ctx;
    const theme = themeOverride || window.DESIGNER_THEME.live;
    const measureText = (t, fontPx) => {
      ctx.font = "600 " + fontPx + "px " + theme.fontFamily;
      return ctx.measureText(t).width;
    };
    return window.DesignerScene.buildScene(
      {
        glass: this.glass,
        outlinePoints: this.getGlassPoints(),
        works: this.holes,
        paint: this.paintAreas,
        selectedIndex: this.selectedHoleIndex,
      },
      { scale: this.scale, measureText, theme, showDims: true },
    );
  }

  render() {
    // New pipeline: build a shared scene, then draw it with the canvas renderer.
    // The same scene drives the SVG print/export so screen == paper.
    if (
      window.DesignerScene &&
      window.renderSceneToCanvas &&
      window.DESIGNER_THEME
    ) {
      const theme = window.DESIGNER_THEME.live;
      this.scene = this.buildScene();
      // Auto-fit the full dimensioned drawing (part + dimension bands + dotted
      // leaders + labels) into the canvas so nothing goes offscreen, then
      // rebuild at the fitted scale so label/lane sizing stays correct.
      this.fitViewToScene();
      this.scene = this.buildScene();
      const view = {
        scale: this.scale,
        offsetX: this.offsetX,
        offsetY: this.offsetY,
        glassHeight: this.glass.height,
        canvasWidth: this.canvas.width,
        canvasHeight: this.canvas.height,
      };
      this.measurementHitAreas = window.renderSceneToCanvas(
        this.ctx,
        this.scene,
        view,
        theme,
      );

      // Interaction overlays (live-only) drawn on top of the scene.
      this.drawSnapGuides();
      if (this.isDrawingFreeform) this.drawFreeformOverlay();
      return;
    }

    // Fallback to the legacy renderer if modules failed to load.
    this.renderLegacy();
  }

  renderLegacy() {
    const ctx = this.ctx;
    this.measurementHitAreas = [];
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#f0f9ff");
    gradient.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
    this.drawGlass();
    this.drawHoles();
    this.drawSnapGuides();
    this.drawDimensions();
    this.drawSideLengths();
    if (this.isDrawingFreeform) {
      this.drawFreeformOverlay();
    }
  }

  renderForPrint(targetCanvas) {
    // Clear measurement labels for fresh collision detection
    this.measurementLabels = [];

    // Calculate required padding for dimension lines
    // Dimension lines extend 30 canvas pixels from holes plus text space
    const dimensionPadding = 80; // Extra padding for dimension lines and text

    // Store original values
    const originalOffsetX = this.offsetX;
    const originalOffsetY = this.offsetY;
    const originalCanvasWidth = this.canvas.width;
    const originalCanvasHeight = this.canvas.height;

    // Set canvas size with extra padding for dimension lines
    const printPadding = 100; // Increased padding for print
    targetCanvas.width = this.glass.width * this.scale + printPadding * 2;
    targetCanvas.height = this.glass.height * this.scale + printPadding * 2;

    // Temporarily adjust offsets for print rendering
    this.offsetX = printPadding;
    this.offsetY = printPadding;

    const ctx = targetCanvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    // Draw background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

    // Draw grid
    this.drawGridOnCanvas(ctx);

    // Draw glass piece
    this.drawGlassOnCanvas(ctx);

    // Draw holes without coordinate labels
    this.holes.forEach((hole) => {
      this.drawHoleOnCanvas(ctx, hole, false, false);
    });

    // Draw dimension lines for each hole
    this.holes.forEach((hole) => {
      this.drawDimensionLines(ctx, hole, true);
    });

    // Draw glass dimensions (pass target canvas height)
    this.drawDimensionsOnCanvas(ctx, targetCanvas.height, true);

    // Draw side lengths on print canvas for non-rectangular shapes
    if (this.glass.shape !== "rectangle" && this.glass.shape !== "circle") {
      this.drawSideLengthsOnCanvas(ctx);
    }

    // Restore original values
    this.offsetX = originalOffsetX;
    this.offsetY = originalOffsetY;
  }

  /**
   * Cast rays from a point in 4 directions and find the nearest glass edge intersection.
   * Returns {left, right, bottom, top} each with {distance, edgePos}.
   */
  findNearestGlassEdges(holeX, holeY) {
    const points = this.getGlassPoints();
    const n = points.length;

    // Start with bounding box as fallback
    let leftDist = holeX, leftPos = 0;
    let rightDist = this.glass.width - holeX, rightPos = this.glass.width;
    let bottomDist = holeY, bottomPos = 0;
    let topDist = this.glass.height - holeY, topPos = this.glass.height;

    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % n];

      // Horizontal ray intersections (left/right edges)
      if ((p1.y < holeY && p2.y >= holeY) || (p2.y < holeY && p1.y >= holeY)) {
        const t = (holeY - p1.y) / (p2.y - p1.y);
        const ix = p1.x + t * (p2.x - p1.x);
        if (ix <= holeX) {
          const d = holeX - ix;
          if (d < leftDist) { leftDist = d; leftPos = ix; }
        }
        if (ix >= holeX) {
          const d = ix - holeX;
          if (d < rightDist) { rightDist = d; rightPos = ix; }
        }
      }

      // Vertical ray intersections (bottom/top edges)
      if ((p1.x < holeX && p2.x >= holeX) || (p2.x < holeX && p1.x >= holeX)) {
        const t = (holeX - p1.x) / (p2.x - p1.x);
        const iy = p1.y + t * (p2.y - p1.y);
        if (iy <= holeY) {
          const d = holeY - iy;
          if (d < bottomDist) { bottomDist = d; bottomPos = iy; }
        }
        if (iy >= holeY) {
          const d = iy - holeY;
          if (d < topDist) { topDist = d; topPos = iy; }
        }
      }
    }

    return {
      left:   { distance: leftDist,   edgePos: leftPos },
      right:  { distance: rightDist,  edgePos: rightPos },
      bottom: { distance: bottomDist, edgePos: bottomPos },
      top:    { distance: topDist,    edgePos: topPos },
    };
  }

  drawDimensionLines(ctx, hole, forPrint = false) {
    // Get the hole center position
    let holeX = hole.x;
    let holeY = hole.y;

    if (hole.shape === "rectangle") {
      holeX = hole.x + hole.width / 2;
      holeY = hole.y + hole.height / 2;
    }

    // Find nearest actual glass edges by ray casting
    const edges = this.findNearestGlassEdges(holeX, holeY);

    // Pick nearest horizontal edge (left or right)
    const useLeft = edges.left.distance <= edges.right.distance;
    const xDistance = useLeft ? edges.left.distance : edges.right.distance;
    const xEdgePos = useLeft ? edges.left.edgePos : edges.right.edgePos;

    // Pick nearest vertical edge (bottom or top)
    const useBottom = edges.bottom.distance <= edges.top.distance;
    const yDistance = useBottom ? edges.bottom.distance : edges.top.distance;
    const yEdgePos = useBottom ? edges.bottom.edgePos : edges.top.edgePos;

    const holeCanvasPos = this.glassToCanvas(holeX, holeY);

    // --- Horizontal dimension line (X axis) ---
    const hEdgeCanvas = this.glassToCanvas(xEdgePos, holeY);
    // Draw the line above hole, offset varies per hole to reduce overlap
    const holeIdx = this.holes.indexOf(hole);
    const yOffsetBase = 25;
    const yOffsetStep = forPrint ? 20 : 18;
    const yOffset = yOffsetBase + (holeIdx % 3) * yOffsetStep;

    ctx.strokeStyle = "#64748b";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(hEdgeCanvas.x, holeCanvasPos.y - yOffset);
    ctx.lineTo(holeCanvasPos.x, holeCanvasPos.y - yOffset);
    ctx.stroke();

    // Ticks
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(hEdgeCanvas.x, holeCanvasPos.y - yOffset - 5);
    ctx.lineTo(hEdgeCanvas.x, holeCanvasPos.y - yOffset + 5);
    ctx.moveTo(holeCanvasPos.x, holeCanvasPos.y - yOffset - 5);
    ctx.lineTo(holeCanvasPos.x, holeCanvasPos.y - yOffset + 5);
    ctx.stroke();

    // Label
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px -apple-system, sans-serif";
    ctx.textAlign = "center";

    const hTextX = (hEdgeCanvas.x + holeCanvasPos.x) / 2;
    let hTextY = holeCanvasPos.y - yOffset - 10;

    const hLabelW = ctx.measureText(Math.round(xDistance) + "mm").width + 10;
    const labelH = 16;
    const hRect = {
      x: hTextX - hLabelW / 2, y: hTextY - labelH / 2,
      width: hLabelW, height: labelH,
    };

    // Collision avoidance
    let hStack = 0;
    for (const el of this.measurementLabels) {
      if (this.rectsOverlap(hRect, el)) hStack += labelH + 4;
    }
    hTextY -= hStack;

    this.measurementLabels.push({
      x: hTextX - hLabelW / 2, y: hTextY - labelH / 2,
      width: hLabelW, height: labelH,
    });

    // Draw background pill for readability
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(hTextX - hLabelW / 2, hTextY - labelH / 2, hLabelW, labelH, 3);
    } else {
      ctx.rect(hTextX - hLabelW / 2, hTextY - labelH / 2, hLabelW, labelH);
    }
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.fillText(Math.round(xDistance) + "mm", hTextX, hTextY + 1);

    // --- Vertical dimension line (Y axis) ---
    const vEdgeCanvas = this.glassToCanvas(holeX, yEdgePos);
    const xOffsetBase = 25;
    const xOffsetStep = forPrint ? 20 : 18;
    const xOffset = xOffsetBase + (holeIdx % 3) * xOffsetStep;

    ctx.strokeStyle = "#64748b";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(holeCanvasPos.x + xOffset, vEdgeCanvas.y);
    ctx.lineTo(holeCanvasPos.x + xOffset, holeCanvasPos.y);
    ctx.stroke();

    // Ticks
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(holeCanvasPos.x + xOffset - 5, vEdgeCanvas.y);
    ctx.lineTo(holeCanvasPos.x + xOffset + 5, vEdgeCanvas.y);
    ctx.moveTo(holeCanvasPos.x + xOffset - 5, holeCanvasPos.y);
    ctx.lineTo(holeCanvasPos.x + xOffset + 5, holeCanvasPos.y);
    ctx.stroke();

    // Label
    ctx.save();
    let vTextX = holeCanvasPos.x + xOffset + 15;
    let vTextY = (vEdgeCanvas.y + holeCanvasPos.y) / 2 + 4;

    const vLabelW = ctx.measureText(Math.round(yDistance) + "mm").width + 10;

    if (forPrint) {
      ctx.textAlign = "center";
      const vRect = {
        x: vTextX - vLabelW / 2, y: vTextY - labelH / 2,
        width: vLabelW, height: labelH,
      };

      let vStack = 0;
      for (const el of this.measurementLabels) {
        if (this.rectsOverlap(vRect, el)) vStack += vLabelW + 8;
      }
      vTextX += vStack;

      this.measurementLabels.push({
        x: vTextX - vLabelW / 2, y: vTextY - labelH / 2,
        width: vLabelW, height: labelH,
      });

      // Background pill
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(vTextX - vLabelW / 2, vTextY - labelH / 2, vLabelW, labelH, 3);
      } else {
        ctx.rect(vTextX - vLabelW / 2, vTextY - labelH / 2, vLabelW, labelH);
      }
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      ctx.fillText(Math.round(yDistance) + "mm", vTextX, vTextY + 1);
    } else {
      ctx.translate(
        holeCanvasPos.x + xOffset + 15,
        (vEdgeCanvas.y + holeCanvasPos.y) / 2,
      );
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText(Math.round(yDistance) + "mm", 0, 0);
    }
    ctx.restore();

    ctx.setLineDash([]);
  }

  // Helper function to check if two rectangles overlap
  rectsOverlap(rect1, rect2) {
    return !(rect1.x + rect1.width < rect2.x ||
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y ||
             rect2.y + rect2.height < rect1.y);
  }

  // Paint whole glass
  paintWholeGlass() {
    this.paintAreas = [{
      x: 0,
      y: 0,
      width: this.glass.width,
      height: this.glass.height,
      isWholeGlass: true
    }];
    this.updatePaintAreasList();
    this.render();
  }

  // Clear all paint
  clearPaint() {
    this.paintAreas = [];
    this.updatePaintAreasList();
    this.render();
  }

  // Update the paint areas list in the UI
  updatePaintAreasList() {
    const listElement = document.getElementById("paint-areas-list");
    if (!listElement) return;

    if (this.paintAreas.length === 0) {
      listElement.innerHTML = `
        <p style="color: #64748b; font-size: 0.875rem; font-style: italic;">
          No painted areas yet.
        </p>
      `;
      return;
    }

    let html = "";
    this.paintAreas.forEach((area, index) => {
      if (area.isWholeGlass) {
        html += `
          <div class="paint-area-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">
            <span>Whole Glass</span>
            <button class="btn btn-sm btn-outline" onclick="designer.removePaintArea(${index})">Remove</button>
          </div>
        `;
      } else {
        html += `
          <div class="paint-area-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">
            <span>Area ${index + 1}: ${Math.round(area.width)}×${Math.round(area.height)}mm</span>
            <button class="btn btn-sm btn-outline" onclick="designer.removePaintArea(${index})">Remove</button>
          </div>
        `;
      }
    });

    listElement.innerHTML = html;
  }

  // Remove a specific paint area
  removePaintArea(index) {
    if (index >= 0 && index < this.paintAreas.length) {
      this.paintAreas.splice(index, 1);
      this.updatePaintAreasList();
      this.render();
    }
  }

  // Update glass type
  updateGlassType(glassType) {
    this.glass.type = glassType;
    this.render();
  }

  // Update paint color
  updatePaintColor(color) {
    this.paintColor = color;
    this.render();
  }

  // Update CPB (Canto Pulido)
  updateCPB(cpb) {
    this.glass.cpb = cpb;
    this.render();
  }

  // Get translated glass type name
  getTranslatedGlassType(t) {
    const typeKey = `glassType${this.glass.type.charAt(0).toUpperCase() + this.glass.type.slice(1)}`;
    return t(typeKey) || this.glass.type;
  }

  // Populate glass type dropdown with translated options
  populateGlassTypeDropdown(t) {
    const select = document.getElementById("glass-type");
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    const glassTypes = [
      { value: "clear", key: "glassTypeClear" },
      { value: "mirror", key: "glassTypeMirror" },
      { value: "gray", key: "glassTypeGray" },
      { value: "tinted", key: "glassTypeTinted" },
      { value: "frosted", key: "glassTypeFrosted" }
    ];

    glassTypes.forEach(type => {
      const option = document.createElement("option");
      option.value = type.value;
      option.textContent = t(type.key);
      if (this.glass.type === type.value) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  // Populate paint color dropdown with translated options
  populatePaintColorDropdown(t) {
    const select = document.getElementById("paint-color");
    if (!select) return;

    // Clear existing options
    select.innerHTML = "";

    const paintColors = [
      { value: "#FFFFFF", key: "colorWhite" },
      { value: "#000000", key: "colorBlack" },
      { value: "#6B7280", key: "colorGray" },
      { value: "#F1F5F9", key: "colorFrosted" }
    ];

    paintColors.forEach(color => {
      const option = document.createElement("option");
      option.value = color.value;
      option.textContent = t(color.key);
      if (this.paintColor === color.value) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  // Utility function to convert hex color to rgba
  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Generate HTML for paint areas in print template
  /**
   * Generate HTML for glass dimensions in print template.
   * Shows side lengths for non-rectangular shapes instead of just width/height.
   */
  getPrintDimensionsHTML(t) {
    const shape = this.glass.shape;

    if (shape === "rectangle" || shape === "circle") {
      // Rectangle/circle: show width and height
      return `
        <div class="print-property">
            <span class="print-property-label">${t("width")}:</span>
            <span>${this.glass.width}mm</span>
        </div>
        <div class="print-property">
            <span class="print-property-label">${t("height")}:</span>
            <span>${this.glass.height}mm</span>
        </div>
      `;
    }

    // Non-rectangular shapes: show each side length
    const points = this.getGlassPoints();
    const n = points.length;

    if (n > 12) {
      // Arch or other complex curve — fall back to bounding box
      return `
        <div class="print-property">
            <span class="print-property-label">${t("width")}:</span>
            <span>${this.glass.width}mm</span>
        </div>
        <div class="print-property">
            <span class="print-property-label">${t("height")}:</span>
            <span>${this.glass.height}mm</span>
        </div>
      `;
    }

    const sides = this.calculateSideLengths();
    let html = "";
    sides.forEach((side, i) => {
      html += `
        <div class="print-property">
            <span class="print-property-label">${t("side") || "Side"} ${i + 1}:</span>
            <span>${Math.round(side.length)}mm</span>
        </div>
      `;
    });
    return html;
  }

  getPaintAreasHTML(t) {
    if (this.paintAreas.length === 0) {
      return `<p style="color: #64748b; font-style: italic;">${t("noPaintAreas")}</p>`;
    }

    let html = "";
    this.paintAreas.forEach((area, index) => {
      if (area.isWholeGlass) {
        html += `<div class="print-property">
            <span class="print-property-label">${t("paint")}:</span>
            <span>${t("paintWholeGlass")}</span>
        </div>`;
      } else {
        html += `<div class="print-property">
            <span class="print-property-label">${t("paintArea")} ${index + 1}:</span>
            <span>${Math.round(area.width)}×${Math.round(area.height)}mm at (${Math.round(area.x)}, ${Math.round(area.y)})</span>
        </div>`;
      }
    });

    return html;
  }

  drawGridOnCanvas(ctx) {
    const gridSize = 100; // 100mm grid

    // Clip grid to glass shape
    ctx.save();
    this.createGlassCanvasPath(ctx);
    ctx.clip();

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= this.glass.width; x += gridSize) {
      const canvasX = x * this.scale + this.offsetX;
      ctx.beginPath();
      ctx.moveTo(canvasX, this.offsetY);
      ctx.lineTo(canvasX, this.glass.height * this.scale + this.offsetY);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= this.glass.height; y += gridSize) {
      const canvasY = y * this.scale + this.offsetY;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, canvasY);
      ctx.lineTo(this.glass.width * this.scale + this.offsetX, canvasY);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawGlassOnCanvas(ctx) {
    // Draw glass with different appearances based on type (for print)
    let glassFillStyle;

    if (this.glass.type === "mirror") {
      // Mirror effect for print - darker silver
      glassFillStyle = "#cbd5e1";
    } else if (this.glass.type === "gray") {
      // Gray glass for print - dark gray
      glassFillStyle = "#4b5563";
    } else if (this.glass.type === "tinted") {
      // Tinted glass for print - light blue-gray
      glassFillStyle = "#bfdbfe";
    } else if (this.glass.type === "frosted") {
      // Frosted glass for print - light gray with texture
      glassFillStyle = "#f1f5f9";
    } else {
      // Clear glass (default) for print
      glassFillStyle = "#e0f2fe";
    }

    ctx.fillStyle = glassFillStyle;
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;

    this.createGlassCanvasPath(ctx);
    ctx.fill();

    this.createGlassCanvasPath(ctx);
    ctx.stroke();

     // Draw paint areas for print
     this.drawPaintAreasOnCanvas(ctx);
   }

   drawPaintAreasOnCanvas(ctx) {
     if (this.paintAreas.length === 0) return;

     ctx.save();

      // Clip to glass shape
      this.createGlassCanvasPath(ctx);
      ctx.clip();

      // Draw paint areas with darker color for print
      const printColor = this.hexToRgba(this.paintColor, 0.8);
      ctx.fillStyle = printColor;
      ctx.strokeStyle = this.hexToRgba(this.paintColor, 1.0);
     ctx.lineWidth = 1;

     this.paintAreas.forEach((area) => {
       const canvasPos = this.glassToCanvas(area.x, area.y);
       const canvasWidth = area.width * this.scale;
       const canvasHeight = area.height * this.scale;

       ctx.fillRect(canvasPos.x, canvasPos.y, canvasWidth, canvasHeight);
       ctx.strokeRect(canvasPos.x, canvasPos.y, canvasWidth, canvasHeight);
     });

     ctx.restore();
   }

  drawHoleOnCanvas(ctx, hole, isPreview, isSelected) {
    const canvasPos = this.glassToCanvas(hole.x, hole.y);

    ctx.fillStyle = isPreview ? "rgba(239, 68, 68, 0.3)" : "#ffffff";
    ctx.strokeStyle = isSelected
      ? "#f59e0b"
      : hole.shape === "clip"
        ? "#10b981"
        : "#ef4444";
    ctx.lineWidth = isSelected ? 3 : 2;

    if (hole.shape === "clip") {
      // Draw edge clip - triangular notch cut into the edge
      const width = hole.width * this.scale;
      const depth = hole.depth * this.scale;

      const distToLeft = hole.x;
      const distToRight = this.glass.width - hole.x;
      const distToBottom = hole.y;
      const distToTop = this.glass.height - hole.y;

      const minDist = Math.min(
        distToLeft,
        distToRight,
        distToBottom,
        distToTop,
      );

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#10b981";
      ctx.lineWidth = isSelected ? 3 : 2;

      ctx.beginPath();

      if (minDist === distToLeft) {
        const baseTop = this.glassToCanvas(0, hole.y + hole.width / 2);
        const baseBottom = this.glassToCanvas(0, hole.y - hole.width / 2);
        const point = this.glassToCanvas(hole.depth, hole.y);

        ctx.moveTo(baseTop.x, baseTop.y);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(baseBottom.x, baseBottom.y);
        ctx.closePath();
      } else if (minDist === distToRight) {
        const baseTop = this.glassToCanvas(
          this.glass.width,
          hole.y + hole.width / 2,
        );
        const baseBottom = this.glassToCanvas(
          this.glass.width,
          hole.y - hole.width / 2,
        );
        const point = this.glassToCanvas(this.glass.width - hole.depth, hole.y);

        ctx.moveTo(baseTop.x, baseTop.y);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(baseBottom.x, baseBottom.y);
        ctx.closePath();
      } else if (minDist === distToBottom) {
        const baseLeft = this.glassToCanvas(hole.x - hole.width / 2, 0);
        const baseRight = this.glassToCanvas(hole.x + hole.width / 2, 0);
        const point = this.glassToCanvas(hole.x, hole.depth);

        ctx.moveTo(baseLeft.x, baseLeft.y);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(baseRight.x, baseRight.y);
        ctx.closePath();
      } else {
        const baseLeft = this.glassToCanvas(
          hole.x - hole.width / 2,
          this.glass.height,
        );
        const baseRight = this.glassToCanvas(
          hole.x + hole.width / 2,
          this.glass.height,
        );
        const point = this.glassToCanvas(
          hole.x,
          this.glass.height - hole.depth,
        );

        ctx.moveTo(baseLeft.x, baseLeft.y);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(baseRight.x, baseRight.y);
        ctx.closePath();
      }

      ctx.fill();
      ctx.stroke();

      // Draw center marker
      ctx.fillStyle = isSelected ? "#f59e0b" : "#10b981";
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (hole.shape === "circle") {
      const radius = (hole.diameter / 2) * this.scale;

      // Draw hole with radial gradient for depth
      const holeGradient = ctx.createRadialGradient(
        canvasPos.x,
        canvasPos.y,
        0,
        canvasPos.x,
        canvasPos.y,
        radius,
      );
      holeGradient.addColorStop(0, "#ffffff");
      holeGradient.addColorStop(0.7, "#f1f5f9");
      holeGradient.addColorStop(1, "#e2e8f0");

      ctx.fillStyle = isPreview ? "rgba(239, 68, 68, 0.3)" : holeGradient;
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow before stroke
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Draw border
      const borderGradient = ctx.createRadialGradient(
        canvasPos.x,
        canvasPos.y,
        radius * 0.8,
        canvasPos.x,
        canvasPos.y,
        radius,
      );
      borderGradient.addColorStop(0, isSelected ? "#f59e0b" : "#ef4444");
      borderGradient.addColorStop(1, isSelected ? "#dc2626" : "#dc2626");

      ctx.strokeStyle = borderGradient;
      ctx.stroke();

      // Draw center point with glow
      ctx.shadowColor = isSelected
        ? "rgba(245, 158, 11, 0.6)"
        : "rgba(239, 68, 68, 0.6)";
      ctx.shadowBlur = 6;
      ctx.fillStyle = isSelected ? "#f59e0b" : "#ef4444";
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    } else if (hole.shape === "taladro") {
      const radius = (hole.diameter / 2) * this.scale;

      // Taladro has distinct styling with blue tones
      const taladroGradient = ctx.createRadialGradient(
        canvasPos.x,
        canvasPos.y,
        0,
        canvasPos.x,
        canvasPos.y,
        radius,
      );
      taladroGradient.addColorStop(0, "#3b82f6");
      taladroGradient.addColorStop(0.5, "#2563eb");
      taladroGradient.addColorStop(1, "#1e40af");

      ctx.fillStyle = isPreview ? "rgba(59, 130, 246, 0.3)" : taladroGradient;
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow before stroke
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Draw border
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#1e3a8a";
      ctx.lineWidth = isSelected ? 4 : 2.5;
      ctx.stroke();

      // Draw center crosshair for drill holes with glow
      ctx.shadowColor = isSelected
        ? "rgba(245, 158, 11, 0.6)"
        : "rgba(96, 165, 250, 0.8)";
      ctx.shadowBlur = 4;
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#bfdbfe";
      ctx.lineWidth = 2;
      const crosshairSize = Math.max(6, radius * 0.6);
      ctx.beginPath();
      ctx.moveTo(canvasPos.x - crosshairSize, canvasPos.y);
      ctx.lineTo(canvasPos.x + crosshairSize, canvasPos.y);
      ctx.moveTo(canvasPos.x, canvasPos.y - crosshairSize);
      ctx.lineTo(canvasPos.x, canvasPos.y + crosshairSize);
      ctx.stroke();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    } else if (hole.shape === "avellanado") {
      const outerRadius = (hole.diameter / 2) * this.scale;
      const innerRadius = (hole.holeDiameter / 2) * this.scale;

      // Draw outer countersink with gradient (conical depression)
      const counterGradient = ctx.createRadialGradient(
        canvasPos.x,
        canvasPos.y,
        innerRadius,
        canvasPos.x,
        canvasPos.y,
        outerRadius,
      );
      counterGradient.addColorStop(0, "#cbd5e1");
      counterGradient.addColorStop(0.5, "#e2e8f0");
      counterGradient.addColorStop(1, "#f1f5f9");

      ctx.fillStyle = isPreview ? "rgba(168, 85, 247, 0.3)" : counterGradient;
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#8b5cf6";
      ctx.lineWidth = isSelected ? 3 : 2;

      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, outerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw inner hole
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#7c3aed";
      ctx.lineWidth = isSelected ? 2 : 1.5;

      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, innerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw center point with glow
      ctx.shadowColor = isSelected
        ? "rgba(245, 158, 11, 0.6)"
        : "rgba(139, 92, 246, 0.6)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = isSelected ? "#f59e0b" : "#8b5cf6";
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    } else if (hole.shape === "rectangle") {
      const width = hole.width * this.scale;
      const height = hole.height * this.scale;

      // Draw rectangle with gradient
      const rectGradient = ctx.createLinearGradient(
        canvasPos.x,
        canvasPos.y - height,
        canvasPos.x + width,
        canvasPos.y,
      );
      rectGradient.addColorStop(0, "#ffffff");
      rectGradient.addColorStop(0.5, "#f1f5f9");
      rectGradient.addColorStop(1, "#e2e8f0");

      ctx.fillStyle = isPreview ? "rgba(239, 68, 68, 0.3)" : rectGradient;
      ctx.fillRect(canvasPos.x, canvasPos.y - height, width, height);

      // Reset shadow before stroke
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Draw border
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#ef4444";
      ctx.lineWidth = isSelected ? 4 : 2.5;
      ctx.strokeRect(canvasPos.x, canvasPos.y - height, width, height);

      // Draw center point with glow
      const centerX = hole.x + hole.width / 2;
      const centerY = hole.y + hole.height / 2;
      const centerCanvasPos = this.glassToCanvas(centerX, centerY);

      ctx.shadowColor = isSelected
        ? "rgba(245, 158, 11, 0.6)"
        : "rgba(239, 68, 68, 0.6)";
      ctx.shadowBlur = 6;
      ctx.fillStyle = isSelected ? "#f59e0b" : "#ef4444";
      ctx.beginPath();
      ctx.arc(centerCanvasPos.x, centerCanvasPos.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }
  }

  drawDimensionsOnCanvas(ctx, canvasHeight, forPrint = false) {
    // Use provided canvas height or fallback to this.canvas.height
    const targetHeight = canvasHeight || this.canvas.height;

    const hasSideLabels =
      this.glass.shape !== "rectangle" &&
      this.glass.shape !== "circle" &&
      this.getGlassPoints().length <= 12;

    ctx.fillStyle = "#64748b";
    ctx.font = "12px -apple-system, sans-serif";
    ctx.textAlign = "center";

    // Width and height labels — skip when side lengths are shown
    if (!hasSideLabels) {
      // Width dimension (bottom of canvas)
      const widthText = this.glass.width + "mm";
      const glassBottomY = this.offsetY + this.glass.height * this.scale;
      ctx.fillText(
        widthText,
        this.offsetX + (this.glass.width * this.scale) / 2,
        glassBottomY + 30,
      );

      // Height dimension (left side)
      ctx.save();
      if (forPrint) {
        ctx.textAlign = "center";
        ctx.fillText(
          this.glass.height + "mm",
          this.offsetX - 30,
          this.offsetY + (this.glass.height * this.scale) / 2 + 4,
        );
      } else {
        ctx.translate(
          this.offsetX - 30,
          this.offsetY + (this.glass.height * this.scale) / 2,
        );
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(this.glass.height + "mm", 0, 0);
      }
      ctx.restore();
    }

    // Thickness (top)
    ctx.fillText(
      "Espesor: " + this.glass.thickness + "mm",
      this.offsetX + (this.glass.width * this.scale) / 2,
      this.offsetY - 20,
    );

    // CPB indicator for print
    if (this.glass.cpb) {
      ctx.fillText(
        "CPB",
        this.offsetX + (this.glass.width * this.scale) - 30,
        this.offsetY - 20,
      );
    }
  }

  drawGrid() {
    const ctx = this.ctx;
    const gridSize = 100; // 100mm grid
    const minorGridSize = 10; // 10mm minor grid

    // Clip grid to glass shape
    ctx.save();
    this.createGlassCanvasPath(ctx);
    ctx.clip();

    // Draw minor grid (lighter)
    ctx.strokeStyle = "rgba(226, 232, 240, 0.3)";
    ctx.lineWidth = 0.5;

    // Minor vertical lines
    for (let x = 0; x <= this.glass.width; x += minorGridSize) {
      if (x % gridSize === 0) continue; // Skip major grid lines
      const canvasX = x * this.scale + this.offsetX;
      ctx.beginPath();
      ctx.moveTo(canvasX, this.offsetY);
      ctx.lineTo(canvasX, this.glass.height * this.scale + this.offsetY);
      ctx.stroke();
    }

    // Minor horizontal lines
    for (let y = 0; y <= this.glass.height; y += minorGridSize) {
      if (y % gridSize === 0) continue; // Skip major grid lines
      const canvasY = y * this.scale + this.offsetY;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, canvasY);
      ctx.lineTo(this.glass.width * this.scale + this.offsetX, canvasY);
      ctx.stroke();
    }

    // Draw major grid (darker)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1;

    // Major vertical lines
    for (let x = 0; x <= this.glass.width; x += gridSize) {
      const canvasX = x * this.scale + this.offsetX;
      ctx.beginPath();
      ctx.moveTo(canvasX, this.offsetY);
      ctx.lineTo(canvasX, this.glass.height * this.scale + this.offsetY);
      ctx.stroke();
    }

    // Major horizontal lines
    for (let y = 0; y <= this.glass.height; y += gridSize) {
      const canvasY = y * this.scale + this.offsetY;
      ctx.beginPath();
      ctx.moveTo(this.offsetX, canvasY);
      ctx.lineTo(this.glass.width * this.scale + this.offsetX, canvasY);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawGlass() {
    const ctx = this.ctx;

    const glassWidth = this.glass.width * this.scale;
    const glassHeight = this.glass.height * this.scale;

    // Draw shadow for depth
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Draw glass with different appearances based on type
    let glassFillStyle;

    if (this.glass.type === "mirror") {
      // Mirror effect - silver/reflective
      const mirrorGradient = ctx.createLinearGradient(
        this.offsetX,
        this.offsetY,
        this.offsetX + glassWidth,
        this.offsetY + glassHeight,
      );
      mirrorGradient.addColorStop(0, "#f8fafc");
      mirrorGradient.addColorStop(0.3, "#e2e8f0");
      mirrorGradient.addColorStop(0.7, "#cbd5e1");
      mirrorGradient.addColorStop(1, "#94a3b8");
      glassFillStyle = mirrorGradient;
    } else if (this.glass.type === "gray") {
      // Gray glass - dark gray
      const grayGradient = ctx.createLinearGradient(
        this.offsetX,
        this.offsetY,
        this.offsetX + glassWidth,
        this.offsetY + glassHeight,
      );
      grayGradient.addColorStop(0, "#6b7280");
      grayGradient.addColorStop(0.5, "#4b5563");
      grayGradient.addColorStop(1, "#374151");
      glassFillStyle = grayGradient;
    } else if (this.glass.type === "tinted") {
      // Tinted glass - light blue-gray
      const tintedGradient = ctx.createLinearGradient(
        this.offsetX,
        this.offsetY,
        this.offsetX + glassWidth,
        this.offsetY + glassHeight,
      );
      tintedGradient.addColorStop(0, "#dbeafe");
      tintedGradient.addColorStop(0.5, "#bfdbfe");
      tintedGradient.addColorStop(1, "#93c5fd");
      glassFillStyle = tintedGradient;
    } else if (this.glass.type === "frosted") {
      // Frosted glass - light gray with subtle texture
      const frostedGradient = ctx.createLinearGradient(
        this.offsetX,
        this.offsetY,
        this.offsetX + glassWidth,
        this.offsetY + glassHeight,
      );
      frostedGradient.addColorStop(0, "#f8fafc");
      frostedGradient.addColorStop(0.5, "#f1f5f9");
      frostedGradient.addColorStop(1, "#e2e8f0");
      glassFillStyle = frostedGradient;
    } else {
      // Clear glass (default)
      const glassGradient = ctx.createLinearGradient(
        this.offsetX,
        this.offsetY,
        this.offsetX + glassWidth,
        this.offsetY + glassHeight,
      );
      glassGradient.addColorStop(0, "#dbeafe");
      glassGradient.addColorStop(0.5, "#bfdbfe");
      glassGradient.addColorStop(1, "#93c5fd");
      glassFillStyle = glassGradient;
    }

    ctx.fillStyle = glassFillStyle;
    this.createGlassCanvasPath(ctx);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw border with gradient
    const borderGradient = ctx.createLinearGradient(
      this.offsetX,
      this.offsetY,
      this.offsetX + glassWidth,
      this.offsetY + glassHeight,
    );
    borderGradient.addColorStop(0, "#2563eb");
    borderGradient.addColorStop(1, "#1e40af");

    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 3;
    this.createGlassCanvasPath(ctx);
    ctx.stroke();

    // Add inner highlight for glass effect (only for rectangle)
    if (this.glass.shape === "rectangle") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.offsetX + 2,
        this.offsetY + 2,
        glassWidth - 4,
        glassHeight - 4,
      );
    }

    // Draw paint areas
    this.drawPaintAreas(ctx);
  }

  drawPaintAreas(ctx) {
    if (this.paintAreas.length === 0 && !this.currentPaintArea) return;

    ctx.save();

    // Clip paint areas to glass shape
    this.createGlassCanvasPath(ctx);
    ctx.clip();

    // Draw existing paint areas
    this.paintAreas.forEach((area) => {
      const canvasPos = this.glassToCanvas(area.x, area.y);
      const canvasWidth = area.width * this.scale;
      const canvasHeight = area.height * this.scale;

      // Use completely opaque paint for whole glass, semi-transparent for areas
      if (area.isWholeGlass) {
        ctx.fillStyle = this.hexToRgba(this.paintColor, 1.0); // Completely opaque for whole glass
        ctx.strokeStyle = this.hexToRgba(this.paintColor, 1.0);
      } else {
        ctx.fillStyle = this.hexToRgba(this.paintColor, 0.7); // Semi-transparent for areas
        ctx.strokeStyle = this.hexToRgba(this.paintColor, 0.8);
      }
      ctx.lineWidth = 2;

      ctx.fillRect(canvasPos.x, canvasPos.y, canvasWidth, canvasHeight);

      // Only draw stroke for non-whole-glass areas
      if (!area.isWholeGlass) {
        ctx.strokeRect(canvasPos.x, canvasPos.y, canvasWidth, canvasHeight);
      }

      // Add paint texture pattern (darker version of selected color)
      const textureColor = this.hexToRgba(this.paintColor, 0.3);
      ctx.fillStyle = textureColor;
      for (let x = 0; x < canvasWidth; x += 8) {
        for (let y = 0; y < canvasHeight; y += 8) {
          if ((x + y) % 16 === 0) {
            ctx.fillRect(canvasPos.x + x, canvasPos.y + y, 4, 4);
          }
        }
      }
    });

    // Draw current paint area being created (more transparent)
    if (this.currentPaintArea && this.currentPaintArea.width > 0 && this.currentPaintArea.height > 0) {
      ctx.fillStyle = this.hexToRgba(this.paintColor, 0.4); // More transparent for current area
      ctx.strokeStyle = "rgba(101, 67, 33, 0.6)";
      ctx.setLineDash([5, 5]); // Dashed line for current area

      const canvasPos = this.glassToCanvas(this.currentPaintArea.x, this.currentPaintArea.y);
      const canvasWidth = this.currentPaintArea.width * this.scale;
      const canvasHeight = this.currentPaintArea.height * this.scale;

      ctx.fillRect(canvasPos.x, canvasPos.y, canvasWidth, canvasHeight);
      ctx.strokeRect(canvasPos.x, canvasPos.y, canvasWidth, canvasHeight);

      ctx.setLineDash([]); // Reset line dash
    }

    ctx.restore();
  }

  drawHoles() {
    this.holes.forEach((hole, index) => {
      const isSelected = index === this.selectedHoleIndex;
      this.drawHole(hole, false, isSelected);
    });
  }

  drawHole(hole, isPreview, isSelected) {
    const ctx = this.ctx;
    const canvasPos = this.glassToCanvas(hole.x, hole.y);

    // Add shadow for depth (except for previews)
    if (!isPreview) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    ctx.fillStyle = isPreview ? "rgba(239, 68, 68, 0.3)" : "#ffffff";
    ctx.strokeStyle = isSelected ? "#f59e0b" : "#ef4444";
    ctx.lineWidth = isSelected ? 4 : 2.5;

    if (hole.shape === "clip") {
      // Draw edge clip - triangular notch cut into the edge
      const width = hole.width * this.scale;
      const depth = hole.depth * this.scale;

      // Calculate distances to each edge
      const distToLeft = hole.x;
      const distToRight = this.glass.width - hole.x;
      const distToBottom = hole.y;
      const distToTop = this.glass.height - hole.y;

      // Find nearest edge
      const minDist = Math.min(
        distToLeft,
        distToRight,
        distToBottom,
        distToTop,
      );

      // Draw triangular notch from the nearest edge
      ctx.fillStyle = "#ffffff"; // White cutout
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#10b981"; // Green or selected
      ctx.lineWidth = isSelected ? 3 : 2;

      ctx.beginPath();

      if (minDist === distToLeft) {
        // Left edge - triangle base on left edge, point extends right
        const baseTop = this.glassToCanvas(0, hole.y + hole.width / 2);
        const baseBottom = this.glassToCanvas(0, hole.y - hole.width / 2);
        const point = this.glassToCanvas(hole.depth, hole.y);

        ctx.moveTo(baseTop.x, baseTop.y);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(baseBottom.x, baseBottom.y);
        ctx.closePath();
      } else if (minDist === distToRight) {
        // Right edge - triangle base on right edge, point extends left
        const baseTop = this.glassToCanvas(
          this.glass.width,
          hole.y + hole.width / 2,
        );
        const baseBottom = this.glassToCanvas(
          this.glass.width,
          hole.y - hole.width / 2,
        );
        const point = this.glassToCanvas(this.glass.width - hole.depth, hole.y);

        ctx.moveTo(baseTop.x, baseTop.y);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(baseBottom.x, baseBottom.y);
        ctx.closePath();
      } else if (minDist === distToBottom) {
        // Bottom edge - triangle base on bottom edge, point extends up
        const baseLeft = this.glassToCanvas(hole.x - hole.width / 2, 0);
        const baseRight = this.glassToCanvas(hole.x + hole.width / 2, 0);
        const point = this.glassToCanvas(hole.x, hole.depth);

        ctx.moveTo(baseLeft.x, baseLeft.y);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(baseRight.x, baseRight.y);
        ctx.closePath();
      } else {
        // Top edge - triangle base on top edge, point extends down
        const baseLeft = this.glassToCanvas(
          hole.x - hole.width / 2,
          this.glass.height,
        );
        const baseRight = this.glassToCanvas(
          hole.x + hole.width / 2,
          this.glass.height,
        );
        const point = this.glassToCanvas(
          hole.x,
          this.glass.height - hole.depth,
        );

        ctx.moveTo(baseLeft.x, baseLeft.y);
        ctx.lineTo(point.x, point.y);
        ctx.lineTo(baseRight.x, baseRight.y);
        ctx.closePath();
      }

      ctx.fill();
      ctx.stroke();

      // Draw center marker
      ctx.fillStyle = isSelected ? "#f59e0b" : "#10b981";
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw coordinate label
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        "(" + Math.round(hole.x) + ", " + Math.round(hole.y) + ")",
        canvasPos.x + 8,
        canvasPos.y - 5,
      );
    } else if (hole.shape === "circle") {
      const radius = (hole.diameter / 2) * this.scale;

      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw center point
      ctx.fillStyle = isSelected ? "#f59e0b" : "#ef4444";
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw coordinate label
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        "(" + Math.round(hole.x) + ", " + Math.round(hole.y) + ")",
        canvasPos.x + radius + 5,
        canvasPos.y - 5,
      );
    } else if (hole.shape === "taladro") {
      const radius = (hole.diameter / 2) * this.scale;

      // Taladro has distinct styling
      ctx.fillStyle = isPreview ? "rgba(59, 130, 246, 0.3)" : "#1e40af";
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#3b82f6";

      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw center crosshair
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#60a5fa";
      ctx.lineWidth = 1;
      const crosshairSize = 5;
      ctx.beginPath();
      ctx.moveTo(canvasPos.x - crosshairSize, canvasPos.y);
      ctx.lineTo(canvasPos.x + crosshairSize, canvasPos.y);
      ctx.moveTo(canvasPos.x, canvasPos.y - crosshairSize);
      ctx.lineTo(canvasPos.x, canvasPos.y + crosshairSize);
      ctx.stroke();

      // Draw coordinate label
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        "(" + Math.round(hole.x) + ", " + Math.round(hole.y) + ")",
        canvasPos.x + radius + 5,
        canvasPos.y - 5,
      );
    } else if (hole.shape === "avellanado") {
      const outerRadius = (hole.diameter / 2) * this.scale;
      const innerRadius = (hole.holeDiameter / 2) * this.scale;

      // Draw outer countersink with gradient (conical depression)
      const counterGradient = ctx.createRadialGradient(
        canvasPos.x,
        canvasPos.y,
        innerRadius,
        canvasPos.x,
        canvasPos.y,
        outerRadius,
      );
      counterGradient.addColorStop(0, "#cbd5e1");
      counterGradient.addColorStop(0.5, "#e2e8f0");
      counterGradient.addColorStop(1, "#f1f5f9");

      ctx.fillStyle = isPreview ? "rgba(168, 85, 247, 0.3)" : counterGradient;
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#8b5cf6";
      ctx.lineWidth = isSelected ? 3 : 2;

      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, outerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw inner hole
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#7c3aed";
      ctx.lineWidth = isSelected ? 2 : 1.5;

      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, innerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw center point
      ctx.fillStyle = isSelected ? "#f59e0b" : "#8b5cf6";
      ctx.beginPath();
      ctx.arc(canvasPos.x, canvasPos.y, 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw coordinate label
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        "(" + Math.round(hole.x) + ", " + Math.round(hole.y) + ")",
        canvasPos.x + outerRadius + 5,
        canvasPos.y - 5,
      );
    } else if (hole.shape === "rectangle") {
      const width = hole.width * this.scale;
      const height = hole.height * this.scale;

      ctx.fillRect(canvasPos.x, canvasPos.y - height, width, height);
      ctx.strokeRect(canvasPos.x, canvasPos.y - height, width, height);

      // Draw center point
      const centerX = hole.x + hole.width / 2;
      const centerY = hole.y + hole.height / 2;
      const centerCanvasPos = this.glassToCanvas(centerX, centerY);

      ctx.fillStyle = isSelected ? "#f59e0b" : "#ef4444";
      ctx.beginPath();
      ctx.arc(centerCanvasPos.x, centerCanvasPos.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw coordinate label showing center position
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 11px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        "(" + Math.round(centerX) + ", " + Math.round(centerY) + ")",
        canvasPos.x + width + 5,
        centerCanvasPos.y,
      );
    }

    // Draw herraje indicator badge if hardware is assigned
    if (hole.herrajes_herraje_id) {
      const badgeX = canvasPos.x + 8;
      const badgeY = canvasPos.y - 12;
      const badgeRadius = 6;

      // Draw badge background
      ctx.fillStyle = "#10b981"; // Green badge
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw badge border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw checkmark icon
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(badgeX - 2, badgeY + 1);
      ctx.lineTo(badgeX, badgeY + 3);
      ctx.lineTo(badgeX + 2.5, badgeY - 1);
      ctx.stroke();
    }
  }

  drawDimensions() {
    const ctx = this.ctx;

    const hasSideLabels =
      this.glass.shape !== "rectangle" &&
      this.glass.shape !== "circle" &&
      this.getGlassPoints().length <= 12;

    // Modern dimension text styling
    ctx.fillStyle = "#1e293b";
    ctx.font =
      'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = "center";

    // Add subtle shadow to text
    ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Width and height labels — skip when side lengths are shown
    if (!hasSideLabels) {
      // Width dimension
      const widthText = this.glass.width + "mm";
      const widthLabelX = this.offsetX + (this.glass.width * this.scale) / 2;
      const widthLabelY = this.canvas.height - 10;
      ctx.fillText(widthText, widthLabelX, widthLabelY);

      const widthTextW = ctx.measureText(widthText).width;
      this.measurementHitAreas.push({
        x: widthLabelX,
        y: widthLabelY,
        w: widthTextW + 12,
        h: 22,
        type: "width",
        value: this.glass.width,
      });

      // Height dimension
      const heightLabelX = 10;
      const heightLabelY =
        this.offsetY + (this.glass.height * this.scale) / 2;
      ctx.save();
      ctx.translate(heightLabelX, heightLabelY);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(this.glass.height + "mm", 0, 0);
      ctx.restore();

      const heightTextW = ctx.measureText(this.glass.height + "mm").width;
      this.measurementHitAreas.push({
        x: heightLabelX,
        y: heightLabelY,
        w: 22,
        h: heightTextW + 12,
        type: "height",
        value: this.glass.height,
      });
    }

    // Thickness
    const thicknessLabelX =
      this.offsetX + (this.glass.width * this.scale) / 2;
    const thicknessLabelY = 20;
    ctx.fillText(
      "Espesor: " + this.glass.thickness + "mm",
      thicknessLabelX,
      thicknessLabelY,
    );

    const thicknessTextW = ctx.measureText(
      "Espesor: " + this.glass.thickness + "mm",
    ).width;
    this.measurementHitAreas.push({
      x: thicknessLabelX,
      y: thicknessLabelY,
      w: thicknessTextW + 12,
      h: 22,
      type: "thickness",
      value: this.glass.thickness,
    });

    // CPB indicator
    if (this.glass.cpb) {
      ctx.fillText(
        "CPB",
        this.offsetX + (this.glass.width * this.scale) - 30,
        20,
      );
    }

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  getDesignData() {
    return {
      glass: {
        ...this.glass,
        shapeParams: { ...this.glass.shapeParams },
        freeformPoints: this.glass.freeformPoints.map((p) => ({ ...p })),
      },
      holes: this.holes.map((hole) => ({ ...hole })),
    };
  }

  /**
   * Generate Bill of Materials from current design
   */
  async generateBillOfMaterials() {
    const bom = {
      glass: this.generateGlassBOM(),
      hardware: await this.generateHardwareBOM(),
      holes: this.generateHolesBOM(),
      summary: {},
    };

    // Calculate totals
    bom.summary = {
      totalHoles: this.holes.length,
      totalHardwareItems: bom.hardware.length,
      totalArea: (this.glass.width * this.glass.height / 1000000).toFixed(2),
    };

    return bom;
  }

  /**
   * Generate glass specifications for BOM
   */
  generateGlassBOM() {
    const paintedAreas = this.paintAreas.length;
    const glassData = {
      quantity: 1,
      width: this.glass.width,
      height: this.glass.height,
      thickness: this.glass.thickness,
      area: (this.glass.width * this.glass.height / 1000000).toFixed(2),
      unit: 'm²',
      type: this.glass.type,
      shape: this.glass.shape,
      cpb: this.glass.cpb,
      painted: paintedAreas > 0,
      paintedAreas: paintedAreas,
    };

    if (paintedAreas > 0) {
      let totalPaintArea = 0;
      this.paintAreas.forEach(area => {
        if (area.isWholeGlass) {
          totalPaintArea = this.glass.width * this.glass.height;
        } else {
          totalPaintArea += area.width * area.height;
        }
      });
      glassData.paintedArea = (totalPaintArea / 1000000).toFixed(2);
      glassData.paintedUnit = 'm²';
    }

    return glassData;
  }

  /**
   * Generate hardware list for BOM
   */
  async generateHardwareBOM() {
    const hardwareList = [];
    const herrajeIds = new Set();

    // Collect unique hardware IDs
    this.holes.forEach(hole => {
      if (hole.herrajes_herraje_id) {
        herrajeIds.add(hole.herrajes_herraje_id);
      }
    });

    // Fetch hardware details for each
    for (const herrajeId of herrajeIds) {
      try {
        const response = await fetch(`/api/herrajes/${herrajeId}`);
        if (response.ok) {
          const data = await response.json();
          const herraje = data.herraje;

          // Count how many holes use this hardware
          const quantity = this.holes.filter(h => h.herrajes_herraje_id === herrajeId).length;

          hardwareList.push({
            id: herraje.id,
            code: herraje.code,
            name: herraje.name,
            category: herraje.category,
            material: herraje.material,
            finish: herraje.finish,
            quantity: quantity,
            unit: 'piece',
            holeSize: herraje.hole_size,
            maxLoad: herraje.max_load,
            maxLoadUnit: 'kg',
          });
        }
      } catch (error) {
        console.error(`Error loading hardware ${herrajeId}:`, error);
      }
    }

    return hardwareList;
  }

  /**
   * Generate holes specifications for BOM
   */
  generateHolesBOM() {
    const holesByType = {
      circle: [],
      taladro: [],
      avellanado: [],
      rectangle: [],
      clip: [],
    };

    this.holes.forEach((hole, index) => {
      const holeInfo = {
        index: index + 1,
        x: hole.x.toFixed(1),
        y: hole.y.toFixed(1),
        herraje: hole.herrajes_herraje_id || null,
      };

      if (hole.shape === 'circle' || hole.shape === 'taladro') {
        holeInfo.diameter = hole.diameter.toFixed(1);
        holesByType[hole.shape].push(holeInfo);
      } else if (hole.shape === 'avellanado') {
        holeInfo.counterDiameter = hole.diameter.toFixed(1);
        holeInfo.holeDiameter = hole.holeDiameter?.toFixed(1) || 'N/A';
        holesByType.avellanado.push(holeInfo);
      } else if (hole.shape === 'rectangle') {
        holeInfo.width = hole.width.toFixed(1);
        holeInfo.height = hole.height.toFixed(1);
        holesByType.rectangle.push(holeInfo);
      } else if (hole.shape === 'clip') {
        holeInfo.width = hole.width.toFixed(1);
        holeInfo.depth = hole.depth.toFixed(1);
        holesByType.clip.push(holeInfo);
      }
    });

    return holesByType;
  }

  /**
   * Export BOM as JSON
   */
  async exportBOMAsJSON() {
    const bom = await this.generateBillOfMaterials();
    const bomText = JSON.stringify(bom, null, 2);
    
    const link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(bomText);
    link.download = `bom-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Display BOM in a modal
   */
  async showBillOfMaterials() {
    const bom = await this.generateBillOfMaterials();
    
    const modal = document.createElement('div');
    modal.className = 'bom-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 5000;
      overflow-y: auto;
    `;

    let hardwareHtml = '';
    if (bom.hardware.length > 0) {
      hardwareHtml = `
        <h4 style="margin-top: 1.5rem; color: #1e293b;">Hardware Components</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #cbd5e1;">Code</th>
              <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #cbd5e1;">Name</th>
              <th style="padding: 0.5rem; text-align: center; border-bottom: 2px solid #cbd5e1;">Qty</th>
              <th style="padding: 0.5rem; text-align: left; border-bottom: 2px solid #cbd5e1;">Material</th>
            </tr>
          </thead>
          <tbody>
            ${bom.hardware.map(h => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 0.5rem;">${h.code}</td>
                <td style="padding: 0.5rem;">${h.name}</td>
                <td style="padding: 0.5rem; text-align: center; font-weight: 600;">${h.quantity}</td>
                <td style="padding: 0.5rem;">${h.material}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    let holesHtml = '';
    const totalHoles = Object.values(bom.holes).reduce((sum, arr) => sum + arr.length, 0);
    if (totalHoles > 0) {
      holesHtml = `
        <h4 style="margin-top: 1.5rem; color: #1e293b;">Holes Summary</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          ${bom.holes.circle.length > 0 ? `<div style="background: #f1f5f9; padding: 1rem; border-radius: 4px;"><strong>Circle Holes:</strong> ${bom.holes.circle.length}</div>` : ''}
          ${bom.holes.taladro.length > 0 ? `<div style="background: #f1f5f9; padding: 1rem; border-radius: 4px;"><strong>Drill Holes:</strong> ${bom.holes.taladro.length}</div>` : ''}
          ${bom.holes.avellanado.length > 0 ? `<div style="background: #f1f5f9; padding: 1rem; border-radius: 4px;"><strong>Countersinks:</strong> ${bom.holes.avellanado.length}</div>` : ''}
          ${bom.holes.rectangle.length > 0 ? `<div style="background: #f1f5f9; padding: 1rem; border-radius: 4px;"><strong>Rectangular:</strong> ${bom.holes.rectangle.length}</div>` : ''}
          ${bom.holes.clip.length > 0 ? `<div style="background: #f1f5f9; padding: 1rem; border-radius: 4px;"><strong>Edge Clips:</strong> ${bom.holes.clip.length}</div>` : ''}
        </div>
      `;
    }

    const bomHtml = `
      <div style="background: white; border-radius: 8px; padding: 2rem; max-width: 800px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); margin: 2rem 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="margin: 0; color: #1e293b;">Bill of Materials</h2>
          <button onclick="this.closest('.bom-modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8;">×</button>
        </div>

        <div style="background: #f1f5f9; padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem;">
          <h4 style="margin: 0 0 1rem; color: #1e293b;">Glass Specifications</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.875rem;">
            <div><label style="color: #64748b;">Size:</label> <strong>${bom.glass.width}×${bom.glass.height}mm</strong></div>
            <div><label style="color: #64748b;">Area:</label> <strong>${bom.glass.area}m²</strong></div>
            <div><label style="color: #64748b;">Thickness:</label> <strong>${bom.glass.thickness}mm</strong></div>
            <div><label style="color: #64748b;">Type:</label> <strong style="text-transform: capitalize;">${bom.glass.type}</strong></div>
            ${bom.glass.shape && bom.glass.shape !== "rectangle" ? `<div><label style="color: #64748b;">Shape:</label> <strong style="text-transform: capitalize;">${bom.glass.shape.replace("-", " ")}</strong></div>` : ''}
            ${bom.glass.cpb ? `<div style="grid-column: 1/-1;"><label style="color: #64748b;">✓ Polished Edge (CPB)</label></div>` : ''}
            ${bom.glass.painted ? `<div style="grid-column: 1/-1;"><label style="color: #64748b;">Painted Areas:</label> <strong>${bom.glass.paintedAreas} area(s) = ${bom.glass.paintedArea}m²</strong></div>` : ''}
          </div>
        </div>

        ${hardwareHtml}
        ${holesHtml}

        <div style="background: #f0fdf4; padding: 1rem; border-radius: 4px; margin-top: 1.5rem; font-size: 0.875rem;">
          <p style="margin: 0; color: #166534;"><strong>Summary:</strong> ${totalHoles} hole(s), ${bom.hardware.length} hardware item(s)</p>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
          <button class="btn btn-outline" onclick="designer.exportBOMAsJSON()">Export JSON</button>
          <button class="btn btn-outline" onclick="this.closest('.bom-modal').remove()">Close</button>
        </div>
      </div>
    `;

    modal.innerHTML = bomHtml;
    document.body.appendChild(modal);
  }

  loadDesignData(data) {
    if (data.glass) {
      this.glass = {
        width: 1200,
        height: 800,
        thickness: 6,
        type: "clear",
        cpb: false,
        shape: "rectangle",
        shapeParams: {},
        freeformPoints: [],
        flipH: false,
        flipV: false,
        ...data.glass,
      };
      // Ensure nested objects are properly copied
      if (data.glass.shapeParams) {
        this.glass.shapeParams = { ...data.glass.shapeParams };
      }
      if (data.glass.freeformPoints) {
        this.glass.freeformPoints = data.glass.freeformPoints.map((p) => ({
          ...p,
        }));
      }
      this.setupCanvas();
    }

    if (data.holes) {
      this.holes = data.holes.map((hole) => ({ ...hole }));
    }

    this.selectedHoleIndex = -1;
    this.render();

    // Update shape picker button
    const shapeDef = GLASS_SHAPES[this.glass.shape];
    const pickerName = document.getElementById("shape-picker-name");
    const pickerIcon = document.getElementById("shape-picker-icon");
    if (pickerName && shapeDef) {
      pickerName.textContent = shapeDef.name;
    }
    if (pickerIcon) {
      pickerIcon.innerHTML = generateShapeSVG(this.glass.shape);
    }
    this.updateShapeParamsUI();
  }

  clearDesign() {
    this.holes = [];
    this.paintAreas = [];
    this.selectedHoleIndex = -1;
    this.glass.shape = "rectangle";
    this.glass.shapeParams = {};
    this.glass.freeformPoints = [];
    this.glass.flipH = false;
    this.glass.flipV = false;
    this.isDrawingFreeform = false;
    this.freeformTempPoints = [];
    this.render();

    // Reset shape picker button
    const pickerName = document.getElementById("shape-picker-name");
    const pickerIcon = document.getElementById("shape-picker-icon");
    if (pickerName) pickerName.textContent = "Rectangle";
    if (pickerIcon) pickerIcon.innerHTML = generateShapeSVG("rectangle");
    this.updateShapeParamsUI();
  }

  printDesign() {
    const t = window.i18n ? window.i18n.t : (key) => key;

    // Collect unique hole specifications
    const uniqueSpecs = {
      circles: new Set(),
      rectangles: new Set(),
      taladros: new Set(),
      avellanados: new Set(),
      clips: new Set(),
    };

    this.holes.forEach((hole) => {
      if (hole.shape === "circle") {
        uniqueSpecs.circles.add(Math.round(hole.diameter));
      } else if (hole.shape === "rectangle") {
        uniqueSpecs.rectangles.add(
          `${Math.round(hole.width)}×${Math.round(hole.height)}`,
        );
      } else if (hole.shape === "taladro") {
        uniqueSpecs.taladros.add(Math.round(hole.diameter));
      } else if (hole.shape === "avellanado") {
        uniqueSpecs.avellanados.add(
          `${Math.round(hole.diameter)}/${Math.round(hole.holeDiameter)}`,
        );
      } else if (hole.shape === "clip") {
        uniqueSpecs.clips.add(
          `${Math.round(hole.width)}×${Math.round(hole.depth)}`,
        );
      }
    });

    // Count holes by type
    const circleCounts = {};
    const rectangleCounts = {};
    const taladroCounts = {};
    const avellanadoCounts = {};
    const clipCounts = {};

    this.holes.forEach((hole) => {
      if (hole.shape === "circle") {
        const d = Math.round(hole.diameter);
        circleCounts[d] = (circleCounts[d] || 0) + 1;
      } else if (hole.shape === "rectangle") {
        const spec = `${Math.round(hole.width)}×${Math.round(hole.height)}`;
        rectangleCounts[spec] = (rectangleCounts[spec] || 0) + 1;
      } else if (hole.shape === "taladro") {
        const d = Math.round(hole.diameter);
        taladroCounts[d] = (taladroCounts[d] || 0) + 1;
      } else if (hole.shape === "avellanado") {
        const spec = `${Math.round(hole.diameter)}/${Math.round(hole.holeDiameter)}`;
        avellanadoCounts[spec] = (avellanadoCounts[spec] || 0) + 1;
      } else if (hole.shape === "clip") {
        const spec = `${Math.round(hole.width)}×${Math.round(hole.depth)}`;
        clipCounts[spec] = (clipCounts[spec] || 0) + 1;
      }
    });

    // Generate print template HTML
    let holesSpecHTML = "";

    // Circle holes
    if (uniqueSpecs.circles.size > 0) {
      holesSpecHTML += '<div class="print-hole-spec">';
      holesSpecHTML += `<div class="print-hole-type">${t("circleHoles")}</div>`;
      Array.from(uniqueSpecs.circles)
        .sort((a, b) => b - a)
        .forEach((diameter) => {
          const count = circleCounts[diameter];
          holesSpecHTML += `<div class="print-property">`;
          holesSpecHTML += `<span class="print-property-label">${t("diameter")}: ${diameter}mm</span>`;
          holesSpecHTML += `<span>${t("quantity")}: ${count}</span>`;
          holesSpecHTML += `</div>`;
        });
      holesSpecHTML += "</div>";
    }

    // Drill holes (taladros)
    if (uniqueSpecs.taladros.size > 0) {
      holesSpecHTML += '<div class="print-hole-spec">';
      holesSpecHTML += `<div class="print-hole-type">${t("drillHoles")}</div>`;
      Array.from(uniqueSpecs.taladros)
        .sort((a, b) => b - a)
        .forEach((diameter) => {
          const count = taladroCounts[diameter];
          holesSpecHTML += `<div class="print-property">`;
          holesSpecHTML += `<span class="print-property-label">${t("diameter")}: ${diameter}mm</span>`;
          holesSpecHTML += `<span>${t("quantity")}: ${count}</span>`;
          holesSpecHTML += `</div>`;
        });
      holesSpecHTML += "</div>";
    }

    // Countersink holes (avellanados)
    if (uniqueSpecs.avellanados.size > 0) {
      holesSpecHTML += '<div class="print-hole-spec">';
      holesSpecHTML += `<div class="print-hole-type">${t("countersinkHoles")}</div>`;
      Array.from(uniqueSpecs.avellanados).forEach((spec) => {
        const count = avellanadoCounts[spec];
        const [counterDia, holeDia] = spec.split("/");
        holesSpecHTML += `<div class="print-property">`;
        holesSpecHTML += `<span class="print-property-label">${t("counterDiameter")}: ${counterDia}mm / ${t("holeDiameter")}: ${holeDia}mm</span>`;
        holesSpecHTML += `<span>${t("quantity")}: ${count}</span>`;
        holesSpecHTML += `</div>`;
      });
      holesSpecHTML += "</div>";
    }

    // Rectangle holes
    if (uniqueSpecs.rectangles.size > 0) {
      holesSpecHTML += '<div class="print-hole-spec">';
      holesSpecHTML += `<div class="print-hole-type">${t("rectangleHoles")}</div>`;
      Array.from(uniqueSpecs.rectangles).forEach((spec) => {
        const count = rectangleCounts[spec];
        holesSpecHTML += `<div class="print-property">`;
        holesSpecHTML += `<span class="print-property-label">${t("size")}: ${spec}mm</span>`;
        holesSpecHTML += `<span>${t("quantity")}: ${count}</span>`;
        holesSpecHTML += `</div>`;
      });
      holesSpecHTML += "</div>";
    }

    // Edge clips
    if (uniqueSpecs.clips.size > 0) {
      holesSpecHTML += '<div class="print-hole-spec">';
      holesSpecHTML += `<div class="print-hole-type">${t("edgeClips")}</div>`;
      Array.from(uniqueSpecs.clips).forEach((spec) => {
        const count = clipCounts[spec];
        holesSpecHTML += `<div class="print-property">`;
        holesSpecHTML += `<span class="print-property-label">${t("size")}: ${spec}mm (${t("width")}×${t("depth")})</span>`;
        holesSpecHTML += `<span>${t("quantity")}: ${count}</span>`;
        holesSpecHTML += `</div>`;
      });
      holesSpecHTML += "</div>";
    }

    // Build the works list as actual drawings + specs, numbered. Identical
    // works share a number (via the scene's tagWorks), and those same numbers
    // appear as badges on the drawing above for cross-reference.
    const printScene = this.buildScene();
    if (printScene.legend && printScene.legend.length > 0) {
      holesSpecHTML =
        '<div class="print-works-legend">' +
        printScene.legend
          .map((e) => {
            const thumb = window.renderWorkThumbnail
              ? window.renderWorkThumbnail(e.work, {
                  theme: window.DESIGNER_THEME.print,
                })
              : "";
            return (
              '<div class="print-work-row">' +
              `<div class="print-work-num">${e.tag}</div>` +
              `<div class="print-work-thumb">${thumb}</div>` +
              '<div class="print-work-info">' +
              `<div class="print-work-name">${e.typeName}</div>` +
              `<div class="print-work-spec">${e.label}</div>` +
              `<div class="print-work-qty">${t("quantity")}: ${e.count}</div>` +
              "</div></div>"
            );
          })
          .join("") +
        "</div>";
    } else {
      holesSpecHTML = `<p style="color: #64748b; font-style: italic;">${t("noHolesClipsInDesign")}</p>`;
    }

    const printTemplate = `
            <div class="print-header">
                <h1>${t("glassDesignSpec")}</h1>
                <p>${t("generated")}: ${new Date().toLocaleString()}</p>
            </div>
            <div class="print-content">
                <div class="print-drawing-area">
                    <div id="print-svg-mount" class="print-svg-mount"></div>
                </div>
                <div class="print-specs-area">
                    <h3>${t("glassProperties")}</h3>
                    ${this.getPrintDimensionsHTML(t)}
                     <div class="print-property">
                         <span class="print-property-label">${t("thickness")}:</span>
                         <span>${this.glass.thickness}mm</span>
                     </div>
                      <div class="print-property">
                          <span class="print-property-label">${t("glassType")}:</span>
                          <span>${this.getTranslatedGlassType(t)}</span>
                      </div>
                      ${this.glass.shape !== "rectangle" ? `<div class="print-property">
                          <span class="print-property-label">${t("glassShape") || "Shape"}:</span>
                          <span style="text-transform: capitalize;">${this.glass.shape.replace("-", " ")}</span>
                      </div>` : ""}
                      ${this.glass.cpb ? `<div class="print-property">
                          <span class="print-property-label">${t("cpb")}:</span>
                          <span>${t("yes")}</span>
                      </div>` : ''}
                      <div class="print-property">
                          <span class="print-property-label">${t("totalHolesClips")}:</span>
                          <span>${this.holes.length}</span>
                      </div>

                     <h3 style="margin-top: 1.5rem;">${t("worksList")}</h3>
                     ${holesSpecHTML}

                      <h3 style="margin-top: 1.5rem;">${t("paintAreas")}</h3>
                     ${this.getPaintAreasHTML(t)}
                 </div>
             </div>
         `;

    // Insert into print template container
    const printContainer = document.getElementById("print-template");
    printContainer.innerHTML = printTemplate;

    // Render the design as crisp vector SVG using the SAME scene as the screen,
    // themed for paper. This guarantees the print matches what is on screen with
    // zero measurement overlap.
    const mount = document.getElementById("print-svg-mount");
    if (mount && window.renderSceneToSVG) {
      mount.innerHTML = this.buildPrintSVG();
    } else if (mount) {
      mount.textContent = "SVG renderer unavailable.";
    }

    // Trigger print dialog
    window.print();
  }

  /**
   * Build the print/export SVG string from the current design, themed for paper.
   */
  buildPrintSVG() {
    // Lay the print scene out with the print theme so dimension lanes account
    // for the larger print font and labels stay collision-free.
    const scene = this.buildScene(window.DESIGNER_THEME.print);
    return window.renderSceneToSVG(scene, {
      theme: window.DESIGNER_THEME.print,
      targetWidth: 1000,
      padding: 28,
    });
  }

  /**
   * Export the current design as a downloadable, crisp .svg file.
   */
  exportSVG() {
    if (!window.renderSceneToSVG) return;
    const svg = this.buildPrintSVG();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name =
      (this.currentDesignName || "glass-design").replace(/[^\w.-]+/g, "_") +
      ".svg";
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Convert backend Elements format to frontend hole format
 * @param {Object} elements - Elements object from backend
 * @returns {Array} Array of holes in frontend format
 */
function convertFromBackendFormat(elements) {
  const holes = [];

  if (!elements) return holes;

  // Convert holes
  if (elements.holes && Array.isArray(elements.holes)) {
    elements.holes.forEach((hole) => {
      if (hole.type === "circular") {
        // Check if this is a countersink (has tolerance value representing inner diameter)
        if (hole.tolerance && hole.tolerance > 0) {
          // Countersink hole
          holes.push({
            x: hole.center.x,
            y: hole.center.y,
            diameter: hole.radius * 2, // Outer diameter
            holeDiameter: hole.tolerance, // Inner diameter (stored in tolerance)
            shape: "avellanado",
          });
        } else if (hole.style && hole.style.stroke_color === "#3b82f6") {
          // Drill hole (taladro) - identified by blue color
          holes.push({
            x: hole.center.x,
            y: hole.center.y,
            diameter: hole.radius * 2,
            shape: "taladro",
          });
        } else {
          // Regular circular hole
          holes.push({
            x: hole.center.x,
            y: hole.center.y,
            diameter: hole.radius * 2,
            shape: "circle",
          });
        }
      } else if (hole.type === "rectangular") {
        // Rectangular hole - convert center to bottom-left corner
        holes.push({
          x: hole.center.x - hole.width / 2,
          y: hole.center.y - hole.height / 2,
          width: hole.width,
          height: hole.height,
          shape: "rectangle",
        });
      }
    });
  }

  // Convert cuts (edge clips)
  if (elements.cuts && Array.isArray(elements.cuts)) {
    elements.cuts.forEach((cut) => {
      if (cut.type === "notched") {
        holes.push({
          x: (cut.start_x + cut.end_x) / 2, // Center X
          y: cut.start_y, // Y position
          width: Math.abs(cut.end_x - cut.start_x),
          depth: cut.depth,
          shape: "clip",
        });
      }
    });
  }

  // Restore parametric works (Phase 5)
  if (elements.works && Array.isArray(elements.works)) {
    elements.works.forEach((w) => {
      holes.push({
        id: w.id,
        shape: "work",
        templateId: w.template_id || w.templateId,
        params: w.params || {},
        x: w.x,
        y: w.y,
        mirror: w.mirror || { h: false, v: false },
        herrajes_herraje_id: w.herrajes_herraje_id || null,
      });
    });
  }

  return holes;
}

/**
 * Load design from backend by ID
 * @param {number} designId - The design ID to load
 */
async function loadDesignFromBackend(designId) {
  try {
    const response = await fetch(`/api/designs/${designId}`);
    if (!response.ok) {
      throw new Error("Failed to load design");
    }

    const data = await response.json();
    const design = data.design;

    if (!design) {
      throw new Error("Design not found");
    }

    // Convert backend format to frontend format
    const holes = convertFromBackendFormat(design.elements);

    // Restore glass shape metadata from elements if available
    const glassShape = design.elements?.glassShape || {};

    // Load into designer
    designer.loadDesignData({
      glass: {
        width: design.width,
        height: design.height,
        thickness: design.thickness,
        shape: glassShape.shape || "rectangle",
        shapeParams: glassShape.shapeParams || {},
        freeformPoints: glassShape.freeformPoints || [],
        flipH: glassShape.flipH || false,
        flipV: glassShape.flipV || false,
      },
      holes: holes,
    });

    // Update glass dimension inputs
    document.getElementById("glass-width").value = design.width;
    document.getElementById("glass-height").value = design.height;
    document.getElementById("glass-thickness").value = design.thickness;

    // Store design info for editing
    currentDesignId = design.id;
    currentDesignName = design.name || "";
    currentDesignDescription = design.description || "";
    selectedProjectId = design.project_id || null;

    console.log("Design loaded successfully:", design.name);
  } catch (error) {
    console.error("Failed to load design:", error);
    alert("Error loading design: " + error.message);
  }
}

// Initialize when page loads
let designer = null;
let herrajesManager = null;

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("design-canvas")) {
    designer = new GlassDesigner("design-canvas");

    // Initialize herrajes manager
    herrajesManager = new HerrrajesManager(designer);

    // Populate dropdowns with current language
    designer.populateGlassTypeDropdown(window.t || ((key) => key));
    designer.populatePaintColorDropdown(window.t || ((key) => key));

    // Setup tool buttons
    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tool = btn.getAttribute("data-tool");
        if (tool) {
          designer.setTool(tool);
        }
      });
    });

    // Build the works library palette and wire its search box.
    designer.buildWorksPalette();
    const worksSearch = document.getElementById("works-search");
    if (worksSearch) {
      worksSearch.addEventListener("input", () => {
        designer.buildWorksPalette(worksSearch.value);
      });
    }

    // Initialize shape picker button with default shape
    const pickerIcon = document.getElementById("shape-picker-icon");
    if (pickerIcon) pickerIcon.innerHTML = generateShapeSVG("rectangle");

    // Setup glass dimension inputs
    const widthInput = document.getElementById("glass-width");
    const heightInput = document.getElementById("glass-height");
    const thicknessInput = document.getElementById("glass-thickness");
    const thicknessSelect = document.getElementById("glass-thickness-select");

    if (widthInput && heightInput && thicknessInput && thicknessSelect) {
      const updateDimensions = () => {
        designer.updateGlassDimensions(
          widthInput.value,
          heightInput.value,
          thicknessInput.value,
        );
      };

      // Handle thickness select dropdown
      thicknessSelect.addEventListener("change", function () {
        if (this.value === "custom") {
          // Show custom input, hide select
          thicknessSelect.style.display = "none";
          thicknessInput.style.display = "block";
          thicknessInput.focus();
        } else {
          // Update thickness with selected value
          thicknessInput.value = this.value;
          updateDimensions();
        }
      });

      // Handle custom thickness input blur (going back to select)
      thicknessInput.addEventListener("blur", function () {
        // Check if the value matches a preset
        const presetValues = ["4", "6", "8", "9.5", "12"];
        if (presetValues.includes(this.value)) {
          // Value matches preset, go back to select
          thicknessSelect.value = this.value;
          thicknessInput.style.display = "none";
          thicknessSelect.style.display = "block";
        } else {
          // Custom value, keep input shown but update to show it's custom
          thicknessInput.style.display = "none";
          thicknessSelect.style.display = "block";
          thicknessSelect.value = "custom";
        }
      });

       // Handle custom thickness input change
       thicknessInput.addEventListener("change", function () {
         updateDimensions();
       });

       widthInput.addEventListener("change", updateDimensions);
       heightInput.addEventListener("change", updateDimensions);

        // Handle glass type selection
        const typeSelect = document.getElementById("glass-type");
        if (typeSelect) {
          typeSelect.addEventListener("change", function () {
            designer.updateGlassType(this.value);
          });
        }

        // Handle paint color selection
        const paintColorSelect = document.getElementById("paint-color");
        if (paintColorSelect) {
          paintColorSelect.addEventListener("change", function () {
            designer.updatePaintColor(this.value);
          });
        }

        // Handle CPB toggle
        const cpbCheckbox = document.getElementById("glass-cpb");
        if (cpbCheckbox) {
          cpbCheckbox.addEventListener("change", function () {
            designer.updateCPB(this.checked);
          });
        }
    }

    // Hole properties are now handled inline in the holes list

    // Setup action buttons
    document.getElementById("btn-save")?.addEventListener("click", () => {
      const data = designer.getDesignData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "glass-design.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("btn-load")?.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const data = JSON.parse(event.target.result);
              designer.loadDesignData(data);
            } catch (error) {
              const errorMsg = window.i18n
                ? window.i18n.t("errorLoadingDesign")
                : "Error loading design file";
              alert(errorMsg + ": " + error.message);
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    });

    document.getElementById("btn-clear")?.addEventListener("click", () => {
      const confirmMsg = window.i18n
        ? window.i18n.t("clearAllConfirm")
        : "Clear all holes? This cannot be undone.";
      if (confirm(confirmMsg)) {
        designer.clearDesign();
      }
    });

     document.getElementById("btn-print")?.addEventListener("click", () => {
       designer.printDesign();
     });

     // Paint buttons
     document.getElementById("btn-paint-whole")?.addEventListener("click", () => {
       designer.paintWholeGlass();
     });

     document.getElementById("btn-clear-paint")?.addEventListener("click", () => {
       designer.clearPaint();
     });

    // Save to Project button
    document
      .getElementById("btn-save-to-project")
      ?.addEventListener("click", () => {
        openSaveToProjectModal(false); // Regular save
      });

    // Save As button
    document.getElementById("btn-save-as")?.addEventListener("click", () => {
      openSaveToProjectModal(true); // Save as new design
    });

    // Delete button is now in each hole item

    // Check if there's a design ID in the URL to load
    const urlParams = new URLSearchParams(window.location.search);
    const designId = urlParams.get("design");
    if (designId) {
      loadDesignFromBackend(parseInt(designId));
    }
  }
});

// Save to Project functionality
let selectedProjectId = null;
let selectedProjectPath = "";
let projectsData = [];
let currentDesignId = null; // Track the current design being edited
let currentDesignName = ""; // Track the current design name
let currentDesignDescription = ""; // Track the current design description
let isSaveAs = false; // Track if we're doing "Save As" instead of "Save"

function openSaveToProjectModal(saveAsMode = false) {
  isSaveAs = saveAsMode;

  if (currentDesignId && !saveAsMode) {
    // Editing existing design - pre-fill form
    document.getElementById("design-name-input").value = currentDesignName;
    document.getElementById("design-description-input").value =
      currentDesignDescription;
    // Keep the selectedProjectId that was set when loading
  } else {
    // New design or Save As - clear/reset form
    if (saveAsMode) {
      // For Save As, pre-fill with current name + " (Copy)"
      document.getElementById("design-name-input").value =
        currentDesignName + " (Copy)";
      document.getElementById("design-description-input").value =
        currentDesignDescription;
    } else {
      selectedProjectId = null;
      selectedProjectPath = "";
      document.getElementById("design-name-input").value = "";
      document.getElementById("design-description-input").value = "";
    }
    document.getElementById("selected-project-path").style.display = "none";
  }

  // Load projects
  loadProjectsForSelection();

  // Update modal title based on mode
  const modalTitle = document.querySelector(
    "#save-to-project-modal .modal-header h3",
  );
  if (modalTitle) {
    if (currentDesignId && !saveAsMode) {
      modalTitle.textContent = "Update Design";
    } else if (saveAsMode) {
      modalTitle.textContent = "Save Design As";
    } else {
      modalTitle.textContent = "Save Design to Project";
    }
  }

  // Update button text
  const saveButton = document.getElementById("btn-confirm-save");
  if (saveButton) {
    if (currentDesignId && !saveAsMode) {
      saveButton.textContent = "Update";
    } else {
      saveButton.textContent = "Save Design";
    }
  }

  // Show modal
  document.getElementById("save-to-project-modal").classList.add("active");
}

function closeSaveToProjectModal() {
  document.getElementById("save-to-project-modal").classList.remove("active");
}

async function loadProjectsForSelection() {
  try {
    const response = await fetch("/api/projects?tree=true");
    const data = await response.json();
    projectsData = data.projects || [];
    // Reset expanded state when loading new data
    expandedProjects.clear();
    renderProjectTreeSelector();
  } catch (error) {
    console.error("Failed to load projects:", error);
    document.getElementById("project-tree-selector").innerHTML =
      '<div class="error-message">Failed to load projects</div>';
  }
}

function renderProjectTreeSelector() {
  const container = document.getElementById("project-tree-selector");

  if (projectsData.length === 0) {
    container.innerHTML = `
            <div class="empty-state" style="padding: 1.5rem;">
                <p>No projects available. You can still save without selecting a project.</p>
            </div>
        `;
    return;
  }

  // Show help text if no projects are expanded
  const hasExpandedProjects = expandedProjects.size > 0;
  const helpText = hasExpandedProjects
    ? ""
    : `
    <div class="tree-help-text" style="padding: 0.5rem; margin-bottom: 0.5rem; background: #f8fafc; border-radius: 4px; font-size: 0.875rem; color: #64748b;">
      💡 Click the ▶ arrows to expand projects and see subprojects
    </div>
  `;

  container.innerHTML =
    helpText +
    projectsData.map((project) => renderProjectTreeNode(project, 0)).join("");

  // Add click handlers for expand/collapse buttons
  container.querySelectorAll(".tree-expand-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const projectId = parseInt(btn.dataset.projectId);
      toggleProjectExpanded(projectId);
    });
  });
}

function renderProjectTreeNode(project, depth = 0) {
  const hasChildren = project.children && project.children.length > 0;
  const indent = depth > 0 ? "tree-project-children" : "";
  const isSelected = selectedProjectId === project.id;
  const isExpanded = expandedProjects.has(project.id);

  // Escape path properly for onclick
  const escapedPath = project.path.replace(/'/g, "\\'");
  const escapedName = project.name.replace(/'/g, "\\'");

  let html = `
        <div class="tree-project-item ${isSelected ? "selected" : ""}"
             onclick="selectProject(${project.id}, '${escapedPath}', '${escapedName}')">
            <div class="tree-project-header">
                ${
                  hasChildren
                    ? `
                    <button class="tree-expand-btn" data-project-id="${project.id}">
                        <span class="expand-icon ${isExpanded ? "expanded" : ""}">${isExpanded ? "▼" : "▶"}</span>
                    </button>
                `
                    : '<span class="tree-expand-spacer"></span>'
                }
                <div class="tree-project-content">
                    <div class="tree-project-name">${escapeHtml(project.name)}</div>
                    <div class="tree-project-path">${escapeHtml(project.path)}</div>
                </div>
            </div>
        </div>
    `;

  // Add children recursively if expanded
  if (hasChildren && isExpanded) {
    html += '<div class="' + indent + '">';
    html += project.children
      .map((child) => renderProjectTreeNode(child, depth + 1))
      .join("");
    html += "</div>";
  }

  return html;
}

function selectProject(projectId, projectPath, projectName) {
  selectedProjectId = projectId;
  selectedProjectPath = projectPath;

  // Update UI - remove all selected classes
  document.querySelectorAll(".tree-project-item").forEach((item) => {
    item.classList.remove("selected");
  });

  // Re-render tree to update selection
  renderProjectTreeSelector();

  // Show selected project path
  document.getElementById("selected-project-path").style.display = "block";
  document.getElementById("selected-path-text").textContent = projectPath;
}

// Global variable to track expanded projects
let expandedProjects = new Set();

function toggleProjectExpanded(projectId) {
  if (expandedProjects.has(projectId)) {
    // Collapse this project and all its descendants
    collapseProjectAndDescendants(projectId);
  } else {
    // Collapse siblings at the same level when expanding
    collapseSiblings(projectId);
    expandedProjects.add(projectId);
  }
  renderProjectTreeSelector();
}

function collapseProjectAndDescendants(projectId) {
  expandedProjects.delete(projectId);

  // Find and collapse all descendants
  const project = findProjectById(projectsData, projectId);
  if (project && project.children) {
    project.children.forEach((child) => {
      collapseProjectAndDescendants(child.id);
    });
  }
}

function collapseSiblings(projectId) {
  const project = findProjectById(projectsData, projectId);
  if (!project) return;

  // Find parent and collapse all siblings
  const parent = findParentProject(projectsData, projectId);
  if (parent && parent.children) {
    parent.children.forEach((sibling) => {
      if (sibling.id !== projectId) {
        collapseProjectAndDescendants(sibling.id);
      }
    });
  } else {
    // This is a top-level project, collapse other top-level projects
    projectsData.forEach((topLevel) => {
      if (topLevel.id !== projectId) {
        collapseProjectAndDescendants(topLevel.id);
      }
    });
  }
}

function findProjectById(projects, projectId) {
  for (const project of projects) {
    if (project.id === projectId) {
      return project;
    }
    if (project.children) {
      const found = findProjectById(project.children, projectId);
      if (found) return found;
    }
  }
  return null;
}

function findParentProject(projects, childId, parent = null) {
  for (const project of projects) {
    if (project.children) {
      const childFound = project.children.find((child) => child.id === childId);
      if (childFound) {
        return project;
      }
      const found = findParentProject(project.children, childId, project);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Convert frontend hole format to backend Elements format
 * @param {Array} holes - Array of holes from designer
 * @returns {Object} Elements object compatible with backend
 */
function convertToBackendFormat(holes, glassData) {
  const elements = {
    shapes: [],
    holes: [],
    cuts: [],
    notes: [],
    works: [], // parametric works library items (Phase 5)
  };

  // Store glass shape metadata for round-tripping
  if (glassData && glassData.shape && glassData.shape !== "rectangle") {
    elements.glassShape = {
      shape: glassData.shape,
      shapeParams: glassData.shapeParams || {},
      freeformPoints: glassData.freeformPoints || [],
      flipH: glassData.flipH || false,
      flipV: glassData.flipV || false,
    };
  }

  holes.forEach((hole, index) => {
    const defaultStyle = {
      stroke_color: "#000000",
      stroke_width: 2,
      fill_color: "#ffffff",
      fill_opacity: 1,
      line_dash: [],
      font_size: 12,
      font_family: "Arial, sans-serif",
      text_color: "#000000",
    };

    if (hole.shape === "work") {
      // Parametric works persist verbatim (template + params + placement).
      elements.works.push({
        id: hole.id || `work-${Date.now()}-${index}`,
        template_id: hole.templateId,
        params: hole.params || {},
        x: hole.x,
        y: hole.y,
        mirror: hole.mirror || { h: false, v: false },
        herrajes_herraje_id: hole.herrajes_herraje_id || null,
      });
      return;
    }

    if (hole.shape === "clip") {
      // Edge clips are represented as notched cuts in the backend
      const cut = {
        id: `cut-${Date.now()}-${index}`,
        type: "notched",
        start_x: hole.x - hole.width / 2,
        start_y: hole.y,
        end_x: hole.x + hole.width / 2,
        end_y: hole.y,
        depth: hole.depth,
        angle: 0,
        style: { ...defaultStyle, stroke_color: "#10b981" },
        locked: false,
        visible: true,
      };
      if (hole.herrajes_herraje_id) {
        cut.herrajes_herraje_id = hole.herrajes_herraje_id;
      }
      elements.cuts.push(cut);
    } else if (hole.shape === "circle" || hole.shape === "taladro") {
      // Circular holes (both regular circles and drill holes)
      const circular = {
        id: `hole-${Date.now()}-${index}`,
        type: "circular",
        center: { x: hole.x, y: hole.y },
        radius: hole.diameter / 2,
        width: 0,
        height: 0,
        points: [],
        style: {
          ...defaultStyle,
          stroke_color: hole.shape === "taladro" ? "#3b82f6" : "#ef4444",
        },
        tolerance: 0,
        locked: false,
        visible: true,
      };
      if (hole.herrajes_herraje_id) {
        circular.herrajes_herraje_id = hole.herrajes_herraje_id;
      }
      elements.holes.push(circular);
    } else if (hole.shape === "avellanado") {
      // Countersink holes - currently stored as circular with inner diameter in tolerance
      // TODO: Backend should be enhanced to properly support countersink holes
      const countersink = {
        id: `hole-${Date.now()}-${index}`,
        type: "circular",
        center: { x: hole.x, y: hole.y },
        radius: hole.diameter / 2, // Outer diameter
        width: 0,
        height: 0,
        points: [],
        style: { ...defaultStyle, stroke_color: "#8b5cf6" },
        tolerance: hole.holeDiameter, // Store inner diameter here temporarily
        locked: false,
        visible: true,
      };
      if (hole.herrajes_herraje_id) {
        countersink.herrajes_herraje_id = hole.herrajes_herraje_id;
      }
      elements.holes.push(countersink);
    } else if (hole.shape === "rectangle") {
      // Rectangular holes
      const rectangular = {
        id: `hole-${Date.now()}-${index}`,
        type: "rectangular",
        center: {
          x: hole.x + hole.width / 2,
          y: hole.y + hole.height / 2,
        },
        width: hole.width,
        height: hole.height,
        radius: 0,
        points: [],
        style: { ...defaultStyle, stroke_color: "#ef4444" },
        tolerance: 0,
        locked: false,
        visible: true,
      };
      if (hole.herrajes_herraje_id) {
        rectangular.herrajes_herraje_id = hole.herrajes_herraje_id;
      }
      elements.holes.push(rectangular);
    }
  });

  return elements;
}

async function saveDesignToProject() {
  const designName = document.getElementById("design-name-input").value.trim();
  const description = document
    .getElementById("design-description-input")
    .value.trim();

  if (!designName) {
    alert("Please enter a design name");
    return;
  }

  const designData = designer.getDesignData();

  // Convert frontend format to backend Elements format
  const elements = convertToBackendFormat(designData.holes, designData.glass);

  const payload = {
    name: designName,
    description: description,
    width: designData.glass.width,
    height: designData.glass.height,
    thickness: designData.glass.thickness,
    elements: elements, // Send as 'elements' object, not 'design_data' string
    project_id: selectedProjectId, // Can be null
  };

  try {
    // Determine if we're updating an existing design or creating a new one
    const isUpdate = currentDesignId && !isSaveAs;
    const url = isUpdate ? `/api/designs/${currentDesignId}` : "/api/designs";
    const method = isUpdate ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        error || `Failed to ${isUpdate ? "update" : "save"} design`,
      );
    }

    const result = await response.json();

    // Update stored design info
    if (isUpdate) {
      currentDesignName = designName;
      currentDesignDescription = description;
    } else {
      // New design was created, store its ID for future saves
      currentDesignId = result.design?.id || null;
      currentDesignName = designName;
      currentDesignDescription = description;
    }

    alert(
      `Design ${isUpdate ? "updated" : "saved"} successfully!` +
        (selectedProjectPath ? `\nSaved to: ${selectedProjectPath}` : ""),
    );
    closeSaveToProjectModal();
  } catch (error) {
    console.error("Failed to save design:", error);
    alert("Error: " + error.message);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Modal event listeners
document
  .getElementById("save-project-close")
  ?.addEventListener("click", closeSaveToProjectModal);
document
  .getElementById("btn-cancel-save")
  ?.addEventListener("click", closeSaveToProjectModal);
document
  .getElementById("btn-confirm-save")
  ?.addEventListener("click", saveDesignToProject);

// Close modal when clicking outside
document
  .getElementById("save-to-project-modal")
  ?.addEventListener("click", (e) => {
    if (e.target.id === "save-to-project-modal") {
      closeSaveToProjectModal();
    }
  });

// Export for use in other scripts
window.glassDesigner = designer;
