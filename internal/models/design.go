package models

import (
	"encoding/json"
	"time"
)

// Design represents a glass design with all its properties and elements
type Design struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	Width       float64   `json:"width" db:"width"`         // in millimeters
	Height      float64   `json:"height" db:"height"`       // in millimeters
	Thickness   float64   `json:"thickness" db:"thickness"` // in millimeters
	DesignData  string    `json:"-" db:"design_data"`       // JSON blob
	Elements    Elements  `json:"elements"`                 // Parsed design elements
	ProjectID   *int      `json:"project_id,omitempty" db:"project_id"` // Link to project
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Elements holds all design elements within a glass piece
type Elements struct {
	Shapes []Shape `json:"shapes"`
	Holes  []Hole  `json:"holes"`
	Cuts   []Cut   `json:"cuts"`
	Notes  []Note  `json:"notes"`
}

// Shape represents the main outline of the glass piece
type Shape struct {
	ID      string    `json:"id"`
	Type    ShapeType `json:"type"`
	Points  []Point   `json:"points"`
	Style   Style     `json:"style"`
	Locked  bool      `json:"locked"`
	Visible bool      `json:"visible"`
}

// Hole represents a hole or cutout in the glass
type Hole struct {
	ID        string   `json:"id"`
	Type      HoleType `json:"type"`
	Center    Point    `json:"center"`
	Width     float64  `json:"width"`  // for rectangular holes
	Height    float64  `json:"height"` // for rectangular holes
	Radius    float64  `json:"radius"` // for circular holes
	Points    []Point  `json:"points"` // for custom shape holes
	Style     Style    `json:"style"`
	Tolerance float64  `json:"tolerance"` // manufacturing tolerance in mm
	Locked    bool     `json:"locked"`
	Visible   bool     `json:"visible"`
}

// Cut represents a cut or edge treatment
type Cut struct {
	ID      string  `json:"id"`
	Type    CutType `json:"type"`
	StartX  float64 `json:"start_x"`
	StartY  float64 `json:"start_y"`
	EndX    float64 `json:"end_x"`
	EndY    float64 `json:"end_y"`
	Depth   float64 `json:"depth"`
	Angle   float64 `json:"angle"`
	Style   Style   `json:"style"`
	Locked  bool    `json:"locked"`
	Visible bool    `json:"visible"`
}

// Note represents annotations and measurements on the design
type Note struct {
	ID       string   `json:"id"`
	Type     NoteType `json:"type"`
	Position Point    `json:"position"`
	Text     string   `json:"text"`
	Value    float64  `json:"value"` // for measurements
	Unit     string   `json:"unit"`  // mm, cm, inches, etc.
	Style    Style    `json:"style"`
	Locked   bool     `json:"locked"`
	Visible  bool     `json:"visible"`
}

// Point represents a 2D coordinate
type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// Style represents visual styling properties
type Style struct {
	StrokeColor string  `json:"stroke_color"`
	StrokeWidth float64 `json:"stroke_width"`
	FillColor   string  `json:"fill_color"`
	FillOpacity float64 `json:"fill_opacity"`
	LineDash    []int   `json:"line_dash"`
	FontSize    float64 `json:"font_size"`
	FontFamily  string  `json:"font_family"`
	TextColor   string  `json:"text_color"`
}

// ShapeType defines the type of shape
type ShapeType string

const (
	ShapeRectangle ShapeType = "rectangle"
	ShapeCircle    ShapeType = "circle"
	ShapeEllipse   ShapeType = "ellipse"
	ShapePolygon   ShapeType = "polygon"
	ShapeCustom    ShapeType = "custom"
)

// HoleType defines the type of hole
type HoleType string

const (
	HoleCircular    HoleType = "circular"
	HoleRectangular HoleType = "rectangular"
	HoleSquare      HoleType = "square"
	HoleSlot        HoleType = "slot"
	HoleCustom      HoleType = "custom"
)

// CutType defines the type of cut or edge treatment
type CutType string

const (
	CutStraight CutType = "straight"
	CutBeveled  CutType = "beveled"
	CutRounded  CutType = "rounded"
	CutNotched  CutType = "notched"
	CutCustom   CutType = "custom"
)

// NoteType defines the type of annotation
type NoteType string

const (
	NoteText        NoteType = "text"
	NoteMeasurement NoteType = "measurement"
	NoteDimension   NoteType = "dimension"
	NoteAngle       NoteType = "angle"
	NoteArea        NoteType = "area"
	NoteTooltip     NoteType = "tooltip"
)

// DesignRequest represents a request to create or update a design
type DesignRequest struct {
	Name        string   `json:"name" validate:"required,min=1,max=255"`
	Description string   `json:"description" validate:"max=1000"`
	Width       float64  `json:"width" validate:"required,gt=0,lte=10000"`
	Height      float64  `json:"height" validate:"required,gt=0,lte=10000"`
	Thickness   float64  `json:"thickness" validate:"required,gt=0,lte=50"`
	Elements    Elements `json:"elements" validate:"required"`
}

