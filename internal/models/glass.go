package models

import (
	"encoding/json"
	"time"
)

// GlassSheet represents a glass sheet available for cutting
type GlassSheet struct {
	ID          int        `json:"id" db:"id"`
	Name        string     `json:"name" db:"name"`
	Width       float64    `json:"width" db:"width"`         // in millimeters
	Height      float64    `json:"height" db:"height"`       // in millimeters
	Thickness   float64    `json:"thickness" db:"thickness"` // in millimeters
	PricePerSqm float64    `json:"price_per_sqm" db:"price_per_sqm"`
	InStock     int        `json:"in_stock" db:"in_stock"`
	Material    string     `json:"material" db:"material"` // e.g., "tempered", "laminated", "standard"
	Supplier    string     `json:"supplier" db:"supplier"`
	Grade       string     `json:"grade" db:"grade"`  // quality grade
	Properties  string     `json:"-" db:"properties"` // JSON blob for additional properties
	Specs       GlassSpecs `json:"specs"`             // Parsed properties
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
}

// GlassSpecs holds additional glass properties and specifications
type GlassSpecs struct {
	Tempered        bool     `json:"tempered"`
	Laminated       bool     `json:"laminated"`
	LowE            bool     `json:"low_e"` // Low-emissivity coating
	Tinted          bool     `json:"tinted"`
	TintColor       string   `json:"tint_color"`
	UValue          float64  `json:"u_value"`        // Thermal transmittance
	SHGCoefficient  float64  `json:"shgc"`           // Solar Heat Gain Coefficient
	VisibleLight    float64  `json:"visible_light"`  // Visible light transmittance %
	WeightPerSqm    float64  `json:"weight_per_sqm"` // kg per square meter
	MaxDimension    float64  `json:"max_dimension"`  // Maximum manufacturable dimension
	MinThickness    float64  `json:"min_thickness"`
	MaxThickness    float64  `json:"max_thickness"`
	EdgeWork        []string `json:"edge_work"`         // Available edge treatments
	Drilling        bool     `json:"drilling"`          // Can be drilled
	MaxHoleSize     float64  `json:"max_hole_size"`     // Maximum hole diameter
	MinHoleDistance float64  `json:"min_hole_distance"` // Minimum distance between holes
	LeadTime        int      `json:"lead_time"`         // Days
	Notes           string   `json:"notes"`
}

// GlassSheetRequest represents a request to create or update a glass sheet
type GlassSheetRequest struct {
	Name        string     `json:"name" validate:"required,min=1,max=255"`
	Width       float64    `json:"width" validate:"required,gt=0,lte=10000"`
	Height      float64    `json:"height" validate:"required,gt=0,lte=10000"`
	Thickness   float64    `json:"thickness" validate:"required,gt=0,lte=50"`
	PricePerSqm float64    `json:"price_per_sqm" validate:"required,gte=0"`
	InStock     int        `json:"in_stock" validate:"gte=0"`
	Material    string     `json:"material" validate:"required"`
	Supplier    string     `json:"supplier"`
	Grade       string     `json:"grade"`
	Specs       GlassSpecs `json:"specs"`
}

// GlassSheetResponse represents the response structure for glass sheet API calls
type GlassSheetResponse struct {
	Sheet   *GlassSheet  `json:"sheet,omitempty"`
	Sheets  []GlassSheet `json:"sheets,omitempty"`
	Total   int          `json:"total,omitempty"`
	Message string       `json:"message,omitempty"`
	Error   string       `json:"error,omitempty"`
}

// Optimization represents an optimization result
type Optimization struct {
	ID              int          `json:"id" db:"id"`
	Name            string       `json:"name" db:"name"`
	SheetID         int          `json:"sheet_id" db:"sheet_id"`
	Sheet           *GlassSheet  `json:"sheet,omitempty"`
	DesignIDs       string       `json:"-" db:"design_ids"`  // JSON array of design IDs with quantities
	DesignList      []DesignItem `json:"designs"`            // Parsed design list
	LayoutData      string       `json:"-" db:"layout_data"` // JSON blob
	Layout          Layout       `json:"layout"`             // Parsed layout
	WastePercentage float64      `json:"waste_percentage" db:"waste_percentage"`
	TotalArea       float64      `json:"total_area" db:"total_area"`         // Sheet area in mm²
	UsedArea        float64      `json:"used_area" db:"used_area"`           // Used area in mm²
	WastedArea      float64      `json:"wasted_area"`                        // Calculated waste area
	TotalCost       float64      `json:"total_cost"`                         // Total material cost
	Algorithm       string       `json:"algorithm" db:"algorithm"`           // Algorithm used
	ExecutionTime   float64      `json:"execution_time" db:"execution_time"` // Time taken in seconds
	CreatedAt       time.Time    `json:"created_at" db:"created_at"`
}

