package services

import (
	"fmt"
	"log/slog"
	"math"
	"math/rand"
	"sort"
	"time"

	"glass-optimizer/internal/models"
	"glass-optimizer/internal/storage"
)

// OptimizerService handles business logic for optimization operations
type OptimizerService struct {
	storage storage.Storage
	logger  *slog.Logger
}

// NewOptimizerService creates a new optimizer service instance
func NewOptimizerService(storage storage.Storage, logger *slog.Logger) *OptimizerService {
	return &OptimizerService{
		storage: storage,
		logger:  logger,
	}
}

// RunOptimization executes the optimization algorithm on a set of designs
func (s *OptimizerService) RunOptimization(req *models.OptimizationRequest) (*models.Optimization, error) {
	s.logger.Info("Starting optimization", "name", req.Name, "algorithm", req.Algorithm)
	startTime := time.Now()

	// Validate request
	if err := s.validateOptimizationRequest(req); err != nil {
		return nil, err
	}

	// Get glass sheet information
	sheet, err := s.storage.GetGlassSheet(req.SheetID)
	if err != nil {
		return nil, err
	}

	// Load design information
	designs, err := s.loadDesignsForOptimization(req.Designs)
	if err != nil {
		return nil, err
	}

	// Create optimization instance
	optimization := &models.Optimization{
		Name:      req.Name,
		SheetID:   req.SheetID,
		Sheet:     sheet,
		Algorithm: req.Algorithm,
	}

	// Set design list
	optimization.DesignList = make([]models.DesignItem, len(req.Designs))
	for i, designReq := range req.Designs {
		optimization.DesignList[i] = models.DesignItem{
			DesignID: designReq.DesignID,
			Design:   designs[designReq.DesignID],
			Quantity: designReq.Quantity,
			Priority: designReq.Priority,
		}
	}

	// Apply default options if not provided
	options := req.Options
	if options.MinimumGap == 0 {
		options.MinimumGap = 2.0 // 2mm default gap
	}
	if options.EdgeMargin == 0 {
		options.EdgeMargin = 5.0 // 5mm default margin
	}

	// Run optimization algorithm
	layout, err := s.runOptimizationAlgorithm(req.Algorithm, sheet, designs, req.Designs, &options)
	if err != nil {
		return nil, err
	}

	// Set results
	optimization.Layout = *layout
	optimization.UsedArea = s.calculateUsedArea(layout.Pieces, designs)
	optimization.TotalArea = sheet.Area()
	optimization.ExecutionTime = time.Since(startTime).Seconds()

	// Calculate statistics
	optimization.CalculateStatistics()

	// Save optimization
	if err := s.storage.CreateOptimization(optimization); err != nil {
		s.logger.Error("Failed to save optimization", "error", err)
		return nil, err
	}

	s.logger.Info("Optimization completed successfully",
		"id", optimization.ID,
		"utilization", fmt.Sprintf("%.2f%%", optimization.Layout.Statistics.UtilizationRate),
		"execution_time", fmt.Sprintf("%.3fs", optimization.ExecutionTime))

	return optimization, nil
}

// GetOptimization retrieves an optimization by ID
func (s *OptimizerService) GetOptimization(id int) (*models.Optimization, error) {
	return s.storage.GetOptimization(id)
}

// GetOptimizations retrieves optimizations with pagination
func (s *OptimizerService) GetOptimizations(limit, offset int) (*OptimizationListResponse, error) {
	optimizations, total, err := s.storage.GetOptimizations(limit, offset)
	if err != nil {
		return nil, err
	}

	return &OptimizationListResponse{
		Optimizations: optimizations,
		Total:         total,
		Limit:         limit,
		Offset:        offset,
	}, nil
}

// ExportOptimization generates cutting instructions for an optimization
func (s *OptimizerService) ExportOptimization(id int, format string) (*ExportResult, error) {
	optimization, err := s.storage.GetOptimization(id)
	if err != nil {
		return nil, err
	}

	switch format {
	case "json":
		return s.exportAsJSON(optimization)
	case "svg":
		return s.exportAsSVG(optimization)
	case "dxf":
		return s.exportAsDXF(optimization)
	case "cutting_list":
		return s.exportAsCuttingList(optimization)
	default:
		return nil, models.NewValidationError("unsupported export format")
	}
}

