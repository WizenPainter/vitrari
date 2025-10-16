package services

import (
	"fmt"
	"log/slog"
	"time"

	"glass-optimizer/internal/models"
	"glass-optimizer/internal/storage"
)

// DesignerService handles business logic for design operations
type DesignerService struct {
	storage storage.Storage
	logger  *slog.Logger
}

// NewDesignerService creates a new designer service instance
func NewDesignerService(storage storage.Storage, logger *slog.Logger) *DesignerService {
	return &DesignerService{
		storage: storage,
		logger:  logger,
	}
}

// CreateDesign creates a new design with validation and business logic
func (s *DesignerService) CreateDesign(req *models.DesignRequest) (*models.Design, error) {
	s.logger.Info("Creating new design", "name", req.Name)

	// Validate request
	if err := s.validateDesignRequest(req); err != nil {
		return nil, err
	}

	// Create design model
	design := &models.Design{
		Name:        req.Name,
		Description: req.Description,
		Width:       req.Width,
		Height:      req.Height,
		Thickness:   req.Thickness,
		Elements:    req.Elements,
	}

	// Apply business rules
	if err := s.applyDesignBusinessRules(design); err != nil {
		return nil, err
	}

	// Save to storage
	if err := s.storage.CreateDesign(design); err != nil {
		s.logger.Error("Failed to create design in storage", "error", err, "name", req.Name)
		return nil, err
	}

	s.logger.Info("Design created successfully", "id", design.ID, "name", design.Name)
	return design, nil
}

// GetDesign retrieves a design by ID with additional processing
func (s *DesignerService) GetDesign(id int) (*models.Design, error) {
	s.logger.Debug("Retrieving design", "id", id)

	design, err := s.storage.GetDesign(id)
	if err != nil {
		return nil, err
	}

	// Apply any post-retrieval processing
	s.enrichDesign(design)

	return design, nil
}

// GetDesigns retrieves designs with pagination and optional filtering
func (s *DesignerService) GetDesigns(limit, offset int, filters *DesignFilters) (*DesignListResponse, error) {
	s.logger.Debug("Retrieving designs", "limit", limit, "offset", offset)

	var designs []models.Design
	var total int
	var err error

	// Apply filters if provided
	if filters != nil && filters.Search != "" {
		designs, total, err = s.storage.SearchDesigns(filters.Search, limit, offset)
	} else {
		designs, total, err = s.storage.GetDesigns(limit, offset)
	}

	if err != nil {
		return nil, err
	}

	// Enrich designs with additional data
	for i := range designs {
		s.enrichDesign(&designs[i])
	}

	// Apply additional business logic filtering
	if filters != nil {
		designs = s.filterDesigns(designs, filters)
	}

	return &DesignListResponse{
		Designs: designs,
		Total:   total,
		Limit:   limit,
		Offset:  offset,
	}, nil
}

// UpdateDesign updates an existing design
func (s *DesignerService) UpdateDesign(id int, req *models.DesignRequest) (*models.Design, error) {
	s.logger.Info("Updating design", "id", id, "name", req.Name)

	// Validate request
	if err := s.validateDesignRequest(req); err != nil {
		return nil, err
	}

	// Get existing design
	existing, err := s.storage.GetDesign(id)
	if err != nil {
		return nil, err
	}

	// Update fields
	existing.Name = req.Name
	existing.Description = req.Description
	existing.Width = req.Width
	existing.Height = req.Height
	existing.Thickness = req.Thickness
	existing.Elements = req.Elements
	existing.UpdatedAt = time.Now()

	// Apply business rules
	if err := s.applyDesignBusinessRules(existing); err != nil {
		return nil, err
	}

	// Save to storage
	if err := s.storage.UpdateDesign(existing); err != nil {
		s.logger.Error("Failed to update design in storage", "error", err, "id", id)
		return nil, err
	}

	s.logger.Info("Design updated successfully", "id", id, "name", existing.Name)
	return existing, nil
}

// DeleteDesign deletes a design after validation
func (s *DesignerService) DeleteDesign(id int) error {
	s.logger.Info("Deleting design", "id", id)

	// Check if design exists
	design, err := s.storage.GetDesign(id)
	if err != nil {
		return err
	}

	// Check if design is in use (business rule)
	if err := s.validateDesignDeletion(design); err != nil {
		return err
	}

	// Delete from storage
	if err := s.storage.DeleteDesign(id); err != nil {
		s.logger.Error("Failed to delete design from storage", "error", err, "id", id)
		return err
	}

	s.logger.Info("Design deleted successfully", "id", id)
	return nil
}