// DesignItem represents a design with quantity for optimization
type DesignItem struct {
	DesignID int     `json:"design_id"`
	Design   *Design `json:"design,omitempty"`
	Quantity int     `json:"quantity"`
	Priority int     `json:"priority"` // Higher priority pieces are placed first
}

// Layout represents the optimized layout of pieces on a sheet
type Layout struct {
	SheetWidth  float64       `json:"sheet_width"`
	SheetHeight float64       `json:"sheet_height"`
	Pieces      []PlacedPiece `json:"pieces"`
	CutPaths    []CutPath     `json:"cut_paths"`
	Statistics  Statistics    `json:"statistics"`
}

// PlacedPiece represents a design piece placed on the sheet
type PlacedPiece struct {
	ID         string  `json:"id"` // Unique placement ID
	DesignID   int     `json:"design_id"`
	DesignName string  `json:"design_name"`
	X          float64 `json:"x"`         // Position X coordinate
	Y          float64 `json:"y"`         // Position Y coordinate
	Width      float64 `json:"width"`     // Actual width (may be rotated)
	Height     float64 `json:"height"`    // Actual height (may be rotated)
	Rotation   int     `json:"rotation"`  // Rotation angle: 0, 90, 180, 270
	Flipped    bool    `json:"flipped"`   // Whether the piece is flipped
	Nested     bool    `json:"nested"`    // Whether this piece is nested within another
	ParentID   string  `json:"parent_id"` // ID of parent piece if nested
}

// CutPath represents the optimal cutting path for the sheet
type CutPath struct {
	ID       string   `json:"id"`
	Type     string   `json:"type"` // "horizontal", "vertical", "curve"
	StartX   float64  `json:"start_x"`
	StartY   float64  `json:"start_y"`
	EndX     float64  `json:"end_x"`
	EndY     float64  `json:"end_y"`
	Order    int      `json:"order"`     // Cutting order
	ToolType string   `json:"tool_type"` // "straight", "diamond", "water_jet"
	Speed    float64  `json:"speed"`     // Cutting speed
	Pieces   []string `json:"pieces"`    // IDs of pieces this cut affects
}

// Statistics holds optimization statistics
type Statistics struct {
	TotalPieces        int     `json:"total_pieces"`
	PlacedPieces       int     `json:"placed_pieces"`
	UnplacedPieces     int     `json:"unplaced_pieces"`
	UtilizationRate    float64 `json:"utilization_rate"`    // Percentage of sheet used
	WasteRate          float64 `json:"waste_rate"`          // Percentage wasted
	MaterialEfficiency float64 `json:"material_efficiency"` // Overall efficiency score
	CuttingLength      float64 `json:"cutting_length"`      // Total cutting path length
	CuttingTime        float64 `json:"cutting_time"`        // Estimated cutting time
	LargestWasteArea   float64 `json:"largest_waste_area"`  // Largest continuous waste area
	SmallestGap        float64 `json:"smallest_gap"`        // Smallest gap between pieces
}

// OptimizationRequest represents a request to run optimization
type OptimizationRequest struct {
	Name      string          `json:"name" validate:"required,min=1,max=255"`
	SheetID   int             `json:"sheet_id" validate:"required,gt=0"`
	Designs   []DesignItem    `json:"designs" validate:"required,min=1"`
	Algorithm string          `json:"algorithm" validate:"required,oneof=blf genetic greedy custom"`
	Options   OptimizeOptions `json:"options"`
}

