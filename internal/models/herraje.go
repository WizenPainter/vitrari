package models

import (
	"encoding/json"
	"time"
)

// Herraje represents a hardware piece (clip, spider, bracket, etc.) for glass installations
type Herraje struct {
	ID              int              `json:"id" db:"id"`
	Code            string           `json:"code" db:"code"`                         // Product code (e.g., "1214000")
	Name            string           `json:"name" db:"name"`                         // Product name
	Description     string           `json:"description" db:"description"`           // Detailed description
	Category        HerrajeCategory  `json:"category" db:"category"`                 // Type: spider, bracket, connector, etc.
	Material        string           `json:"material" db:"material"`                 // Material type
	Finish          string           `json:"finish" db:"finish"`                     // Finish type (e.g., "Satinado")
	MaxLoad         float64          `json:"max_load" db:"max_load"`                 // Maximum load in kg
	MinThickness    float64          `json:"min_thickness" db:"min_thickness"`       // Minimum glass thickness in mm
	MaxThickness    float64          `json:"max_thickness" db:"max_thickness"`       // Maximum glass thickness in mm
	HoleSize        float64          `json:"hole_size" db:"hole_size"`               // Standard hole diameter in mm
	CountersinkSize float64          `json:"countersink_size" db:"countersink_size"` // Countersink diameter if applicable
	CountersinkType string           `json:"countersink_type" db:"countersink_type"` // Type of countersink (cone, flat, etc.)
	HolePattern     HolePattern      `json:"hole_pattern" db:"hole_pattern"`         // Pattern of holes (single, pairs, grid, etc.)
	Positions       int              `json:"positions" db:"positions"`               // Number of possible hole positions
	PictureURL      string           `json:"picture_url" db:"picture_url"`           // URL to picture/image
	SpecsData       string           `json:"-" db:"specs_data"`                      // JSON blob for additional specs
	Specs           HerrajeSpecs     `json:"specs"`                                  // Parsed specifications
	Variants        []HerrajeVariant `json:"variants"`                               // Available variants/materials
	Notes           string           `json:"notes" db:"notes"`                       // Additional notes
	Active          bool             `json:"active" db:"active"`                     // Whether this herraje is available
	CreatedAt       time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at" db:"updated_at"`
}

// HerrajeCategory represents the type of herraje
type HerrajeCategory string

const (
	CategorySpider    HerrajeCategory = "spider"       // Araña
	CategoryBracket   HerrajeCategory = "bracket"      // Soporte
	CategoryConnector HerrajeCategory = "connector"    // Conector
	CategoryAdjuster  HerrajeCategory = "adjuster"     // Ajustador
	CategoryPin       HerrajeCategory = "pin"          // Pasador
	CategoryWasher    HerrajeCategory = "washer"       // Rondana
	CategoryOther     HerrajeCategory = "other"        // Otros
)

// HolePattern represents the pattern of holes on glass
type HolePattern string

const (
	PatternSingle HolePattern = "single"           // Single hole
	PatternPair   HolePattern = "pair"             // Two holes vertically aligned
	PatternGrid   HolePattern = "grid"             // Multiple holes in a grid
	PatternLinear HolePattern = "linear"           // Holes in a line
	PatternCustom HolePattern = "custom"           // Custom pattern
)

// HerrajeSpecs holds detailed specifications
type HerrajeSpecs struct {
	GlassThicknessRange string  `json:"glass_thickness_range"`   // e.g., "6 to 9mm"
	MinDistance         float64 `json:"min_distance"`            // Minimum distance from edge in mm
	RecommendedDistance float64 `json:"recommended_distance"`    // Recommended distance from edge in mm
	Installation        string  `json:"installation"`            // Installation location (interior, exterior)
	Waterproof          bool    `json:"waterproof"`              // Waterproof capability
	LoadPerHole         float64 `json:"load_per_hole"`           // Load capacity per hole in kg
	InsertionDepth      float64 `json:"insertion_depth"`         // How far into the glass the hardware penetrates (mm)
	Quantity            string  `json:"quantity"`                // Default quantity (e.g., "1pz", "1 set")
	Compatibility       []string `json:"compatibility"`          // Compatible models
	RelatedParts        []string `json:"related_parts"`          // Related part codes
	SafetyNotes         string  `json:"safety_notes"`            // Important safety information
	MaintenanceNotes    string  `json:"maintenance_notes"`       // Maintenance recommendations
}

// HerrajeVariant represents different material/finish combinations
type HerrajeVariant struct {
	ID     int    `json:"id"`
	Code   string `json:"code"`          // Variant code (e.g., "1214104" for AISI 304 version)
	Name   string `json:"name"`          // Variant name
	Material string `json:"material"`    // Material type
	Finish string `json:"finish"`       // Finish type
}