// DesignResponse represents the response structure for design API calls
type DesignResponse struct {
	Design  *Design  `json:"design,omitempty"`
	Designs []Design `json:"designs,omitempty"`
	Total   int      `json:"total,omitempty"`
	Message string   `json:"message,omitempty"`
	Error   string   `json:"error,omitempty"`
}

// Validate validates the design data
func (d *Design) Validate() error {
	if d.Name == "" {
		return NewValidationError("name is required")
	}
	if d.Width <= 0 {
		return NewValidationError("width must be greater than 0")
	}
	if d.Height <= 0 {
		return NewValidationError("height must be greater than 0")
	}
	if d.Thickness <= 0 {
		return NewValidationError("thickness must be greater than 0")
	}
	return nil
}

// Area calculates the total area of the design in square millimeters
func (d *Design) Area() float64 {
	return d.Width * d.Height
}

// AreaInSquareMeters returns the area in square meters
func (d *Design) AreaInSquareMeters() float64 {
	return d.Area() / 1000000.0 // Convert mm² to m²
}

// Volume calculates the volume in cubic millimeters
func (d *Design) Volume() float64 {
	return d.Width * d.Height * d.Thickness
}

// Perimeter calculates the perimeter of the rectangular design
func (d *Design) Perimeter() float64 {
	return 2 * (d.Width + d.Height)
}

// MarshalDesignData serializes the Elements to JSON for database storage
func (d *Design) MarshalDesignData() error {
	data, err := json.Marshal(d.Elements)
	if err != nil {
		return err
	}
	d.DesignData = string(data)
	return nil
}

// UnmarshalDesignData deserializes the JSON DesignData to Elements
func (d *Design) UnmarshalDesignData() error {
	if d.DesignData == "" {
		d.Elements = Elements{}
		return nil
	}

	return json.Unmarshal([]byte(d.DesignData), &d.Elements)
}

// Clone creates a deep copy of the design
func (d *Design) Clone() (*Design, error) {
	data, err := json.Marshal(d)
	if err != nil {
		return nil, err
	}

	var clone Design
	if err := json.Unmarshal(data, &clone); err != nil {
		return nil, err
	}

	// Reset ID for new design
	clone.ID = 0
	clone.CreatedAt = time.Time{}
	clone.UpdatedAt = time.Time{}

	return &clone, nil
}

// GetHoleArea calculates the total area of all holes
func (d *Design) GetHoleArea() float64 {
	totalArea := 0.0

	for _, hole := range d.Elements.Holes {
		switch hole.Type {
		case HoleCircular:
			// π * r²
			totalArea += 3.14159 * hole.Radius * hole.Radius
		case HoleRectangular, HoleSquare:
			totalArea += hole.Width * hole.Height
		case HoleSlot:
			// Slot is typically a rectangle with rounded ends
			rectArea := hole.Width * hole.Height
			if hole.Height > 0 {
				// Add circular ends (subtract overlap)
				circleArea := 3.14159 * (hole.Height / 2) * (hole.Height / 2)
				totalArea += rectArea + circleArea
			} else {
				totalArea += rectArea
			}
		case HoleCustom:
			// For custom holes, calculate area from points (simplified)
			if len(hole.Points) >= 3 {
				totalArea += calculatePolygonArea(hole.Points)
			}
		}
	}

	return totalArea
}

// GetEffectiveArea returns the glass area minus hole areas
func (d *Design) GetEffectiveArea() float64 {
	return d.Area() - d.GetHoleArea()
}

// calculatePolygonArea calculates area of a polygon using shoelace formula
func calculatePolygonArea(points []Point) float64 {
	if len(points) < 3 {
		return 0
	}

	area := 0.0
	n := len(points)

	for i := 0; i < n; i++ {
		j := (i + 1) % n
		area += points[i].X * points[j].Y
		area -= points[j].X * points[i].Y
	}

	return abs(area) / 2.0
}

// abs returns the absolute value of a float64
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

// DefaultStyle returns a default styling configuration
func DefaultStyle() Style {
	return Style{
		StrokeColor: "#000000",
		StrokeWidth: 1.0,
		FillColor:   "#ffffff",
		FillOpacity: 0.8,
		LineDash:    []int{},
		FontSize:    12.0,
		FontFamily:  "Arial, sans-serif",
		TextColor:   "#000000",
	}
}

// GenerateID generates a unique ID for design elements
func GenerateID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(6)
}

// randomString generates a random string of specified length
func randomString(length int) string {
	const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = chars[time.Now().UnixNano()%int64(len(chars))]
	}
	return string(result)
}