// OptimizeOptions holds optimization parameters
type OptimizeOptions struct {
	AllowRotation     bool    `json:"allow_rotation"`     // Allow 90° rotations
	AllowFlipping     bool    `json:"allow_flipping"`     // Allow mirroring pieces
	MinimumGap        float64 `json:"minimum_gap"`        // Minimum gap between pieces (mm)
	EdgeMargin        float64 `json:"edge_margin"`        // Margin from sheet edges (mm)
	MaxIterations     int     `json:"max_iterations"`     // For genetic algorithm
	PopulationSize    int     `json:"population_size"`    // For genetic algorithm
	MutationRate      float64 `json:"mutation_rate"`      // For genetic algorithm
	CrossoverRate     float64 `json:"crossover_rate"`     // For genetic algorithm
	TimeLimit         int     `json:"time_limit"`         // Maximum optimization time (seconds)
	QualityTarget     float64 `json:"quality_target"`     // Target utilization rate (0-1)
	PreferredRotation int     `json:"preferred_rotation"` // Preferred rotation angle
	SortBy            string  `json:"sort_by"`            // "area", "perimeter", "ratio", "priority"
	SortOrder         string  `json:"sort_order"`         // "asc", "desc"
	EnableNesting     bool    `json:"enable_nesting"`     // Allow pieces inside holes of others
}

// OptimizationResponse represents the response structure for optimization API calls
type OptimizationResponse struct {
	Optimization  *Optimization  `json:"optimization,omitempty"`
	Optimizations []Optimization `json:"optimizations,omitempty"`
	Total         int            `json:"total,omitempty"`
	Message       string         `json:"message,omitempty"`
	Error         string         `json:"error,omitempty"`
}

// Validate validates the glass sheet data
func (gs *GlassSheet) Validate() error {
	if gs.Name == "" {
		return NewValidationError("name is required")
	}
	if gs.Width <= 0 {
		return NewValidationError("width must be greater than 0")
	}
	if gs.Height <= 0 {
		return NewValidationError("height must be greater than 0")
	}
	if gs.Thickness <= 0 {
		return NewValidationError("thickness must be greater than 0")
	}
	if gs.PricePerSqm < 0 {
		return NewValidationError("price per square meter cannot be negative")
	}
	return nil
}

// Area calculates the total area of the glass sheet in square millimeters
func (gs *GlassSheet) Area() float64 {
	return gs.Width * gs.Height
}

// AreaInSquareMeters returns the area in square meters
func (gs *GlassSheet) AreaInSquareMeters() float64 {
	return gs.Area() / 1000000.0 // Convert mm² to m²
}

// TotalCost calculates the cost of the entire sheet
func (gs *GlassSheet) TotalCost() float64 {
	return gs.AreaInSquareMeters() * gs.PricePerSqm
}

// MarshalProperties serializes the Specs to JSON for database storage
func (gs *GlassSheet) MarshalProperties() error {
	data, err := json.Marshal(gs.Specs)
	if err != nil {
		return err
	}
	gs.Properties = string(data)
	return nil
}

// UnmarshalProperties deserializes the JSON Properties to Specs
func (gs *GlassSheet) UnmarshalProperties() error {
	if gs.Properties == "" {
		gs.Specs = GlassSpecs{}
		return nil
	}
	return json.Unmarshal([]byte(gs.Properties), &gs.Specs)
}

// Validate validates the optimization request
func (opt *Optimization) Validate() error {
	if opt.Name == "" {
		return NewValidationError("name is required")
	}
	if opt.SheetID <= 0 {
		return NewValidationError("sheet_id must be greater than 0")
	}
	if len(opt.DesignList) == 0 {
		return NewValidationError("at least one design is required")
	}
	return nil
}

// MarshalDesignIDs serializes the DesignList to JSON for database storage
func (opt *Optimization) MarshalDesignIDs() error {
	data, err := json.Marshal(opt.DesignList)
	if err != nil {
		return err
	}
	opt.DesignIDs = string(data)
	return nil
}

// UnmarshalDesignIDs deserializes the JSON DesignIDs to DesignList
func (opt *Optimization) UnmarshalDesignIDs() error {
	if opt.DesignIDs == "" {
		opt.DesignList = []DesignItem{}
		return nil
	}
	return json.Unmarshal([]byte(opt.DesignIDs), &opt.DesignList)
}

// MarshalLayoutData serializes the Layout to JSON for database storage
func (opt *Optimization) MarshalLayoutData() error {
	data, err := json.Marshal(opt.Layout)
	if err != nil {
		return err
	}
	opt.LayoutData = string(data)
	return nil
}