// Private methods

func (s *OptimizerService) validateOptimizationRequest(req *models.OptimizationRequest) error {
	if req.Name == "" {
		return models.NewValidationError("name is required")
	}
	if req.SheetID <= 0 {
		return models.NewValidationError("sheet_id must be positive")
	}
	if len(req.Designs) == 0 {
		return models.NewValidationError("at least one design is required")
	}

	// Validate algorithm
	validAlgorithms := []string{"blf", "genetic", "greedy", "custom"}
	models.ValidateEnum(req.Algorithm, validAlgorithms, "algorithm", &models.ValidationErrors{})

	return nil
}

func (s *OptimizerService) loadDesignsForOptimization(designRequests []models.DesignItem) (map[int]*models.Design, error) {
	designs := make(map[int]*models.Design)

	for _, req := range designRequests {
		if _, exists := designs[req.DesignID]; !exists {
			design, err := s.storage.GetDesign(req.DesignID)
			if err != nil {
				return nil, fmt.Errorf("failed to load design %d: %w", req.DesignID, err)
			}
			designs[req.DesignID] = design
		}
	}

	return designs, nil
}

func (s *OptimizerService) runOptimizationAlgorithm(algorithm string, sheet *models.GlassSheet, designs map[int]*models.Design, designRequests []models.DesignItem, options *models.OptimizeOptions) (*models.Layout, error) {
	switch algorithm {
	case "blf":
		return s.runBottomLeftFill(sheet, designs, designRequests, options)
	case "genetic":
		return s.runGeneticAlgorithm(sheet, designs, designRequests, options)
	case "greedy":
		return s.runGreedyAlgorithm(sheet, designs, designRequests, options)
	default:
		return nil, models.NewValidationError("unsupported algorithm: " + algorithm)
	}
}

// Bottom-Left Fill Algorithm
func (s *OptimizerService) runBottomLeftFill(sheet *models.GlassSheet, designs map[int]*models.Design, designRequests []models.DesignItem, options *models.OptimizeOptions) (*models.Layout, error) {
	s.logger.Debug("Running Bottom-Left Fill algorithm")

	layout := &models.Layout{
		SheetWidth:  sheet.Width,
		SheetHeight: sheet.Height,
		Pieces:      []models.PlacedPiece{},
		CutPaths:    []models.CutPath{},
	}

	// Create list of pieces to place
	pieces := s.createPieceList(designs, designRequests)

	// Sort pieces by area (largest first) or by specified criteria
	s.sortPieces(pieces, options.SortBy, options.SortOrder)

	// Available space tracking
	availableSpaces := []Rectangle{{X: options.EdgeMargin, Y: options.EdgeMargin,
		Width: sheet.Width - 2*options.EdgeMargin, Height: sheet.Height - 2*options.EdgeMargin}}

	for _, piece := range pieces {
		design := designs[piece.DesignID]
		placed := false

		// Try different orientations if rotation is allowed
		orientations := s.getOrientations(design, options.AllowRotation)

		for _, orientation := range orientations {
			pieceWidth, pieceHeight := orientation.Width, orientation.Height

			// Find best position using bottom-left heuristic
			bestPos := s.findBottomLeftPosition(availableSpaces, pieceWidth, pieceHeight, options.MinimumGap)

			if bestPos != nil {
				// Place the piece
				placedPiece := models.PlacedPiece{
					ID:         models.GenerateID(),
					DesignID:   piece.DesignID,
					DesignName: design.Name,
					X:          bestPos.X,
					Y:          bestPos.Y,
					Width:      pieceWidth,
					Height:     pieceHeight,
					Rotation:   orientation.Rotation,
				}

				layout.Pieces = append(layout.Pieces, placedPiece)

				// Update available spaces
				availableSpaces = s.updateAvailableSpaces(availableSpaces, Rectangle{
					X: bestPos.X, Y: bestPos.Y, Width: pieceWidth, Height: pieceHeight,
				})

				placed = true
				break
			}
		}

		if !placed {
			s.logger.Warn("Could not place piece", "design_id", piece.DesignID, "name", design.Name)
		}
	}

	// Generate cut paths
	layout.CutPaths = s.generateCutPaths(layout.Pieces)

	return layout, nil
}

