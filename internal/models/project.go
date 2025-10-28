package models

import (
	"encoding/json"
	"time"
)

// Project represents a collection of designs for optimization with hierarchical support
type Project struct {
	ID          int                 `json:"id" db:"id"`
	Name        string              `json:"name" db:"name"`
	Description string              `json:"description" db:"description"`
	UserID      int64               `json:"user_id" db:"user_id"`               // Owner of the project
	ParentID    *int                `json:"parent_id,omitempty" db:"parent_id"` // NULL for root projects
	Path        string              `json:"path" db:"path"`                     // Hierarchical path like /project1/subproject1
	Designs     string              `json:"-" db:"designs"`                     // JSON array of design IDs with quantities
	DesignList  []ProjectDesignItem `json:"designs_list"`                       // Parsed design list
	Children    []Project           `json:"children,omitempty"`                 // Child projects (subprojects)
	DesignCount int                 `json:"design_count"`                       // Number of designs in this project
	OptCount    int                 `json:"optimization_count"`                 // Number of optimizations in this project
	CreatedAt   time.Time           `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at" db:"updated_at"`
}

// ProjectDesignItem represents a design item within a project
type ProjectDesignItem struct {
	DesignID    int     `json:"design_id"`
	Design      *Design `json:"design,omitempty"`
	Quantity    int     `json:"quantity"`
	Priority    int     `json:"priority"`     // Higher priority pieces are placed first
	Notes       string  `json:"notes"`        // Optional notes for this design item
	UnitCost    float64 `json:"unit_cost"`    // Cost per unit if different from design
	TotalCost   float64 `json:"total_cost"`   // Calculated total cost for this quantity
	IsCompleted bool    `json:"is_completed"` // Whether this item has been manufactured
}

// ProjectRequest represents a request to create or update a project
type ProjectRequest struct {
	Name        string              `json:"name" validate:"required,min=1,max=255"`
	Description string              `json:"description" validate:"max=1000"`
	DesignList  []ProjectDesignItem `json:"designs_list" validate:"required,min=1"`
}

// ProjectResponse represents the response structure for project API calls
type ProjectResponse struct {
	Project  *Project  `json:"project,omitempty"`
	Projects []Project `json:"projects,omitempty"`
	Total    int       `json:"total,omitempty"`
	Message  string    `json:"message,omitempty"`
	Error    string    `json:"error,omitempty"`
}

