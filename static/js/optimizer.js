/**
 * Vitrari - Sheet Optimization Algorithms and Utilities
 *
 * This module provides advanced algorithms for optimizing glass piece placement
 * on glass sheets to minimize waste and maximize material utilization.
 *
 * Features:
 * - Bottom-Left Fill (BLF) algorithm
 * - Genetic algorithm for complex optimization
 * - Greedy algorithm for quick approximation
 * - Bin packing utilities
 * - Performance analysis
 *
 * @author Vitrari Team
 * @version 1.0.0
 */

/**
 * Vitrari Optimizer Class
 * Main optimizer controller that manages algorithms and optimization state
 */
class GlassOptimizer {
  constructor() {
    this.algorithms = {
      blf: new BottomLeftFillAlgorithm(),
      genetic: new GeneticAlgorithm(),
      greedy: new GreedyAlgorithm(),
    };

    this.currentOptimization = null;
    this.optimizationHistory = [];
    this.settings = {
      allowRotation: true,
      allowFlipping: false,
      minimumGap: 2.0,
      edgeMargin: 5.0,
      timeLimit: 300,
      qualityTarget: 0.85,
    };
  }

  /**
   * Run optimization with specified algorithm
   */
  async optimize(designs, sheet, algorithm = "blf", options = {}) {
    const startTime = performance.now();

    // Merge options with defaults
    const opts = { ...this.settings, ...options };

    // Validate inputs
    if (!designs || designs.length === 0) {
      throw new Error("No designs provided for optimization");
    }

    if (!sheet) {
      throw new Error("No sheet specified for optimization");
    }

    if (!this.algorithms[algorithm]) {
      throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    try {
      // Prepare pieces for optimization
      const pieces = this.preparePieces(designs);

      // Run selected algorithm
      const result = await this.algorithms[algorithm].optimize(
        pieces,
        sheet,
        opts,
      );

      // Calculate statistics
      const statistics = this.calculateStatistics(result, sheet, pieces);

      // Generate cut paths
      const cutPaths = this.generateCutPaths(result.placedPieces, opts);

      const optimization = {
        id: Utils.generateId(),
        algorithm: algorithm,
        sheet: sheet,
        designs: designs,
        result: result,
        statistics: statistics,
        cutPaths: cutPaths,
        executionTime: (performance.now() - startTime) / 1000,
        timestamp: new Date().toISOString(),
        options: opts,
      };

      this.currentOptimization = optimization;
      this.optimizationHistory.push(optimization);

      return optimization;
    } catch (error) {
      throw new Error(`Optimization failed: ${error.message}`);
    }
  }

  /**
   * Prepare design pieces for optimization
   */
  preparePieces(designs) {
    const pieces = [];

    designs.forEach((design) => {
      for (let i = 0; i < design.quantity; i++) {
        pieces.push({
          id: `${design.design_id}-${i + 1}`,
          designId: design.design_id,
          designName: design.design?.name || `Design ${design.design_id}`,
          width: design.design?.width || design.width,
          height: design.design?.height || design.height,
          thickness: design.design?.thickness || design.thickness,
          area:
            (design.design?.width || design.width) *
            (design.design?.height || design.height),
          priority: design.priority || 1,
          elements: design.design?.elements || {},
          placed: false,
          x: 0,
          y: 0,
          rotation: 0,
          flipped: false,
        });
      }
    });

    return pieces;
  }

  /**
   * Calculate optimization statistics
   */
  calculateStatistics(result, sheet, pieces) {
    const sheetArea = sheet.width * sheet.height;
    const totalPieceArea = pieces.reduce((sum, piece) => sum + piece.area, 0);
    const usedArea = result.placedPieces.reduce(
      (sum, piece) => sum + piece.area,
      0,
    );
    const wasteArea = sheetArea - usedArea;

    return {
      totalPieces: pieces.length,
      placedPieces: result.placedPieces.length,
      unplacedPieces: pieces.length - result.placedPieces.length,
      sheetArea: sheetArea,
      totalPieceArea: totalPieceArea,
      usedArea: usedArea,
      wasteArea: wasteArea,
      utilizationRate: (usedArea / sheetArea) * 100,
      wasteRate: (wasteArea / sheetArea) * 100,
      materialEfficiency:
        totalPieceArea > 0 ? (usedArea / totalPieceArea) * 100 : 0,
      density: (result.placedPieces.length / sheetArea) * 1000000, // pieces per m²
      largestWaste: this.calculateLargestWasteArea(result, sheet),
    };
  }

  /**
   * Calculate largest continuous waste area
   */
  calculateLargestWasteArea(result, sheet) {
    // Simplified calculation - in practice would use more complex geometry
    const occupiedAreas = result.placedPieces.map((piece) => ({
      x: piece.x,
      y: piece.y,
      width: piece.width,
      height: piece.height,
    }));

    // Find largest empty rectangle (simplified)
    let maxWasteArea = 0;
    const resolution = 50; // Grid resolution for waste calculation

    for (let x = 0; x < sheet.width; x += resolution) {
      for (let y = 0; y < sheet.height; y += resolution) {
        if (!this.isPositionOccupied(x, y, occupiedAreas)) {
          const wasteRect = this.findMaxEmptyRectangle(
            x,
            y,
            sheet,
            occupiedAreas,
            resolution,
          );
          maxWasteArea = Math.max(
            maxWasteArea,
            wasteRect.width * wasteRect.height,
          );
        }
      }
    }

    return maxWasteArea;
  }

  /**
   * Check if position is occupied by any piece
   */
  isPositionOccupied(x, y, occupiedAreas) {
    return occupiedAreas.some(
      (area) =>
        x >= area.x &&
        x < area.x + area.width &&
        y >= area.y &&
        y < area.y + area.height,
    );
  }

  /**
   * Find maximum empty rectangle from given position
   */
  findMaxEmptyRectangle(startX, startY, sheet, occupiedAreas, resolution) {
    let maxWidth = 0;
    let maxHeight = 0;

    // Find maximum width
    for (let x = startX; x < sheet.width; x += resolution) {
      if (this.isPositionOccupied(x, startY, occupiedAreas)) {
        break;
      }
      maxWidth = x - startX + resolution;
    }

    // Find maximum height
    for (let y = startY; y < sheet.height; y += resolution) {
      if (this.isPositionOccupied(startX, y, occupiedAreas)) {
        break;
      }
      maxHeight = y - startY + resolution;
    }

    return { width: maxWidth, height: maxHeight };
  }

  /**
   * Generate optimal cut paths
   */
  generateCutPaths(placedPieces, options) {
    const cutPaths = [];
    let pathId = 1;

    // Sort pieces by position for efficient cutting
    const sortedPieces = [...placedPieces].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 10) return a.y - b.y; // Different rows
      return a.x - b.x; // Same row, sort by x
    });

    sortedPieces.forEach((piece) => {
      // Generate rectangular cut path for each piece
      const margin = options.minimumGap / 2;

      // Bottom edge
      cutPaths.push({
        id: `cut-${pathId++}`,
        type: "horizontal",
        startX: piece.x - margin,
        startY: piece.y - margin,
        endX: piece.x + piece.width + margin,
        endY: piece.y - margin,
        order: pathId,
        toolType: "straight",
        speed: 100,
        pieces: [piece.id],
      });

      // Right edge
      cutPaths.push({
        id: `cut-${pathId++}`,
        type: "vertical",
        startX: piece.x + piece.width + margin,
        startY: piece.y - margin,
        endX: piece.x + piece.width + margin,
        endY: piece.y + piece.height + margin,
        order: pathId,
        toolType: "straight",
        speed: 100,
        pieces: [piece.id],
      });

      // Top edge
      cutPaths.push({
        id: `cut-${pathId++}`,
        type: "horizontal",
        startX: piece.x + piece.width + margin,
        startY: piece.y + piece.height + margin,
        endX: piece.x - margin,
        endY: piece.y + piece.height + margin,
        order: pathId,
        toolType: "straight",
        speed: 100,
        pieces: [piece.id],
      });

      // Left edge
      cutPaths.push({
        id: `cut-${pathId++}`,
        type: "vertical",
        startX: piece.x - margin,
        startY: piece.y + piece.height + margin,
        endX: piece.x - margin,
        endY: piece.y - margin,
        order: pathId,
        toolType: "straight",
        speed: 100,
        pieces: [piece.id],
      });
    });

    return this.optimizeCutPaths(cutPaths);
  }

  /**
   * Optimize cut paths to minimize tool movement
   */
  optimizeCutPaths(cutPaths) {
    // Implement traveling salesman-style optimization for cut path order
    // For now, return paths sorted by proximity

    if (cutPaths.length === 0) return cutPaths;

    const optimizedPaths = [];
    let currentPos = { x: 0, y: 0 };
    let remainingPaths = [...cutPaths];

    while (remainingPaths.length > 0) {
      // Find closest unvisited path
      let closestIndex = 0;
      let minDistance = Infinity;

      remainingPaths.forEach((path, index) => {
        const distance = Math.sqrt(
          Math.pow(path.startX - currentPos.x, 2) +
            Math.pow(path.startY - currentPos.y, 2),
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      // Add closest path to optimized list
      const selectedPath = remainingPaths.splice(closestIndex, 1)[0];
      selectedPath.order = optimizedPaths.length + 1;
      optimizedPaths.push(selectedPath);

      // Update current position
      currentPos = { x: selectedPath.endX, y: selectedPath.endY };
    }

    return optimizedPaths;
  }

  /**
   * Compare multiple optimization results
   */
  compareOptimizations(optimizations) {
    if (!optimizations || optimizations.length < 2) {
      throw new Error("At least two optimizations required for comparison");
    }

    const comparison = {
      optimizations: optimizations.map((opt) => ({
        id: opt.id,
        algorithm: opt.algorithm,
        utilizationRate: opt.statistics.utilizationRate,
        wasteRate: opt.statistics.wasteRate,
        placedPieces: opt.statistics.placedPieces,
        executionTime: opt.executionTime,
        materialEfficiency: opt.statistics.materialEfficiency,
      })),
      bestUtilization: null,
      bestEfficiency: null,
      fastest: null,
    };

    // Find best performers
    let bestUtil = -1,
      bestEff = -1,
      fastestTime = Infinity;

    comparison.optimizations.forEach((opt, index) => {
      if (opt.utilizationRate > bestUtil) {
        bestUtil = opt.utilizationRate;
        comparison.bestUtilization = { index, ...opt };
      }
      if (opt.materialEfficiency > bestEff) {
        bestEff = opt.materialEfficiency;
        comparison.bestEfficiency = { index, ...opt };
      }
      if (opt.executionTime < fastestTime) {
        fastestTime = opt.executionTime;
        comparison.fastest = { index, ...opt };
      }
    });

    return comparison;
  }

  /**
   * Export optimization results in various formats
   */
  exportOptimization(optimization, format = "json") {
    switch (format) {
      case "json":
        return this.exportJSON(optimization);
      case "svg":
        return this.exportSVG(optimization);
      case "dxf":
        return this.exportDXF(optimization);
      case "csv":
        return this.exportCSV(optimization);
      case "cutting_list":
        return this.exportCuttingList(optimization);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export as JSON
   */
  exportJSON(optimization) {
    return {
      data: JSON.stringify(optimization, null, 2),
      filename: `optimization_${optimization.id}.json`,
      mimeType: "application/json",
    };
  }

  /**
   * Export as SVG
   */
  exportSVG(optimization) {
    const svg = this.generateSVGLayout(optimization);
    return {
      data: svg,
      filename: `optimization_layout_${optimization.id}.svg`,
      mimeType: "image/svg+xml",
    };
  }

  /**
   * Generate SVG representation of optimization layout
   */
  generateSVGLayout(optimization) {
    const { sheet, result } = optimization;
    const scale = 0.1; // Scale down for reasonable SVG size
    const margin = 10;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${sheet.width * scale + 2 * margin}" height="${sheet.height * scale + 2 * margin}"
     xmlns="http://www.w3.org/2000/svg">
    <defs>
        <style>
            .sheet { fill: #f0f0f0; stroke: #333; stroke-width: 2; }
            .piece { fill: #e3f2fd; stroke: #1976d2; stroke-width: 1; opacity: 0.8; }
            .piece-text { font-family: Arial, sans-serif; font-size: 8px; text-anchor: middle; }
            .cut-line { stroke: #f44336; stroke-width: 0.5; stroke-dasharray: 2,1; }
            .waste { fill: #ffebee; opacity: 0.5; }
        </style>
    </defs>

    <!-- Sheet boundary -->
    <rect class="sheet" x="${margin}" y="${margin}"
          width="${sheet.width * scale}" height="${sheet.height * scale}"/>

    <!-- Placed pieces -->`;

    result.placedPieces.forEach((piece) => {
      const x = piece.x * scale + margin;
      const y = piece.y * scale + margin;
      const width = piece.width * scale;
      const height = piece.height * scale;

      svg += `
    <rect class="piece" x="${x}" y="${y}" width="${width}" height="${height}"/>
    <text class="piece-text" x="${x + width / 2}" y="${y + height / 2 + 2}">${piece.designName}</text>`;
    });

    // Add cut paths
    optimization.cutPaths?.forEach((path) => {
      if (path.type === "horizontal") {
        svg += `
    <line class="cut-line" x1="${path.startX * scale + margin}" y1="${path.startY * scale + margin}"
          x2="${path.endX * scale + margin}" y2="${path.endY * scale + margin}"/>`;
      }
    });

    svg += `

    <!-- Statistics -->
    <text x="${margin}" y="${sheet.height * scale + margin + 20}"
          font-family="Arial, sans-serif" font-size="10" fill="#333">
        Utilization: ${optimization.statistics.utilizationRate.toFixed(1)}% |
        Waste: ${optimization.statistics.wasteRate.toFixed(1)}% |
        Pieces: ${optimization.statistics.placedPieces}/${optimization.statistics.totalPieces}
    </text>

</svg>`;

    return svg;
  }

  /**
   * Export as DXF (simplified)
   */
  exportDXF(optimization) {
    let dxf = `0
SECTION
2
ENTITIES
`;

    optimization.result.placedPieces.forEach((piece) => {
      // Add rectangle entity for each piece
      dxf += `0
LWPOLYLINE
8
0
90
4
70
1
`;
      // Add vertices
      dxf += `10
${piece.x.toFixed(2)}
20
${piece.y.toFixed(2)}
10
${(piece.x + piece.width).toFixed(2)}
20
${piece.y.toFixed(2)}
10
${(piece.x + piece.width).toFixed(2)}
20
${(piece.y + piece.height).toFixed(2)}
10
${piece.x.toFixed(2)}
20
${(piece.y + piece.height).toFixed(2)}
`;
    });

    dxf += `0
ENDSEC
0
EOF
`;

    return {
      data: dxf,
      filename: `optimization_${optimization.id}.dxf`,
      mimeType: "application/dxf",
    };
  }

  /**
   * Export cutting list
   */
  exportCuttingList(optimization) {
    let list = `GLASS CUTTING OPTIMIZATION REPORT
Generated: ${new Date().toLocaleString()}
Algorithm: ${optimization.algorithm.toUpperCase()}

SHEET SPECIFICATIONS:
- Dimensions: ${optimization.sheet.width} × ${optimization.sheet.height} × ${optimization.sheet.thickness}mm
- Area: ${Utils.formatArea(optimization.sheet.width * optimization.sheet.height)}
- Material: ${optimization.sheet.material || "Standard Glass"}

OPTIMIZATION RESULTS:
- Utilization Rate: ${optimization.statistics.utilizationRate.toFixed(2)}%
- Waste Rate: ${optimization.statistics.wasteRate.toFixed(2)}%
- Material Efficiency: ${optimization.statistics.materialEfficiency.toFixed(2)}%
- Execution Time: ${optimization.executionTime.toFixed(2)} seconds

CUTTING LIST:
Piece#  Design Name           Dimensions (mm)      Position (X,Y)       Rotation
${"─".repeat(80)}
`;

    optimization.result.placedPieces.forEach((piece, index) => {
      const pieceNum = String(index + 1).padStart(6, " ");
      const name = piece.designName.padEnd(20, " ");
      const dims =
        `${Math.round(piece.width)}×${Math.round(piece.height)}×${Math.round(piece.thickness || 6)}`.padEnd(
          16,
          " ",
        );
      const pos = `(${Math.round(piece.x)},${Math.round(piece.y)})`.padEnd(
        16,
        " ",
      );
      const rot = `${piece.rotation || 0}°`;

      list += `${pieceNum}  ${name} ${dims} ${pos} ${rot}\n`;
    });

    list += `
${"─".repeat(80)}
Total Pieces: ${optimization.result.placedPieces.length}
Unplaced Pieces: ${optimization.statistics.unplacedPieces}

WASTE ANALYSIS:
- Total Waste Area: ${Utils.formatArea(optimization.statistics.wasteArea)}
- Largest Waste Section: ${Utils.formatArea(optimization.statistics.largestWaste)}
- Material Cost Waste: $${(((optimization.statistics.wasteRate / 100) * (optimization.sheet.price_per_sqm || 50) * optimization.sheet.width * optimization.sheet.height) / 1000000).toFixed(2)}

CUTTING INSTRUCTIONS:
- Total Cutting Length: ${
      optimization.cutPaths
        ?.reduce((sum, path) => {
          const dx = path.endX - path.startX;
          const dy = path.endY - path.startY;
          return sum + Math.sqrt(dx * dx + dy * dy);
        }, 0)
        .toFixed(0) || 0
    }mm
- Estimated Cutting Time: ${Math.round((optimization.cutPaths?.length || 0) * 0.5)} minutes
- Recommended Tool: Diamond scoring wheel
- Cutting Speed: 100mm/min

END OF REPORT
`;

    return {
      data: list,
      filename: `cutting_list_${optimization.id}.txt`,
      mimeType: "text/plain",
    };
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory() {
    return this.optimizationHistory.map((opt) => ({
      id: opt.id,
      algorithm: opt.algorithm,
      timestamp: opt.timestamp,
      utilizationRate: opt.statistics.utilizationRate,
      wasteRate: opt.statistics.wasteRate,
      executionTime: opt.executionTime,
      pieceCount: opt.statistics.totalPieces,
    }));
  }

  /**
   * Clear optimization history
   */
  clearHistory() {
    this.optimizationHistory = [];
    this.currentOptimization = null;
  }

  /**
   * Get current optimization
   */
  getCurrentOptimization() {
    return this.currentOptimization;
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }
}

/**
 * Bottom-Left Fill Algorithm Implementation
 */
class BottomLeftFillAlgorithm {
  async optimize(pieces, sheet, options) {
    const placedPieces = [];
    const availableSpaces = [
      {
        x: options.edgeMargin,
        y: options.edgeMargin,
        width: sheet.width - 2 * options.edgeMargin,
        height: sheet.height - 2 * options.edgeMargin,
      },
    ];

    // Sort pieces by area (largest first)
    const sortedPieces = [...pieces].sort((a, b) => b.area - a.area);

    for (const piece of sortedPieces) {
      const placement = this.findBottomLeftPosition(
        piece,
        availableSpaces,
        options,
      );

      if (placement) {
        const placedPiece = {
          ...piece,
          x: placement.x,
          y: placement.y,
          width: placement.width,
          height: placement.height,
          rotation: placement.rotation,
          placed: true,
        };

        placedPieces.push(placedPiece);

        // Update available spaces
        this.updateAvailableSpaces(
          availableSpaces,
          placement,
          options.minimumGap,
        );
      }
    }

    return { placedPieces, availableSpaces };
  }

  findBottomLeftPosition(piece, availableSpaces, options) {
    const orientations = this.getOrientations(piece, options);
    let bestPlacement = null;
    let bestScore = Infinity;

    for (const space of availableSpaces) {
      for (const orientation of orientations) {
        if (
          orientation.width <= space.width &&
          orientation.height <= space.height
        ) {
          const placement = {
            x: space.x,
            y: space.y,
            width: orientation.width,
            height: orientation.height,
            rotation: orientation.rotation,
          };

          // Calculate bottom-left score (lower is better)
          const score = placement.x + placement.y;

          if (score < bestScore) {
            bestScore = score;
            bestPlacement = placement;
          }
        }
      }
    }

    return bestPlacement;
  }

  getOrientations(piece, options) {
    const orientations = [
      {
        width: piece.width,
        height: piece.height,
        rotation: 0,
      },
    ];

    if (options.allowRotation) {
      orientations.push({
        width: piece.height,
        height: piece.width,
        rotation: 90,
      });
    }

    return orientations;
  }

  updateAvailableSpaces(availableSpaces, placement, minimumGap) {
    const newSpaces = [];

    for (let i = availableSpaces.length - 1; i >= 0; i--) {
      const space = availableSpaces[i];

      if (this.rectanglesIntersect(space, placement)) {
        // Remove intersecting space and create new spaces around the placement
        availableSpaces.splice(i, 1);

        const splitSpaces = this.splitSpace(space, placement, minimumGap);
        newSpaces.push(...splitSpaces);
      }
    }

    availableSpaces.push(...newSpaces);

    // Remove spaces that are too small
    return availableSpaces.filter(
      (space) => space.width >= 10 && space.height >= 10,
    );
  }

  rectanglesIntersect(rect1, rect2) {
    return !(
      rect1.x + rect1.width <= rect2.x ||
      rect2.x + rect2.width <= rect1.x ||
      rect1.y + rect1.height <= rect2.y ||
      rect2.y + rect2.height <= rect1.y
    );
  }

  splitSpace(space, placement, gap) {
    const spaces = [];

    // Left space
    if (placement.x > space.x) {
      spaces.push({
        x: space.x,
        y: space.y,
        width: placement.x - space.x - gap,
        height: space.height,
      });
    }

    // Right space
    if (placement.x + placement.width < space.x + space.width) {
      spaces.push({
        x: placement.x + placement.width + gap,
        y: space.y,
        width: space.x + space.width - placement.x - placement.width - gap,
        height: space.height,
      });
    }

    // Bottom space
    if (placement.y > space.y) {
      spaces.push({
        x: space.x,
        y: space.y,
        width: space.width,
        height: placement.y - space.y - gap,
      });
    }

    // Top space
    if (placement.y + placement.height < space.y + space.height) {
      spaces.push({
        x: space.x,
        y: placement.y + placement.height + gap,
        width: space.width,
        height: space.y + space.height - placement.y - placement.height - gap,
      });
    }

    return spaces.filter((s) => s.width > 0 && s.height > 0);
  }
}

/**
 * Genetic Algorithm Implementation
 */
class GeneticAlgorithm {
  constructor() {
    this.populationSize = 50;
    this.maxGenerations = 100;
    this.mutationRate = 0.1;
    this.crossoverRate = 0.8;
    this.eliteSize = 5;
  }

  async optimize(pieces, sheet, options) {
    // Initialize population
    let population = this.createInitialPopulation(pieces, sheet, options);

    let bestIndividual = null;
    let bestFitness = -1;

    for (let generation = 0; generation < this.maxGenerations; generation++) {
      // Evaluate fitness
      population = population.map((individual) => {
        individual.fitness = this.evaluateFitness(individual, sheet);
        return individual;
      });

      // Sort by fitness
      population.sort((a, b) => b.fitness - a.fitness);

      // Track best individual
      if (population[0].fitness > bestFitness) {
        bestFitness = population[0].fitness;
        bestIndividual = { ...population[0] };
      }

      // Create next generation
      const newPopulation = [];

      // Keep elite individuals
      for (let i = 0; i < this.eliteSize; i++) {
        newPopulation.push({ ...population[i] });
      }

      // Generate offspring
      while (newPopulation.length < this.populationSize) {
        const parent1 = this.tournamentSelection(population);
        const parent2 = this.tournamentSelection(population);

        let offspring1, offspring2;
        if (Math.random() < this.crossoverRate) {
          [offspring1, offspring2] = this.crossover(parent1, parent2);
        } else {
          offspring1 = { ...parent1 };
          offspring2 = { ...parent2 };
        }

        if (Math.random() < this.mutationRate) {
          this.mutate(offspring1, sheet, options);
        }
        if (Math.random() < this.mutationRate) {
          this.mutate(offspring2, sheet, options);
        }

        newPopulation.push(offspring1);
        if (newPopulation.length < this.populationSize) {
          newPopulation.push(offspring2);
        }
      }

      population = newPopulation;

      // Early termination if target reached
      if (bestFitness >= options.qualityTarget * 100) {
        break;
      }
    }

    return {
      placedPieces: bestIndividual.pieces.filter((p) => p.placed),
      fitness: bestFitness,
      generations: this.maxGenerations,
    };
  }

  createInitialPopulation(pieces, sheet, options) {
    const population = [];

    for (let i = 0; i < this.populationSize; i++) {
      const individual = {
        pieces: pieces.map((piece) => ({ ...piece })),
        fitness: 0,
      };

      // Use different placement strategies for diversity
      if (i % 3 === 0) {
        this.randomPlacement(individual, sheet, options);
      } else if (i % 3 === 1) {
        this.greedyPlacement(individual, sheet, options);
      } else {
        this.bottomLeftPlacement(individual, sheet, options);
      }

      population.push(individual);
    }

    return population;
  }

  randomPlacement(individual, sheet, options) {
    const margin = options.edgeMargin;
    const gap = options.minimumGap;

    individual.pieces.forEach((piece) => {
      const maxX = sheet.width - piece.width - margin;
      const maxY = sheet.height - piece.height - margin;

      if (maxX > margin && maxY > margin) {
        piece.x = margin + Math.random() * (maxX - margin);
        piece.y = margin + Math.random() * (maxY - margin);
      } else {
        piece.x = margin;
        piece.y = margin;
      }
    });
  }
}