// HerrajeRequest represents a request to create or update a herraje
type HerrajeRequest struct {
	Code            string        `json:"code" validate:"required,max=50"`
	Name            string        `json:"name" validate:"required,max=255"`
	Description     string        `json:"description" validate:"max=2000"`
	Category        string        `json:"category" validate:"required"`
	Material        string        `json:"material" validate:"required"`
	Finish          string        `json:"finish"`
	MaxLoad         float64       `json:"max_load" validate:"gte=0"`
	MinThickness    float64       `json:"min_thickness" validate:"gt=0"`
	MaxThickness    float64       `json:"max_thickness" validate:"gt=0"`
	HoleSize        float64       `json:"hole_size" validate:"gt=0"`
	CountersinkSize float64       `json:"countersink_size" validate:"gte=0"`
	CountersinkType string        `json:"countersink_type"`
	HolePattern     string        `json:"hole_pattern"`
	Positions       int           `json:"positions" validate:"gte=1"`
	PictureURL      string        `json:"picture_url"`
	Specs           HerrajeSpecs  `json:"specs"`
	Variants        []HerrajeVariant `json:"variants"`
	Notes           string        `json:"notes"`
	Active          bool          `json:"active"`
}

// HerrajeResponse represents the response structure for herraje API calls
type HerrajeResponse struct {
	Herraje   *Herraje   `json:"herraje,omitempty"`
	Herrajes  []Herraje  `json:"herrajes,omitempty"`
	Total     int        `json:"total,omitempty"`
	Message   string     `json:"message,omitempty"`
	Error     string     `json:"error,omitempty"`
}

// Validate validates the herraje data
func (h *Herraje) Validate() error {
	if h.Code == "" {
		return NewValidationError("code is required")
	}
	if h.Name == "" {
		return NewValidationError("name is required")
	}
	if h.HoleSize <= 0 {
		return NewValidationError("hole_size must be greater than 0")
	}
	if h.MinThickness <= 0 {
		return NewValidationError("min_thickness must be greater than 0")
	}
	if h.MaxThickness < h.MinThickness {
		return NewValidationError("max_thickness must be >= min_thickness")
	}
	if h.Positions <= 0 {
		return NewValidationError("positions must be greater than 0")
	}
	return nil
}

// MarshalSpecs serializes Specs to JSON for database storage
func (h *Herraje) MarshalSpecs() error {
	data, err := json.Marshal(h.Specs)
	if err != nil {
		return err
	}
	h.SpecsData = string(data)
	return nil
}

// UnmarshalSpecs deserializes JSON SpecsData to Specs
func (h *Herraje) UnmarshalSpecs() error {
	if h.SpecsData == "" {
		h.Specs = HerrajeSpecs{}
		return nil
	}
	return json.Unmarshal([]byte(h.SpecsData), &h.Specs)
}

// GetHolePositions calculates possible hole positions based on glass dimensions
func (h *Herraje) GetHolePositions(glassWidth, glassHeight float64) []Point {
	positions := []Point{}
	
	switch h.HolePattern {
	case PatternSingle:
		// Single hole at center
		positions = append(positions, Point{
			X: glassWidth / 2,
			Y: glassHeight / 2,
		})
	
	case PatternPair:
		// Two holes vertically centered
		centerX := glassWidth / 2
		spacing := 50.0 // Default spacing in mm
		positions = append(positions, Point{X: centerX, Y: spacing})
		positions = append(positions, Point{X: centerX, Y: glassHeight - spacing})
	
	case PatternLinear:
		// Holes in a horizontal line
		centerY := glassHeight / 2
		spacing := 80.0
		for x := spacing; x < glassWidth; x += spacing {
			positions = append(positions, Point{X: x, Y: centerY})
		}
	
	case PatternGrid:
		// Grid pattern
		spacingX := glassWidth / float64(h.Positions+1)
		spacingY := glassHeight / float64(h.Positions+1)
		for i := 1; i <= h.Positions; i++ {
			positions = append(positions, Point{
				X: float64(i) * spacingX,
				Y: float64(i) * spacingY,
			})
		}
	}
	
	return positions
}

// CreateCountersinkHole creates a countersink hole specification
func (h *Herraje) CreateCountersinkHole(center Point) Hole {
	hole := Hole{
		ID:        GenerateID(),
		Type:      HoleCircular,
		Center:    center,
		Radius:    h.HoleSize / 2,
		Tolerance: 0.5,
		Locked:    false,
		Visible:   true,
		Style:     DefaultStyle(),
	}
	return hole
}

// CreateAvellanado creates an avellanado (countersink) specification
func (h *Herraje) CreateAvellanado(center Point) Hole {
	// Avellanado is a countersink with specific angle
	hole := Hole{
		ID:        GenerateID(),
		Type:      HoleCircular,
		Center:    center,
		Radius:    h.CountersinkSize / 2,
		Tolerance: 0.5,
		Locked:    false,
		Visible:   true,
		Style:     DefaultStyle(),
	}
	return hole
}