// ProjectSummary provides a summary view of a project
type ProjectSummary struct {
	ID             int       `json:"id"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	TotalDesigns   int       `json:"total_designs"`
	TotalQuantity  int       `json:"total_quantity"`
	EstimatedCost  float64   `json:"estimated_cost"`
	CompletedItems int       `json:"completed_items"`
	PendingItems   int       `json:"pending_items"`
	CompletionRate float64   `json:"completion_rate"` // Percentage completed
	LastModified   time.Time `json:"last_modified"`
	CreatedAt      time.Time `json:"created_at"`
}

// Validate validates the project data
func (p *Project) Validate() error {
	if p.Name == "" {
		return NewValidationError("name is required")
	}
	if len(p.Name) > 255 {
		return NewValidationError("name cannot exceed 255 characters")
	}
	if len(p.Description) > 1000 {
		return NewValidationError("description cannot exceed 1000 characters")
	}

	// Projects can be empty (like directories) - no design requirement

	// Validate each design item if any exist
	for _, item := range p.DesignList {
		if item.DesignID <= 0 {
			return NewValidationFieldError("designs_list", "invalid design ID")
		}
		if item.Quantity <= 0 {
			return NewValidationFieldError("designs_list", "quantity must be positive")
		}
		if item.Priority < 0 {
			return NewValidationFieldError("designs_list", "priority cannot be negative")
		}
	}

	return nil
}

// MarshalDesigns serializes the DesignList to JSON for database storage
func (p *Project) MarshalDesigns() error {
	data, err := json.Marshal(p.DesignList)
	if err != nil {
		return err
	}
	p.Designs = string(data)
	return nil
}

// UnmarshalDesigns deserializes the JSON Designs to DesignList
func (p *Project) UnmarshalDesigns() error {
	if p.Designs == "" {
		p.DesignList = []ProjectDesignItem{}
		return nil
	}
	return json.Unmarshal([]byte(p.Designs), &p.DesignList)
}

// GetTotalQuantity calculates the total quantity of all design items
func (p *Project) GetTotalQuantity() int {
	total := 0
	for _, item := range p.DesignList {
		total += item.Quantity
	}
	return total
}

// GetTotalCost calculates the total estimated cost of the project
func (p *Project) GetTotalCost() float64 {
	total := 0.0
	for _, item := range p.DesignList {
		if item.TotalCost > 0 {
			total += item.TotalCost
		} else if item.UnitCost > 0 {
			total += item.UnitCost * float64(item.Quantity)
		} else if item.Design != nil {
			// Estimate cost based on area if no specific cost is set
			area := item.Design.AreaInSquareMeters()
			estimatedCost := area * 50.0 * float64(item.Quantity) // Default $50 per m²
			total += estimatedCost
		}
	}
	return total
}

// GetCompletionRate calculates the completion rate as a percentage
func (p *Project) GetCompletionRate() float64 {
	if len(p.DesignList) == 0 {
		return 0.0
	}

	completed := 0
	for _, item := range p.DesignList {
		if item.IsCompleted {
			completed++
		}
	}

	return (float64(completed) / float64(len(p.DesignList))) * 100.0
}

// GetCompletedItemsCount returns the number of completed items
func (p *Project) GetCompletedItemsCount() int {
	completed := 0
	for _, item := range p.DesignList {
		if item.IsCompleted {
			completed++
		}
	}
	return completed
}

// GetPendingItemsCount returns the number of pending items
func (p *Project) GetPendingItemsCount() int {
	pending := 0
	for _, item := range p.DesignList {
		if !item.IsCompleted {
			pending++
		}
	}
	return pending
}

// GetSummary returns a summary view of the project
func (p *Project) GetSummary() ProjectSummary {
	return ProjectSummary{
		ID:             p.ID,
		Name:           p.Name,
		Description:    p.Description,
		TotalDesigns:   len(p.DesignList),
		TotalQuantity:  p.GetTotalQuantity(),
		EstimatedCost:  p.GetTotalCost(),
		CompletedItems: p.GetCompletedItemsCount(),
		PendingItems:   p.GetPendingItemsCount(),
		CompletionRate: p.GetCompletionRate(),
		LastModified:   p.UpdatedAt,
		CreatedAt:      p.CreatedAt,
	}
}

// AddDesign adds a design to the project
func (p *Project) AddDesign(designID int, quantity int, priority int, notes string) {
	item := ProjectDesignItem{
		DesignID: designID,
		Quantity: quantity,
		Priority: priority,
		Notes:    notes,
	}
	p.DesignList = append(p.DesignList, item)
}

// RemoveDesign removes a design from the project by design ID
func (p *Project) RemoveDesign(designID int) bool {
	for i, item := range p.DesignList {
		if item.DesignID == designID {
			p.DesignList = append(p.DesignList[:i], p.DesignList[i+1:]...)
			return true
		}
	}
	return false
}

// UpdateDesignQuantity updates the quantity for a specific design
func (p *Project) UpdateDesignQuantity(designID int, quantity int) bool {
	for i := range p.DesignList {
		if p.DesignList[i].DesignID == designID {
			p.DesignList[i].Quantity = quantity
			return true
		}
	}
	return false
}

// GetDesignByID returns a design item by design ID
func (p *Project) GetDesignByID(designID int) *ProjectDesignItem {
	for i := range p.DesignList {
		if p.DesignList[i].DesignID == designID {
			return &p.DesignList[i]
		}
	}
	return nil
}

// SortDesignsByPriority sorts design items by priority (highest first)
func (p *Project) SortDesignsByPriority() {
	if len(p.DesignList) <= 1 {
		return
	}

	// Simple bubble sort by priority (descending)
	for i := 0; i < len(p.DesignList)-1; i++ {
		for j := 0; j < len(p.DesignList)-i-1; j++ {
			if p.DesignList[j].Priority < p.DesignList[j+1].Priority {
				p.DesignList[j], p.DesignList[j+1] = p.DesignList[j+1], p.DesignList[j]
			}
		}
	}
}

// Clone creates a deep copy of the project
func (p *Project) Clone() (*Project, error) {
	data, err := json.Marshal(p)
	if err != nil {
		return nil, err
	}

	var clone Project
	if err := json.Unmarshal(data, &clone); err != nil {
		return nil, err
	}

	// Reset ID for new project
	clone.ID = 0
	clone.CreatedAt = time.Time{}
	clone.UpdatedAt = time.Time{}

	return &clone, nil
}

// IsRoot returns true if this is a root project (no parent)
func (p *Project) IsRoot() bool {
	return p.ParentID == nil
}

// GetDepth returns the depth level of this project in the hierarchy
func (p *Project) GetDepth() int {
	if p.Path == "/" {
		return 0
	}
	depth := 0
	for _, char := range p.Path {
		if char == '/' {
			depth++
		}
	}
	return depth
}

// GetParentPath returns the path of the parent project
func (p *Project) GetParentPath() string {
	if p.IsRoot() {
		return "/"
	}
	lastSlash := 0
	for i := len(p.Path) - 1; i >= 0; i-- {
		if p.Path[i] == '/' {
			lastSlash = i
			break
		}
	}
	if lastSlash == 0 {
		return "/"
	}
	return p.Path[:lastSlash]
}

// BuildPath constructs the hierarchical path from parent path and project name
func BuildPath(parentPath, projectName string) string {
	if parentPath == "/" {
		return "/" + projectName
	}
	return parentPath + "/" + projectName
}

// ProjectTreeNode represents a project in a tree structure
type ProjectTreeNode struct {
	Project  *Project          `json:"project"`
	Children []ProjectTreeNode `json:"children,omitempty"`
}

// CalculateItemCosts calculates individual item costs based on design areas
func (p *Project) CalculateItemCosts(costPerSqm float64) {
	for i := range p.DesignList {
		item := &p.DesignList[i]
		if item.Design != nil {
			area := item.Design.AreaInSquareMeters()
			item.UnitCost = area * costPerSqm
			item.TotalCost = item.UnitCost * float64(item.Quantity)
		}
	}
}

// GetDesignsByStatus returns designs filtered by completion status
func (p *Project) GetDesignsByStatus(completed bool) []ProjectDesignItem {
	var filtered []ProjectDesignItem
	for _, item := range p.DesignList {
		if item.IsCompleted == completed {
			filtered = append(filtered, item)
		}
	}
	return filtered
}

// MarkDesignCompleted marks a design as completed
func (p *Project) MarkDesignCompleted(designID int) bool {
	for i := range p.DesignList {
		if p.DesignList[i].DesignID == designID {
			p.DesignList[i].IsCompleted = true
			return true
		}
	}
	return false
}

// MarkDesignPending marks a design as pending
func (p *Project) MarkDesignPending(designID int) bool {
	for i := range p.DesignList {
		if p.DesignList[i].DesignID == designID {
			p.DesignList[i].IsCompleted = false
			return true
		}
	}
	return false
}
