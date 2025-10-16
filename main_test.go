package main

import (
	"testing"
	"time"

	"glass-optimizer/internal/models"
)

func TestDesignModel(t *testing.T) {
	design := &models.Design{
		Name:      "Test Window",
		Width:     1200,
		Height:    800,
		Thickness: 6.0,
		Elements: models.Elements{
			Shapes: []models.Shape{
				{
					ID:      "shape-1",
					Type:    models.ShapeRectangle,
					Points:  []models.Point{{X: 0, Y: 0}, {X: 1200, Y: 0}},
					Style:   models.DefaultStyle(),
					Visible: true,
				},
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Test validation
	err := design.Validate()
	if err != nil {
		t.Errorf("Valid design failed validation: %v", err)
	}

	// Test area calculation
	expectedArea := 1200.0 * 800.0
	if design.Area() != expectedArea {
		t.Errorf("Area calculation incorrect: got %f, want %f", design.Area(), expectedArea)
	}

	// Test area in square meters
	expectedAreaM2 := expectedArea / 1000000.0
	if design.AreaInSquareMeters() != expectedAreaM2 {
		t.Errorf("Area in m² calculation incorrect: got %f, want %f", design.AreaInSquareMeters(), expectedAreaM2)
	}

	// Test design data marshaling
	err = design.MarshalDesignData()
	if err != nil {
		t.Errorf("Failed to marshal design data: %v", err)
	}

	// Test design data unmarshaling
	err = design.UnmarshalDesignData()
	if err != nil {
		t.Errorf("Failed to unmarshal design data: %v", err)
	}
}

func TestGlassSheetModel(t *testing.T) {
	sheet := &models.GlassSheet{
		Name:        "Standard Sheet",
		Width:       3000,
		Height:      2000,
		Thickness:   6.0,
		PricePerSqm: 45.50,
		InStock:     10,
		Material:    "standard",
		Specs: models.GlassSpecs{
			Tempered:     false,
			Laminated:    false,
			WeightPerSqm: 15.0,
			LeadTime:     7,
		},
		CreatedAt: time.Now(),
	}

	// Test validation
	err := sheet.Validate()
	if err != nil {
		t.Errorf("Valid glass sheet failed validation: %v", err)
	}

	// Test area calculation
	expectedArea := 3000.0 * 2000.0
	if sheet.Area() != expectedArea {
		t.Errorf("Area calculation incorrect: got %f, want %f", sheet.Area(), expectedArea)
	}

	// Test cost calculation
	expectedCost := (expectedArea / 1000000.0) * 45.50
	if sheet.TotalCost() != expectedCost {
		t.Errorf("Cost calculation incorrect: got %f, want %f", sheet.TotalCost(), expectedCost)
	}

	// Test properties marshaling
	err = sheet.MarshalProperties()
	if err != nil {
		t.Errorf("Failed to marshal sheet properties: %v", err)
	}

	// Test properties unmarshaling
	err = sheet.UnmarshalProperties()
	if err != nil {
		t.Errorf("Failed to unmarshal sheet properties: %v", err)
	}
}

func TestProjectModel(t *testing.T) {
	project := &models.Project{
		Name:        "Office Renovation",
		Description: "Glass panels for office renovation project",
		DesignList: []models.ProjectDesignItem{
			{
				DesignID: 1,
				Quantity: 4,
				Priority: 1,
				UnitCost: 100.0,
			},
			{
				DesignID: 2,
				Quantity: 2,
				Priority: 2,
				UnitCost: 150.0,
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Test validation
	err := project.Validate()
	if err != nil {
		t.Errorf("Valid project failed validation: %v", err)
	}

	// Test total quantity calculation
	expectedQuantity := 6
	if project.GetTotalQuantity() != expectedQuantity {
		t.Errorf("Total quantity calculation incorrect: got %d, want %d", project.GetTotalQuantity(), expectedQuantity)
	}

	// Test total cost calculation
	expectedCost := (4 * 100.0) + (2 * 150.0)
	if project.GetTotalCost() != expectedCost {
		t.Errorf("Total cost calculation incorrect: got %f, want %f", project.GetTotalCost(), expectedCost)
	}

	// Test design marshaling
	err = project.MarshalDesigns()
	if err != nil {
		t.Errorf("Failed to marshal project designs: %v", err)
	}

	// Test design unmarshaling
	err = project.UnmarshalDesigns()
	if err != nil {
		t.Errorf("Failed to unmarshal project designs: %v", err)
	}
}

func TestOptimizationModel(t *testing.T) {
	sheet := &models.GlassSheet{
		Width:       3000,
		Height:      2000,
		PricePerSqm: 45.50,
	}

	optimization := &models.Optimization{
		Name:    "Test Optimization",
		SheetID: 1,
		Sheet:   sheet,
		DesignList: []models.DesignItem{
			{
				DesignID: 1,
				Quantity: 2,
				Priority: 1,
			},
		},
		Layout: models.Layout{
			SheetWidth:  3000,
			SheetHeight: 2000,
			Pieces: []models.PlacedPiece{
				{
					ID:         "piece-1",
					DesignID:   1,
					DesignName: "Test Piece",
					X:          100,
					Y:          100,
					Width:      800,
					Height:     600,
					Rotation:   0,
				},
			},
		},
		Algorithm: "blf",
		CreatedAt: time.Now(),
	}

	// Test validation
	err := optimization.Validate()
	if err != nil {
		t.Errorf("Valid optimization failed validation: %v", err)
	}

	// Test used area calculation
	optimization.UsedArea = 800.0 * 600.0 // Area of the placed piece
	optimization.CalculateStatistics()

	expectedWasteArea := sheet.Area() - optimization.UsedArea
	if optimization.WastedArea != expectedWasteArea {
		t.Errorf("Waste area calculation incorrect: got %f, want %f", optimization.WastedArea, expectedWasteArea)
	}

	// Test waste percentage
	expectedWastePercentage := (expectedWasteArea / sheet.Area()) * 100
	if optimization.WastePercentage != expectedWastePercentage {
		t.Errorf("Waste percentage calculation incorrect: got %f, want %f", optimization.WastePercentage, expectedWastePercentage)
	}

	// Test design IDs marshaling
	err = optimization.MarshalDesignIDs()
	if err != nil {
		t.Errorf("Failed to marshal design IDs: %v", err)
	}

	// Test layout data marshaling
	err = optimization.MarshalLayoutData()
	if err != nil {
		t.Errorf("Failed to marshal layout data: %v", err)
	}
}

func TestDesignValidation(t *testing.T) {
	tests := []struct {
		name    string
		design  *models.Design
		wantErr bool
	}{
		{
			name: "valid design",
			design: &models.Design{
				Name:      "Valid Design",
				Width:     1000,
				Height:    800,
				Thickness: 6.0,
			},
			wantErr: false,
		},
		{
			name: "empty name",
			design: &models.Design{
				Name:      "",
				Width:     1000,
				Height:    800,
				Thickness: 6.0,
			},
			wantErr: true,
		},
		{
			name: "zero width",
			design: &models.Design{
				Name:      "Invalid Width",
				Width:     0,
				Height:    800,
				Thickness: 6.0,
			},
			wantErr: true,
		},
		{
			name: "zero height",
			design: &models.Design{
				Name:      "Invalid Height",
				Width:     1000,
				Height:    0,
				Thickness: 6.0,
			},
			wantErr: true,
		},
		{
			name: "zero thickness",
			design: &models.Design{
				Name:      "Invalid Thickness",
				Width:     1000,
				Height:    800,
				Thickness: 0,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.design.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Design.Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestDefaultValues(t *testing.T) {
	// Test default style
	style := models.DefaultStyle()
	if style.StrokeColor != "#000000" {
		t.Errorf("Default stroke color incorrect: got %s, want %s", style.StrokeColor, "#000000")
	}

	if style.StrokeWidth != 1.0 {
		t.Errorf("Default stroke width incorrect: got %f, want %f", style.StrokeWidth, 1.0)
	}

	// Test default optimize options
	options := models.DefaultOptimizeOptions()
	if options.AllowRotation != true {
		t.Errorf("Default allow rotation should be true")
	}

	if options.MinimumGap != 2.0 {
		t.Errorf("Default minimum gap incorrect: got %f, want %f", options.MinimumGap, 2.0)
	}

	if options.EdgeMargin != 5.0 {
		t.Errorf("Default edge margin incorrect: got %f, want %f", options.EdgeMargin, 5.0)
	}
}

func TestErrorHandling(t *testing.T) {
	// Test validation error
	err := models.NewValidationError("test validation error")
	if err.Type != models.ErrorTypeValidation {
		t.Errorf("Validation error type incorrect: got %s, want %s", err.Type, models.ErrorTypeValidation)
	}

	// Test not found error
	err = models.NewNotFoundError("test resource")
	if err.Type != models.ErrorTypeNotFound {
		t.Errorf("Not found error type incorrect: got %s, want %s", err.Type, models.ErrorTypeNotFound)
	}

	// Test database error
	err = models.NewDatabaseError("test database error", nil)
	if err.Type != models.ErrorTypeDatabase {
		t.Errorf("Database error type incorrect: got %s, want %s", err.Type, models.ErrorTypeDatabase)
	}

	// Test optimization error
	err = models.NewOptimizationError("test optimization error", "details")
	if err.Type != models.ErrorTypeOptimization {
		t.Errorf("Optimization error type incorrect: got %s, want %s", err.Type, models.ErrorTypeOptimization)
	}
}

func BenchmarkAreaCalculation(b *testing.B) {
	design := &models.Design{
		Width:  1200,
		Height: 800,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = design.Area()
	}
}

func BenchmarkDesignValidation(b *testing.B) {
	design := &models.Design{
		Name:      "Benchmark Design",
		Width:     1200,
		Height:    800,
		Thickness: 6.0,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = design.Validate()
	}
}