// ValidateDesign validates a design for structural integrity and manufacturability
func (s *DesignerService) ValidateDesign(design *models.Design) (*ValidationResult, error) {
	s.logger.Debug("Validating design", "id", design.ID, "name", design.Name)

	result := &ValidationResult{
		IsValid:  true,
		Warnings: []string{},
		Errors:   []string{},
	}

	// Validate dimensions
	s.validateDimensions(design, result)

	// Validate holes
	s.validateHoles(design, result)

	// Validate cuts
	s.validateCuts(design, result)

	// Validate manufacturability
	s.validateManufacturability(design, result)

	// Validate structural integrity
	s.validateStructuralIntegrity(design, result)

	// Set overall validity
	result.IsValid = len(result.Errors) == 0

	s.logger.Debug("Design validation completed", "id", design.ID, "valid", result.IsValid,
		"errors", len(result.Errors), "warnings", len(result.Warnings))

	return result, nil
}

// CloneDesign creates a copy of an existing design
func (s *DesignerService) CloneDesign(id int, newName string) (*models.Design, error) {
	s.logger.Info("Cloning design", "id", id, "new_name", newName)

	// Get existing design
	existing, err := s.storage.GetDesign(id)
	if err != nil {
		return nil, err
	}

	// Clone the design
	clone, err := existing.Clone()
	if err != nil {
		return nil, models.NewInternalError("failed to clone design", err)
	}

	// Update clone properties
	clone.Name = newName
	clone.Description = "Copy of " + existing.Description

	// Apply business rules to clone
	if err := s.applyDesignBusinessRules(clone); err != nil {
		return nil, err
	}

	// Save clone
	if err := s.storage.CreateDesign(clone); err != nil {
		s.logger.Error("Failed to create cloned design", "error", err, "original_id", id)
		return nil, err
	}

	s.logger.Info("Design cloned successfully", "original_id", id, "clone_id", clone.ID)
	return clone, nil
}

// GetDesignTemplates returns a list of common design templates
func (s *DesignerService) GetDesignTemplates() ([]DesignTemplate, error) {
	s.logger.Debug("Retrieving design templates")

	templates := []DesignTemplate{
		{
			Name:        "Standard Window",
			Description: "Basic rectangular window pane",
			Width:       1200,
			Height:      800,
			Thickness:   6,
			Category:    "windows",
			Elements: models.Elements{
				Shapes: []models.Shape{
					{
						ID:      models.GenerateID(),
						Type:    models.ShapeRectangle,
						Points:  []models.Point{{X: 0, Y: 0}, {X: 1200, Y: 0}, {X: 1200, Y: 800}, {X: 0, Y: 800}},
						Style:   models.DefaultStyle(),
						Visible: true,
					},
				},
			},
		},
		{
			Name:        "Door Panel",
			Description: "Standard door glass panel",
			Width:       600,
			Height:      1800,
			Thickness:   10,
			Category:    "doors",
			Elements: models.Elements{
				Shapes: []models.Shape{
					{
						ID:      models.GenerateID(),
						Type:    models.ShapeRectangle,
						Points:  []models.Point{{X: 0, Y: 0}, {X: 600, Y: 0}, {X: 600, Y: 1800}, {X: 0, Y: 1800}},
						Style:   models.DefaultStyle(),
						Visible: true,
					},
				},
			},
		},
		{
			Name:        "Round Table Top",
			Description: "Circular glass table top",
			Width:       1000,
			Height:      1000,
			Thickness:   12,
			Category:    "furniture",
			Elements: models.Elements{
				Shapes: []models.Shape{
					{
						ID:      models.GenerateID(),
						Type:    models.ShapeCircle,
						Points:  []models.Point{{X: 500, Y: 500}},
						Style:   models.DefaultStyle(),
						Visible: true,
					},
				},
			},
		},
		{
			Name:        "Shelf with Holes",
			Description: "Glass shelf with mounting holes",
			Width:       800,
			Height:      200,
			Thickness:   8,
			Category:    "shelving",
			Elements: models.Elements{
				Shapes: []models.Shape{
					{
						ID:      models.GenerateID(),
						Type:    models.ShapeRectangle,
						Points:  []models.Point{{X: 0, Y: 0}, {X: 800, Y: 0}, {X: 800, Y: 200}, {X: 0, Y: 200}},
						Style:   models.DefaultStyle(),
						Visible: true,
					},
				},
				Holes: []models.Hole{
					{
						ID:        models.GenerateID(),
						Type:      models.HoleCircular,
						Center:    models.Point{X: 50, Y: 100},
						Radius:    6,
						Tolerance: 0.5,
						Style:     models.DefaultStyle(),
						Visible:   true,
					},
					{
						ID:        models.GenerateID(),
						Type:      models.HoleCircular,
						Center:    models.Point{X: 750, Y: 100},
						Radius:    6,
						Tolerance: 0.5,
						Style:     models.DefaultStyle(),
						Visible:   true,
					},
				},
			},
		},
	}

	return templates, nil
}