// Greedy Algorithm (simpler, faster)
func (s *OptimizerService) runGreedyAlgorithm(sheet *models.GlassSheet, designs map[int]*models.Design, designRequests []models.DesignItem, options *models.OptimizeOptions) (*models.Layout, error) {
	s.logger.Debug("Running Greedy algorithm")

	layout := &models.Layout{
		SheetWidth:  sheet.Width,
		SheetHeight: sheet.Height,
		Pieces:      []models.PlacedPiece{},
		CutPaths:    []models.CutPath{},
	}

	pieces := s.createPieceList(designs, designRequests)
	s.sortPieces(pieces, "area", "desc") // Always sort by area for greedy

	currentX, currentY := options.EdgeMargin, options.EdgeMargin
	rowHeight := 0.0

	for _, piece := range pieces {
		design := designs[piece.DesignID]
		pieceWidth, pieceHeight := design.Width, design.Height

		// Check if piece fits in current row
		if currentX+pieceWidth+options.EdgeMargin <= sheet.Width {
			// Place in current row
			placedPiece := models.PlacedPiece{
				ID:         models.GenerateID(),
				DesignID:   piece.DesignID,
				DesignName: design.Name,
				X:          currentX,
				Y:          currentY,
				Width:      pieceWidth,
				Height:     pieceHeight,
				Rotation:   0,
			}

			layout.Pieces = append(layout.Pieces, placedPiece)

			currentX += pieceWidth + options.MinimumGap
			if pieceHeight > rowHeight {
				rowHeight = pieceHeight
			}
		} else {
			// Start new row
			currentX = options.EdgeMargin
			currentY += rowHeight + options.MinimumGap
			rowHeight = 0

			// Check if new row fits
			if currentY+pieceHeight+options.EdgeMargin <= sheet.Height {
				placedPiece := models.PlacedPiece{
					ID:         models.GenerateID(),
					DesignID:   piece.DesignID,
					DesignName: design.Name,
					X:          currentX,
					Y:          currentY,
					Width:      pieceWidth,
					Height:     pieceHeight,
					Rotation:   0,
				}

				layout.Pieces = append(layout.Pieces, placedPiece)

				currentX += pieceWidth + options.MinimumGap
				rowHeight = pieceHeight
			} else {
				s.logger.Warn("Could not place piece", "design_id", piece.DesignID, "name", design.Name)
			}
		}
	}

	layout.CutPaths = s.generateCutPaths(layout.Pieces)
	return layout, nil
}

// Genetic Algorithm (for complex optimization)
func (s *OptimizerService) runGeneticAlgorithm(sheet *models.GlassSheet, designs map[int]*models.Design, designRequests []models.DesignItem, options *models.OptimizeOptions) (*models.Layout, error) {
	s.logger.Debug("Running Genetic algorithm")

	// Initialize random seed
	rand.Seed(time.Now().UnixNano())

	pieces := s.createPieceList(designs, designRequests)
	populationSize := options.PopulationSize
	if populationSize == 0 {
		populationSize = 50
	}

	maxGenerations := options.MaxIterations
	if maxGenerations == 0 {
		maxGenerations = 100
	}

	// Create initial population
	population := make([]*GeneticIndividual, populationSize)
	for i := 0; i < populationSize; i++ {
		individual := s.createRandomIndividual(pieces, sheet, options)
		individual.Fitness = s.evaluateFitness(individual, sheet)
		population[i] = individual
	}

	bestIndividual := population[0]

	// Evolution loop
	for generation := 0; generation < maxGenerations; generation++ {
		// Sort by fitness
		sort.Slice(population, func(i, j int) bool {
			return population[i].Fitness > population[j].Fitness
		})

		// Track best individual
		if population[0].Fitness > bestIndividual.Fitness {
			bestIndividual = population[0]
		}

		// Create new generation
		newPopulation := make([]*GeneticIndividual, populationSize)

		// Keep best individuals (elitism)
		eliteCount := populationSize / 4
		for i := 0; i < eliteCount; i++ {
			newPopulation[i] = s.cloneIndividual(population[i])
		}

		// Generate offspring
		for i := eliteCount; i < populationSize; i++ {
			parent1 := s.tournamentSelection(population)
			parent2 := s.tournamentSelection(population)

			offspring := s.crossover(parent1, parent2, options)
			s.mutate(offspring, options)
			offspring.Fitness = s.evaluateFitness(offspring, sheet)

			newPopulation[i] = offspring
		}

		population = newPopulation

		if generation%10 == 0 {
			s.logger.Debug("Genetic algorithm progress",
				"generation", generation,
				"best_fitness", fmt.Sprintf("%.2f", bestIndividual.Fitness))
		}
	}

	// Convert best individual to layout
	return s.individualToLayout(bestIndividual, sheet, designs), nil
}