// UnmarshalLayoutData deserializes the JSON LayoutData to Layout
func (opt *Optimization) UnmarshalLayoutData() error {
	if opt.LayoutData == "" {
		opt.Layout = Layout{}
		return nil
	}
	return json.Unmarshal([]byte(opt.LayoutData), &opt.Layout)
}

// CalculateStatistics calculates and updates optimization statistics
func (opt *Optimization) CalculateStatistics() {
	if opt.Sheet == nil {
		return
	}

	totalArea := opt.Sheet.Area()
	opt.TotalArea = totalArea
	opt.WastedArea = totalArea - opt.UsedArea
	opt.WastePercentage = (opt.WastedArea / totalArea) * 100

	// Calculate layout statistics
	stats := &opt.Layout.Statistics
	stats.TotalPieces = len(opt.DesignList)
	stats.PlacedPieces = len(opt.Layout.Pieces)
	stats.UnplacedPieces = stats.TotalPieces - stats.PlacedPieces
	stats.UtilizationRate = (opt.UsedArea / totalArea) * 100
	stats.WasteRate = opt.WastePercentage
	stats.MaterialEfficiency = calculateMaterialEfficiency(opt)

	// Calculate cutting statistics
	stats.CuttingLength = calculateCuttingLength(opt.Layout.CutPaths)
	stats.CuttingTime = estimateCuttingTime(opt.Layout.CutPaths)
}

// GetTotalPieceArea calculates the total area of all pieces to be placed
func (opt *Optimization) GetTotalPieceArea() float64 {
	totalArea := 0.0
	for _, item := range opt.DesignList {
		if item.Design != nil {
			totalArea += item.Design.Area() * float64(item.Quantity)
		}
	}
	return totalArea
}

// GetTheoreticalUtilization calculates the theoretical maximum utilization
func (opt *Optimization) GetTheoreticalUtilization() float64 {
	if opt.Sheet == nil {
		return 0
	}
	pieceArea := opt.GetTotalPieceArea()
	sheetArea := opt.Sheet.Area()
	if sheetArea == 0 {
		return 0
	}
	return (pieceArea / sheetArea) * 100
}

// calculateMaterialEfficiency calculates overall material efficiency
func calculateMaterialEfficiency(opt *Optimization) float64 {
	theoretical := opt.GetTheoreticalUtilization()
	actual := (opt.UsedArea / opt.TotalArea) * 100

	if theoretical == 0 {
		return 0
	}

	return (actual / theoretical) * 100
}

// calculateCuttingLength calculates total cutting path length
func calculateCuttingLength(paths []CutPath) float64 {
	totalLength := 0.0
	for _, path := range paths {
		dx := path.EndX - path.StartX
		dy := path.EndY - path.StartY
		length := sqrt(dx*dx + dy*dy)
		totalLength += length
	}
	return totalLength
}

// estimateCuttingTime estimates total cutting time based on paths and speeds
func estimateCuttingTime(paths []CutPath) float64 {
	totalTime := 0.0
	for _, path := range paths {
		dx := path.EndX - path.StartX
		dy := path.EndY - path.StartY
		length := sqrt(dx*dx + dy*dy)

		speed := path.Speed
		if speed <= 0 {
			speed = 100.0 // Default speed mm/min
		}

		time := length / speed // Time in minutes
		totalTime += time
	}
	return totalTime
}

// sqrt calculates square root
func sqrt(x float64) float64 {
	if x == 0 {
		return 0
	}

	// Simple approximation for square root
	z := x
	for i := 0; i < 10; i++ {
		z = (z + x/z) / 2
	}
	return z
}

// DefaultOptimizeOptions returns default optimization options
func DefaultOptimizeOptions() OptimizeOptions {
	return OptimizeOptions{
		AllowRotation:     true,
		AllowFlipping:     false,
		MinimumGap:        2.0, // 2mm gap
		EdgeMargin:        5.0, // 5mm margin
		MaxIterations:     1000,
		PopulationSize:    50,
		MutationRate:      0.1,
		CrossoverRate:     0.8,
		TimeLimit:         300,  // 5 minutes
		QualityTarget:     0.85, // 85% utilization target
		PreferredRotation: 0,
		SortBy:            "area",
		SortOrder:         "desc",
		EnableNesting:     false,
	}
}