// Helper types and structures

type DesignFilters struct {
	Search       string
	MinWidth     float64
	MaxWidth     float64
	MinHeight    float64
	MaxHeight    float64
	Thickness    float64
	HasHoles     *bool
	CreatedAfter *time.Time
}

type DesignListResponse struct {
	Designs []models.Design `json:"designs"`
	Total   int             `json:"total"`
	Limit   int             `json:"limit"`
	Offset  int             `json:"offset"`
}

type ValidationResult struct {
	IsValid  bool     `json:"is_valid"`
	Errors   []string `json:"errors"`
	Warnings []string `json:"warnings"`
}

type DesignTemplate struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Width       float64         `json:"width"`
	Height      float64         `json:"height"`
	Thickness   float64         `json:"thickness"`
	Category    string          `json:"category"`
	Elements    models.Elements `json:"elements"`
}

// Private helper methods

func (s *DesignerService) validateDesignRequest(req *models.DesignRequest) error {
	errors := &models.ValidationErrors{}

	// Validate required fields
	models.ValidateRequired(req.Name, "name", errors)
	models.ValidatePositive(req.Width, "width", errors)
	models.ValidatePositive(req.Height, "height", errors)
	models.ValidatePositive(req.Thickness, "thickness", errors)

	// Validate field lengths
	models.ValidateMaxLength(req.Name, 255, "name", errors)
	models.ValidateMaxLength(req.Description, 1000, "description", errors)

	// Validate dimensions
	models.ValidateRange(req.Width, 1, 10000, "width", errors)
	models.ValidateRange(req.Height, 1, 10000, "height", errors)
	models.ValidateRange(req.Thickness, 0.1, 50, "thickness", errors)

	if errors.HasErrors() {
		return errors
	}

	return nil
}

func (s *DesignerService) applyDesignBusinessRules(design *models.Design) error {
	// Generate IDs for elements if missing
	for i := range design.Elements.Shapes {
		if design.Elements.Shapes[i].ID == "" {
			design.Elements.Shapes[i].ID = models.GenerateID()
		}
	}

	for i := range design.Elements.Holes {
		if design.Elements.Holes[i].ID == "" {
			design.Elements.Holes[i].ID = models.GenerateID()
		}
	}

	for i := range design.Elements.Cuts {
		if design.Elements.Cuts[i].ID == "" {
			design.Elements.Cuts[i].ID = models.GenerateID()
		}
	}

	for i := range design.Elements.Notes {
		if design.Elements.Notes[i].ID == "" {
			design.Elements.Notes[i].ID = models.GenerateID()
		}
	}

	// Set default styles if missing
	for i := range design.Elements.Shapes {
		if design.Elements.Shapes[i].Style.StrokeColor == "" {
			design.Elements.Shapes[i].Style = models.DefaultStyle()
		}
	}

	return nil
}

func (s *DesignerService) enrichDesign(design *models.Design) {
	// Add calculated properties
	// This could include cost estimates, complexity scores, etc.
}

func (s *DesignerService) filterDesigns(designs []models.Design, filters *DesignFilters) []models.Design {
	var filtered []models.Design

	for _, design := range designs {
		if s.matchesFilters(&design, filters) {
			filtered = append(filtered, design)
		}
	}

	return filtered
}

func (s *DesignerService) matchesFilters(design *models.Design, filters *DesignFilters) bool {
	if filters.MinWidth > 0 && design.Width < filters.MinWidth {
		return false
	}
	if filters.MaxWidth > 0 && design.Width > filters.MaxWidth {
		return false
	}
	if filters.MinHeight > 0 && design.Height < filters.MinHeight {
		return false
	}
	if filters.MaxHeight > 0 && design.Height > filters.MaxHeight {
		return false
	}
	if filters.Thickness > 0 && design.Thickness != filters.Thickness {
		return false
	}
	if filters.HasHoles != nil {
		hasHoles := len(design.Elements.Holes) > 0
		if *filters.HasHoles != hasHoles {
			return false
		}
	}
	if filters.CreatedAfter != nil && design.CreatedAt.Before(*filters.CreatedAfter) {
		return false
	}

	return true
}