// Helper types and methods

type Rectangle struct {
	X, Y, Width, Height float64
}

type PieceToPlace struct {
	DesignID int
	Quantity int
	Priority int
}

type Orientation struct {
	Width, Height float64
	Rotation      int
}

type GeneticIndividual struct {
	Pieces  []GeneticPiece
	Fitness float64
}

type GeneticPiece struct {
	DesignID int
	X, Y     float64
	Width    float64
	Height   float64
	Rotation int
}

func (s *OptimizerService) createPieceList(designs map[int]*models.Design, designRequests []models.DesignItem) []PieceToPlace {
	var pieces []PieceToPlace

	for _, req := range designRequests {
		for i := 0; i < req.Quantity; i++ {
			pieces = append(pieces, PieceToPlace{
				DesignID: req.DesignID,
				Quantity: 1,
				Priority: req.Priority,
			})
		}
	}

	return pieces
}

func (s *OptimizerService) sortPieces(pieces []PieceToPlace, sortBy, sortOrder string) {
	// For now, implement basic sorting - can be enhanced with more criteria
	sort.Slice(pieces, func(i, j int) bool {
		if sortOrder == "desc" {
			return pieces[i].Priority > pieces[j].Priority
		}
		return pieces[i].Priority < pieces[j].Priority
	})
}

func (s *OptimizerService) getOrientations(design *models.Design, allowRotation bool) []Orientation {
	orientations := []Orientation{
		{Width: design.Width, Height: design.Height, Rotation: 0},
	}

	if allowRotation {
		orientations = append(orientations, Orientation{
			Width: design.Height, Height: design.Width, Rotation: 90,
		})
	}

	return orientations
}

func (s *OptimizerService) findBottomLeftPosition(availableSpaces []Rectangle, width, height, gap float64) *Rectangle {
	var bestPosition *Rectangle
	minY := math.MaxFloat64
	minX := math.MaxFloat64

	for _, space := range availableSpaces {
		if space.Width >= width && space.Height >= height {
			// Check if this position is more bottom-left than current best
			if space.Y < minY || (space.Y == minY && space.X < minX) {
				bestPosition = &Rectangle{X: space.X, Y: space.Y, Width: width, Height: height}
				minY = space.Y
				minX = space.X
			}
		}
	}

	return bestPosition
}

func (s *OptimizerService) updateAvailableSpaces(spaces []Rectangle, placedPiece Rectangle) []Rectangle {
	var newSpaces []Rectangle

	for _, space := range spaces {
		// Check if placed piece intersects with this space
		if s.rectanglesIntersect(space, placedPiece) {
			// Split the space around the placed piece
			splitSpaces := s.splitRectangle(space, placedPiece)
			newSpaces = append(newSpaces, splitSpaces...)
		} else {
			// Keep the space as is
			newSpaces = append(newSpaces, space)
		}
	}

	// Remove spaces that are too small to be useful
	return s.filterSmallSpaces(newSpaces, 10.0) // Minimum 10mm spaces
}

