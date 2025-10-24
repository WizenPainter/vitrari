/**
 * Glass Designer - Canvas-based design tool
 * Allows users to design glass pieces with holes at specific locations
 */

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
    };

    // Holes array - each hole has {x, y, diameter, shape}
    this.holes = [];

    // Selected hole for editing
    this.selectedHoleIndex = -1;

    // Current tool
    this.currentTool = "select"; // 'select', 'rectangle', 'circle', 'hole'

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
      if (e.key === "Delete" && this.selectedHoleIndex >= 0) {
        this.deleteHole(this.selectedHoleIndex);
      }
      if (e.key === "Escape") {
        this.selectedHoleIndex = -1;
        this.render();
        this.renderHolesList();
      }
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

    const glassCoords = this.canvasToGlass(canvasX, canvasY);

    // Check if click is within glass bounds
    if (
      glassCoords.x < 0 ||
      glassCoords.x > this.glass.width ||
      glassCoords.y < 0 ||
      glassCoords.y > this.glass.height
    ) {
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

    if (this.isDragging && this.selectedHoleIndex >= 0) {
      // Drag existing hole
      const hole = this.holes[this.selectedHoleIndex];

      if (hole.shape === "circle") {
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

      this.render();
      this.updatePropertiesPanel();
    }

    // Update cursor
    if (this.currentTool === "select") {
      const holeIndex = this.findHoleAtPoint(glassCoords.x, glassCoords.y);
      this.canvas.style.cursor = holeIndex >= 0 ? "move" : "default";
    } else {
      this.canvas.style.cursor = "crosshair";
    }
  }

  onMouseUp(e) {
    this.isDragging = false;
  }

  findHoleAtPoint(x, y) {
    for (let i = this.holes.length - 1; i >= 0; i--) {
      const hole = this.holes[i];

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

    // Update tool button states
    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector('[data-tool="' + tool + '"]')
      ?.classList.add("active");
  }

  updateGlassDimensions(width, height, thickness) {
    this.glass.width = parseFloat(width) || 1200;
    this.glass.height = parseFloat(height) || 800;
    this.glass.thickness = parseFloat(thickness) || 6;

    this.setupCanvas();
    this.render();
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
          e.target.tagName !== "BUTTON"
        ) {
          this.selectedHoleIndex = index;
          this.render();
          this.renderHolesList();
        }
      });
    });
  }

  updateHoleProperty(index, property, value) {
    if (index < 0 || index >= this.holes.length) return;

    const hole = this.holes[index];
    const numValue = parseFloat(value);

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
    }
  }

  render() {
    const ctx = this.ctx;

    // Enable smooth rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw modern gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#f0f9ff");
    gradient.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid
    this.drawGrid();

    // Draw glass piece
    this.drawGlass();

    // Draw holes
    this.drawHoles();

    // Draw dimensions
    this.drawDimensions();
  }

  renderForPrint(targetCanvas) {
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
      this.drawDimensionLines(ctx, hole);
    });

    // Draw glass dimensions (pass target canvas height)
    this.drawDimensionsOnCanvas(ctx, targetCanvas.height);

    // Restore original values
    this.offsetX = originalOffsetX;
    this.offsetY = originalOffsetY;
  }

  drawDimensionLines(ctx, hole) {
    // Get the hole center position
    let holeX = hole.x;
    let holeY = hole.y;

    // For rectangles, use center
    if (hole.shape === "rectangle") {
      holeX = hole.x + hole.width / 2;
      holeY = hole.y + hole.height / 2;
    }

    // Calculate distances to each edge
    const distToLeft = holeX;
    const distToRight = this.glass.width - holeX;
    const distToBottom = holeY;
    const distToTop = this.glass.height - holeY;

    // Determine nearest edges
    const useLeftEdge = distToLeft <= distToRight;
    const useBottomEdge = distToBottom <= distToTop;

    // Draw dimension line for X axis (horizontal)
    const xDistance = useLeftEdge ? distToLeft : distToRight;
    const xEdgePos = useLeftEdge ? 0 : this.glass.width;

    ctx.strokeStyle = "#64748b";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;

    // Horizontal dimension line
    const yOffset = 30; // Offset from the hole center
    const holeCanvasPos = this.glassToCanvas(holeX, holeY);
    const edgeCanvasPos = this.glassToCanvas(xEdgePos, holeY);

    // Draw dotted line from edge to hole
    ctx.beginPath();
    ctx.moveTo(edgeCanvasPos.x, holeCanvasPos.y - yOffset);
    ctx.lineTo(holeCanvasPos.x, holeCanvasPos.y - yOffset);
    ctx.stroke();

    // Draw small vertical ticks at ends
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(edgeCanvasPos.x, holeCanvasPos.y - yOffset - 5);
    ctx.lineTo(edgeCanvasPos.x, holeCanvasPos.y - yOffset + 5);
    ctx.moveTo(holeCanvasPos.x, holeCanvasPos.y - yOffset - 5);
    ctx.lineTo(holeCanvasPos.x, holeCanvasPos.y - yOffset + 5);
    ctx.stroke();

    // Draw measurement text
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 12px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      Math.round(xDistance) + "mm",
      (edgeCanvasPos.x + holeCanvasPos.x) / 2,
      holeCanvasPos.y - yOffset - 10,
    );

    // Draw dimension line for Y axis (vertical)
    const yDistance = useBottomEdge ? distToBottom : distToTop;
    const yEdgePos = useBottomEdge ? 0 : this.glass.height;

    ctx.setLineDash([5, 5]);
    const xOffset = 30; // Offset from the hole center
    const edgeYCanvasPos = this.glassToCanvas(holeX, yEdgePos);

    // Draw dotted line from edge to hole
    ctx.beginPath();
    ctx.moveTo(holeCanvasPos.x + xOffset, edgeYCanvasPos.y);
    ctx.lineTo(holeCanvasPos.x + xOffset, holeCanvasPos.y);
    ctx.stroke();

    // Draw small horizontal ticks at ends
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(holeCanvasPos.x + xOffset - 5, edgeYCanvasPos.y);
    ctx.lineTo(holeCanvasPos.x + xOffset + 5, edgeYCanvasPos.y);
    ctx.moveTo(holeCanvasPos.x + xOffset - 5, holeCanvasPos.y);
    ctx.lineTo(holeCanvasPos.x + xOffset + 5, holeCanvasPos.y);
    ctx.stroke();

    // Draw measurement text (rotated)
    ctx.save();
    ctx.translate(
      holeCanvasPos.x + xOffset + 15,
      (edgeYCanvasPos.y + holeCanvasPos.y) / 2,
    );
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(Math.round(yDistance) + "mm", 0, 0);
    ctx.restore();

    // Reset line dash
    ctx.setLineDash([]);
  }

  drawGridOnCanvas(ctx) {
    const gridSize = 100; // 100mm grid

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
  }

  drawGlassOnCanvas(ctx) {
    ctx.fillStyle = "#e0f2fe";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;

    ctx.fillRect(
      this.offsetX,
      this.offsetY,
      this.glass.width * this.scale,
      this.glass.height * this.scale,
    );

    ctx.strokeRect(
      this.offsetX,
      this.offsetY,
      this.glass.width * this.scale,
      this.glass.height * this.scale,
    );
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

  drawDimensionsOnCanvas(ctx, canvasHeight) {
    // Use provided canvas height or fallback to this.canvas.height
    const targetHeight = canvasHeight || this.canvas.height;

    ctx.fillStyle = "#64748b";
    ctx.font = "12px -apple-system, sans-serif";
    ctx.textAlign = "center";

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
    ctx.translate(
      this.offsetX - 30,
      this.offsetY + (this.glass.height * this.scale) / 2,
    );
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(this.glass.height + "mm", 0, 0);
    ctx.restore();

    // Thickness (top)
    ctx.fillText(
      "Thickness: " + this.glass.thickness + "mm",
      this.offsetX + (this.glass.width * this.scale) / 2,
      this.offsetY - 20,
    );
  }

  drawGrid() {
    const ctx = this.ctx;
    const gridSize = 100; // 100mm grid
    const minorGridSize = 10; // 10mm minor grid

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

    // Draw glass with gradient
    const glassGradient = ctx.createLinearGradient(
      this.offsetX,
      this.offsetY,
      this.offsetX + glassWidth,
      this.offsetY + glassHeight,
    );
    glassGradient.addColorStop(0, "#dbeafe");
    glassGradient.addColorStop(0.5, "#bfdbfe");
    glassGradient.addColorStop(1, "#93c5fd");

    ctx.fillStyle = glassGradient;
    ctx.fillRect(this.offsetX, this.offsetY, glassWidth, glassHeight);

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
    ctx.strokeRect(this.offsetX, this.offsetY, glassWidth, glassHeight);

    // Add inner highlight for glass effect
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.offsetX + 2,
      this.offsetY + 2,
      glassWidth - 4,
      glassHeight - 4,
    );
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
  }

  drawDimensions() {
    const ctx = this.ctx;

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

    // Width dimension
    const widthText = this.glass.width + "mm";
    ctx.fillText(
      widthText,
      this.offsetX + (this.glass.width * this.scale) / 2,
      this.canvas.height - 10,
    );

    // Height dimension
    ctx.save();
    ctx.translate(10, this.offsetY + (this.glass.height * this.scale) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(this.glass.height + "mm", 0, 0);
    ctx.restore();

    // Thickness
    ctx.fillText(
      "Espesor: " + this.glass.thickness + "mm",
      this.offsetX + (this.glass.width * this.scale) / 2,
      20,
    );

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  getDesignData() {
    return {
      glass: { ...this.glass },
      holes: this.holes.map((hole) => ({ ...hole })),
    };
  }

  loadDesignData(data) {
    if (data.glass) {
      this.glass = { ...data.glass };
      this.setupCanvas();
    }

    if (data.holes) {
      this.holes = data.holes.map((hole) => ({ ...hole }));
    }

    this.selectedHoleIndex = -1;
    this.render();
  }

  clearDesign() {
    this.holes = [];
    this.selectedHoleIndex = -1;
    this.render();
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

    if (holesSpecHTML === "") {
      holesSpecHTML = `<p style="color: #64748b; font-style: italic;">${t("noHolesClipsInDesign")}</p>`;
    }

    const printTemplate = `
            <div class="print-header">
                <h1>${t("glassDesignSpec")}</h1>
                <p>${t("generated")}: ${new Date().toLocaleString()}</p>
            </div>
            <div class="print-content">
                <div class="print-drawing-area">
                    <canvas id="print-canvas"></canvas>
                </div>
                <div class="print-specs-area">
                    <h3>${t("glassProperties")}</h3>
                    <div class="print-property">
                        <span class="print-property-label">${t("width")}:</span>
                        <span>${this.glass.width}mm</span>
                    </div>
                    <div class="print-property">
                        <span class="print-property-label">${t("height")}:</span>
                        <span>${this.glass.height}mm</span>
                    </div>
                    <div class="print-property">
                        <span class="print-property-label">${t("thickness")}:</span>
                        <span>${this.glass.thickness}mm</span>
                    </div>
                    <div class="print-property">
                        <span class="print-property-label">${t("totalHolesClips")}:</span>
                        <span>${this.holes.length}</span>
                    </div>

                    <h3 style="margin-top: 1.5rem;">${t("worksList")}</h3>
                    ${holesSpecHTML}
                </div>
            </div>
        `;

    // Insert into print template container
    const printContainer = document.getElementById("print-template");
    printContainer.innerHTML = printTemplate;

    // Render design to print canvas with dimension lines
    const printCanvas = document.getElementById("print-canvas");
    if (printCanvas) {
      // renderForPrint will set the canvas size with proper padding
      this.renderForPrint(printCanvas);
    }

    // Trigger print dialog
    window.print();
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

    // Load into designer
    designer.loadDesignData({
      glass: {
        width: design.width,
        height: design.height,
        thickness: design.thickness,
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

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("design-canvas")) {
    designer = new GlassDesigner("design-canvas");

    // Setup tool buttons
    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tool = btn.getAttribute("data-tool");
        if (tool) {
          designer.setTool(tool);
        }
      });
    });

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
function convertToBackendFormat(holes) {
  const elements = {
    shapes: [],
    holes: [],
    cuts: [],
    notes: [],
  };

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

    if (hole.shape === "clip") {
      // Edge clips are represented as notched cuts in the backend
      elements.cuts.push({
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
      });
    } else if (hole.shape === "circle" || hole.shape === "taladro") {
      // Circular holes (both regular circles and drill holes)
      elements.holes.push({
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
      });
    } else if (hole.shape === "avellanado") {
      // Countersink holes - currently stored as circular with inner diameter in tolerance
      // TODO: Backend should be enhanced to properly support countersink holes
      elements.holes.push({
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
      });
    } else if (hole.shape === "rectangle") {
      // Rectangular holes
      elements.holes.push({
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
      });
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
  const elements = convertToBackendFormat(designData.holes);

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