func (s *DesignerService) validateDesignDeletion(design *models.Design) error {
	// Check if design is referenced in any projects or optimizations
	// This would require additional storage queries
	// For now, we'll allow deletion
	return nil
}

func (s *DesignerService) validateDimensions(design *models.Design, result *ValidationResult) {
	// Check minimum dimensions
	if design.Width < 10 {
		result.Errors = append(result.Errors, "Width must be at least 10mm")
	}
	if design.Height < 10 {
		result.Errors = append(result.Errors, "Height must be at least 10mm")
	}

	// Check maximum dimensions
	if design.Width > 3000 {
		result.Warnings = append(result.Warnings, "Width exceeds 3000mm - may be difficult to manufacture")
	}
	if design.Height > 3000 {
		result.Warnings = append(result.Warnings, "Height exceeds 3000mm - may be difficult to manufacture")
	}

	// Check aspect ratio
	aspectRatio := design.Width / design.Height
	if aspectRatio > 10 || aspectRatio < 0.1 {
		result.Warnings = append(result.Warnings, "Extreme aspect ratio may cause structural issues")
	}
}

func (s *DesignerService) validateHoles(design *models.Design, result *ValidationResult) {
	minDistanceFromEdge := 25.0     // mm
	minDistanceBetweenHoles := 20.0 // mm

	for i, hole := range design.Elements.Holes {
		// Check distance from edges
		if hole.Center.X < minDistanceFromEdge || hole.Center.X > design.Width-minDistanceFromEdge {
			result.Warnings = append(result.Warnings,
				fmt.Sprintf("Hole %d is too close to horizontal edge", i+1))
		}
		if hole.Center.Y < minDistanceFromEdge || hole.Center.Y > design.Height-minDistanceFromEdge {
			result.Warnings = append(result.Warnings,
				fmt.Sprintf("Hole %d is too close to vertical edge", i+1))
		}

		// Check distance between holes
		for j, otherHole := range design.Elements.Holes {
			if i != j {
				dx := hole.Center.X - otherHole.Center.X
				dy := hole.Center.Y - otherHole.Center.Y
				distance := sqrt(dx*dx + dy*dy)
				if distance < minDistanceBetweenHoles {
					result.Warnings = append(result.Warnings,
						fmt.Sprintf("Holes %d and %d are too close together", i+1, j+1))
				}
			}
		}

		// Validate hole size
		if hole.Type == models.HoleCircular && hole.Radius < 3 {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Hole %d radius is too small (minimum 3mm)", i+1))
		}
		if hole.Type == models.HoleCircular && hole.Radius > 100 {
			result.Warnings = append(result.Warnings,
				fmt.Sprintf("Hole %d is very large and may weaken the glass", i+1))
		}
	}
}

func (s *DesignerService) validateCuts(design *models.Design, result *ValidationResult) {
	// Validate cut positions and angles
	for i, cut := range design.Elements.Cuts {
		if cut.StartX < 0 || cut.StartX > design.Width || cut.EndX < 0 || cut.EndX > design.Width {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Cut %d extends beyond design width", i+1))
		}
		if cut.StartY < 0 || cut.StartY > design.Height || cut.EndY < 0 || cut.EndY > design.Height {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Cut %d extends beyond design height", i+1))
		}

		if cut.Depth > design.Thickness {
			result.Errors = append(result.Errors,
				fmt.Sprintf("Cut %d depth exceeds glass thickness", i+1))
		}
	}
}

func (s *DesignerService) validateManufacturability(design *models.Design, result *ValidationResult) {
	// Check if design can be manufactured with standard equipment
	area := design.AreaInSquareMeters()
	if area > 10.0 {
		result.Warnings = append(result.Warnings, "Large area may require special handling equipment")
	}

	// Check thickness to size ratio
	if design.Thickness < 4 && (design.Width > 1000 || design.Height > 1000) {
		result.Warnings = append(result.Warnings, "Thin glass at large size may be fragile")
	}
}

func (s *DesignerService) validateStructuralIntegrity(design *models.Design, result *ValidationResult) {
	// Calculate effective area after holes
	effectiveArea := design.GetEffectiveArea()
	totalArea := design.Area()

	if effectiveArea/totalArea < 0.5 {
		result.Warnings = append(result.Warnings, "More than 50% material removed - structural integrity may be compromised")
	}
}

// Helper function (duplicate from glass.go for now - should be in a utils package)
func sqrt(x float64) float64 {
	if x == 0 {
		return 0
	}
	z := x
	for i := 0; i < 10; i++ {
		z = (z + x/z) / 2
	}
	return z
}