func (s *OptimizerService) rectanglesIntersect(a, b Rectangle) bool {
	return !(a.X+a.Width <= b.X || b.X+b.Width <= a.X || a.Y+a.Height <= b.Y || b.Y+b.Height <= a.Y)
}

func (s *OptimizerService) splitRectangle(space, obstacle Rectangle) []Rectangle {
	var splits []Rectangle

	// Left split
	if obstacle.X > space.X {
		splits = append(splits, Rectangle{
			X: space.X, Y: space.Y,
			Width: obstacle.X - space.X, Height: space.Height,
		})
	}

	// Right split
	if obstacle.X+obstacle.Width < space.X+space.Width {
		splits = append(splits, Rectangle{
			X: obstacle.X + obstacle.Width, Y: space.Y,
			Width: (space.X + space.Width) - (obstacle.X + obstacle.Width), Height: space.Height,
		})
	}

	// Bottom split
	if obstacle.Y > space.Y {
		splits = append(splits, Rectangle{
			X: space.X, Y: space.Y,
			Width: space.Width, Height: obstacle.Y - space.Y,
		})
	}

	// Top split
	if obstacle.Y+obstacle.Height < space.Y+space.Height {
		splits = append(splits, Rectangle{
			X: space.X, Y: obstacle.Y + obstacle.Height,
			Width: space.Width, Height: (space.Y + space.Height) - (obstacle.Y + obstacle.Height),
		})
	}

	return splits
}

func (s *OptimizerService) filterSmallSpaces(spaces []Rectangle, minSize float64) []Rectangle {
	var filtered []Rectangle
	for _, space := range spaces {
		if space.Width >= minSize && space.Height >= minSize {
			filtered = append(filtered, space)
		}
	}
	return filtered
}

func (s *OptimizerService) generateCutPaths(pieces []models.PlacedPiece) []models.CutPath {
	var cutPaths []models.CutPath
	pathID := 1

	for _, piece := range pieces {
		// Generate rectangular cut path for each piece
		// Bottom edge
		cutPaths = append(cutPaths, models.CutPath{
			ID:       fmt.Sprintf("cut_%d_bottom", pathID),
			Type:     "horizontal",
			StartX:   piece.X,
			StartY:   piece.Y,
			EndX:     piece.X + piece.Width,
			EndY:     piece.Y,
			Order:    pathID * 4,
			ToolType: "straight",
			Speed:    100.0,
			Pieces:   []string{piece.ID},
		})

		// Right edge
		cutPaths = append(cutPaths, models.CutPath{
			ID:       fmt.Sprintf("cut_%d_right", pathID),
			Type:     "vertical",
			StartX:   piece.X + piece.Width,
			StartY:   piece.Y,
			EndX:     piece.X + piece.Width,
			EndY:     piece.Y + piece.Height,
			Order:    pathID*4 + 1,
			ToolType: "straight",
			Speed:    100.0,
			Pieces:   []string{piece.ID},
		})

		// Top edge
		cutPaths = append(cutPaths, models.CutPath{
			ID:       fmt.Sprintf("cut_%d_top", pathID),
			Type:     "horizontal",
			StartX:   piece.X + piece.Width,
			StartY:   piece.Y + piece.Height,
			EndX:     piece.X,
			EndY:     piece.Y + piece.Height,
			Order:    pathID*4 + 2,
			ToolType: "straight",
			Speed:    100.0,
			Pieces:   []string{piece.ID},
		})

		// Left edge
		cutPaths = append(cutPaths, models.CutPath{
			ID:       fmt.Sprintf("cut_%d_left", pathID),
			Type:     "vertical",
			StartX:   piece.X,
			StartY:   piece.Y + piece.Height,
			EndX:     piece.X,
			EndY:     piece.Y,
			Order:    pathID*4 + 3,
			ToolType: "straight",
			Speed:    100.0,
			Pieces:   []string{piece.ID},
		})

		pathID++
	}

	return cutPaths
}

func (s *OptimizerService) calculateUsedArea(pieces []models.PlacedPiece, designs map[int]*models.Design) float64 {
	totalArea := 0.0
	for _, piece := range pieces {
		totalArea += piece.Width * piece.Height
	}
	return totalArea
}

// Genetic Algorithm Helper Methods

func (s *OptimizerService) createRandomIndividual(pieces []PieceToPlace, sheet *models.GlassSheet, options *models.OptimizeOptions) *GeneticIndividual {
	individual := &GeneticIndividual{
		Pieces: []GeneticPiece{},
	}

	// Randomly place pieces (this is a simplified version)
	for _, piece := range pieces {
		x := rand.Float64() * (sheet.Width - 100)
		y := rand.Float64() * (sheet.Height - 100)

		individual.Pieces = append(individual.Pieces, GeneticPiece{
			DesignID: piece.DesignID,
			X:        x,
			Y:        y,
			Width:    100, // Simplified
			Height:   100,
			Rotation: 0,
		})
	}

	return individual
}

func (s *OptimizerService) evaluateFitness(individual *GeneticIndividual, sheet *models.GlassSheet) float64 {
	// Simplified fitness function - in reality this would be much more complex
	utilization := float64(len(individual.Pieces)) / (sheet.Area() / 10000.0)
	return math.Min(utilization, 1.0) * 100.0
}

func (s *OptimizerService) cloneIndividual(individual *GeneticIndividual) *GeneticIndividual {
	clone := &GeneticIndividual{
		Pieces:  make([]GeneticPiece, len(individual.Pieces)),
		Fitness: individual.Fitness,
	}
	copy(clone.Pieces, individual.Pieces)
	return clone
}

func (s *OptimizerService) tournamentSelection(population []*GeneticIndividual) *GeneticIndividual {
	tournamentSize := 3
	best := population[rand.Intn(len(population))]

	for i := 1; i < tournamentSize; i++ {
		candidate := population[rand.Intn(len(population))]
		if candidate.Fitness > best.Fitness {
			best = candidate
		}
	}

	return best
}

func (s *OptimizerService) crossover(parent1, parent2 *GeneticIndividual, options *models.OptimizeOptions) *GeneticIndividual {
	// Simplified crossover - take pieces from both parents
	offspring := &GeneticIndividual{
		Pieces: []GeneticPiece{},
	}

	crossoverPoint := len(parent1.Pieces) / 2
	offspring.Pieces = append(offspring.Pieces, parent1.Pieces[:crossoverPoint]...)
	offspring.Pieces = append(offspring.Pieces, parent2.Pieces[crossoverPoint:]...)

	return offspring
}

func (s *OptimizerService) mutate(individual *GeneticIndividual, options *models.OptimizeOptions) {
	mutationRate := options.MutationRate
	if mutationRate == 0 {
		mutationRate = 0.1
	}

	for i := range individual.Pieces {
		if rand.Float64() < mutationRate {
			// Slightly adjust position
			individual.Pieces[i].X += (rand.Float64() - 0.5) * 20
			individual.Pieces[i].Y += (rand.Float64() - 0.5) * 20
		}
	}
}

func (s *OptimizerService) individualToLayout(individual *GeneticIndividual, sheet *models.GlassSheet, designs map[int]*models.Design) *models.Layout {
	layout := &models.Layout{
		SheetWidth:  sheet.Width,
		SheetHeight: sheet.Height,
		Pieces:      []models.PlacedPiece{},
		CutPaths:    []models.CutPath{},
	}

	for _, piece := range individual.Pieces {
		design := designs[piece.DesignID]
		placedPiece := models.PlacedPiece{
			ID:         models.GenerateID(),
			DesignID:   piece.DesignID,
			DesignName: design.Name,
			X:          piece.X,
			Y:          piece.Y,
			Width:      piece.Width,
			Height:     piece.Height,
			Rotation:   piece.Rotation,
		}
		layout.Pieces = append(layout.Pieces, placedPiece)
	}

	layout.CutPaths = s.generateCutPaths(layout.Pieces)
	return layout
}

// Export Methods

func (s *OptimizerService) exportAsJSON(optimization *models.Optimization) (*ExportResult, error) {
	return &ExportResult{
		Format:   "json",
		Filename: fmt.Sprintf("optimization_%d.json", optimization.ID),
		Data:     optimization,
	}, nil
}

func (s *OptimizerService) exportAsSVG(optimization *models.Optimization) (*ExportResult, error) {
	// Generate SVG representation
	svg := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="%.2f" height="%.2f" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="%.2f" height="%.2f" fill="none" stroke="black" stroke-width="2"/>`,
		optimization.Sheet.Width/10, optimization.Sheet.Height/10,
		optimization.Sheet.Width/10, optimization.Sheet.Height/10)

	for _, piece := range optimization.Layout.Pieces {
		svg += fmt.Sprintf(`
  <rect x="%.2f" y="%.2f" width="%.2f" height="%.2f" fill="lightblue" stroke="blue" stroke-width="1"/>
  <text x="%.2f" y="%.2f" font-size="8" fill="black">%s</text>`,
			piece.X/10, piece.Y/10, piece.Width/10, piece.Height/10,
			(piece.X+piece.Width/2)/10, (piece.Y+piece.Height/2)/10, piece.DesignName)
	}

	svg += "\n</svg>"

	return &ExportResult{
		Format:   "svg",
		Filename: fmt.Sprintf("optimization_%d.svg", optimization.ID),
		Data:     svg,
	}, nil
}

func (s *OptimizerService) exportAsDXF(optimization *models.Optimization) (*ExportResult, error) {
	// Simplified DXF export (would need full DXF library for production)
	dxf := "0\nSECTION\n2\nENTITIES\n"

	for _, piece := range optimization.Layout.Pieces {
		dxf += fmt.Sprintf("0\nLINE\n8\n0\n10\n%.2f\n20\n%.2f\n30\n0.0\n11\n%.2f\n21\n%.2f\n31\n0.0\n",
			piece.X, piece.Y, piece.X+piece.Width, piece.Y)
	}

	dxf += "0\nENDSEC\n0\nEOF\n"

	return &ExportResult{
		Format:   "dxf",
		Filename: fmt.Sprintf("optimization_%d.dxf", optimization.ID),
		Data:     dxf,
	}, nil
}

func (s *OptimizerService) exportAsCuttingList(optimization *models.Optimization) (*ExportResult, error) {
	list := fmt.Sprintf("Cutting List for Optimization: %s\n", optimization.Name)
	list += fmt.Sprintf("Sheet: %s (%.0f x %.0f x %.0fmm)\n\n",
		optimization.Sheet.Name, optimization.Sheet.Width, optimization.Sheet.Height, optimization.Sheet.Thickness)

	list += fmt.Sprintf("Utilization: %.2f%%\n", optimization.Layout.Statistics.UtilizationRate)
	list += fmt.Sprintf("Waste: %.2f%%\n\n", optimization.Layout.Statistics.WasteRate)

	list += "Pieces to Cut:\n"
	list += "ID\tDesign\tX\tY\tWidth\tHeight\tRotation\n"

	for _, piece := range optimization.Layout.Pieces {
		list += fmt.Sprintf("%s\t%s\t%.1f\t%.1f\t%.1f\t%.1f\t%d°\n",
			piece.ID[:8], piece.DesignName, piece.X, piece.Y,
			piece.Width, piece.Height, piece.Rotation)
	}

	list += fmt.Sprintf("\nTotal Pieces: %d\n", len(optimization.Layout.Pieces))
	list += fmt.Sprintf("Cutting Length: %.2fmm\n", optimization.Layout.Statistics.CuttingLength)
	list += fmt.Sprintf("Estimated Cutting Time: %.1f minutes\n", optimization.Layout.Statistics.CuttingTime)

	return &ExportResult{
		Format:   "txt",
		Filename: fmt.Sprintf("cutting_list_%d.txt", optimization.ID),
		Data:     list,
	}, nil
}

// Response types
type OptimizationListResponse struct {
	Optimizations []models.Optimization `json:"optimizations"`
	Total         int                   `json:"total"`
	Limit         int                   `json:"limit"`
	Offset        int                   `json:"offset"`
}

type ExportResult struct {
	Format   string      `json:"format"`
	Filename string      `json:"filename"`
	Data     interface{} `json:"data"`
	Size     int         `json:"size,omitempty"`
}
