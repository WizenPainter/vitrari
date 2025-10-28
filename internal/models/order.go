package models

import (
	"encoding/json"
	"time"
)

// Order represents a customer order containing designs with quantities
type Order struct {
	ID          int         `json:"id" db:"id"`
	Title       string      `json:"title" db:"title"`                     // Título del pedido
	Subtitle    string      `json:"subtitle" db:"subtitle"`               // Subtítulo del pedido
	Description string      `json:"description" db:"description"`         // Descripción del pedido
	UserID      int64       `json:"user_id" db:"user_id"`                 // Owner of the order
	ProjectID   *int        `json:"project_id,omitempty" db:"project_id"` // Link to project (optional)
	Items       string      `json:"-" db:"items"`                         // JSON blob of order items
	ItemsList   []OrderItem `json:"items_list"`                           // Parsed order items
	Status      OrderStatus `json:"status" db:"status"`                   // Estado del pedido
	Notes       string      `json:"notes" db:"notes"`                     // Notas adicionales
	DueDate     *time.Time  `json:"due_date,omitempty" db:"due_date"`     // Fecha de entrega
	CreatedAt   time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at" db:"updated_at"`
}

// OrderItem represents an individual design item within an order
type OrderItem struct {
	ID          string  `json:"id"`               // Unique ID for this item
	DesignID    int     `json:"design_id"`        // ID of the design
	Design      *Design `json:"design,omitempty"` // Design details (populated when loaded)
	Quantity    int     `json:"quantity"`         // Cantidad de piezas
	Notes       string  `json:"notes"`            // Notas específicas para este item
	Priority    int     `json:"priority"`         // Prioridad (1-5, siendo 5 la más alta)
	IsCompleted bool    `json:"is_completed"`     // Si este item está completado
	Works       []Work  `json:"works"`            // Lista de trabajos para este diseño
}

// Work represents a specific work item for a design (taladros, resaques, etc.)
type Work struct {
	ID          string   `json:"id"`
	Type        WorkType `json:"type"`        // Tipo de trabajo
	Description string   `json:"description"` // Descripción del trabajo
	Quantity    int      `json:"quantity"`    // Cantidad de este trabajo en el diseño
	UnitTime    float64  `json:"unit_time"`   // Tiempo estimado por unidad (en minutos)
	TotalTime   float64  `json:"total_time"`  // Tiempo total estimado
	IsCompleted bool     `json:"is_completed"`
}

// OrderStatus represents the status of an order
type OrderStatus string

const (
	OrderStatusPending    OrderStatus = "pendiente"  // Pendiente
	OrderStatusInProgress OrderStatus = "en_proceso" // En proceso
	OrderStatusCompleted  OrderStatus = "completado" // Completado
	OrderStatusCancelled  OrderStatus = "cancelado"  // Cancelado
	OrderStatusOnHold     OrderStatus = "pausado"    // Pausado
)

// WorkType represents the type of work to be performed
type WorkType string

const (
	WorkTypeTaladro    WorkType = "taladro"             // Drill hole
	WorkTypeCircleHole WorkType = "resaque_circular"    // Circle hole
	WorkTypeRectHole   WorkType = "resaque_rectangular" // Rectangle hole
	WorkTypeAvellanado WorkType = "avellanado"          // Countersink
	WorkTypeEdgeClip   WorkType = "clip_borde"          // Edge clip
	WorkTypeCut        WorkType = "corte"               // Cut
	WorkTypePolishing  WorkType = "pulido"              // Polishing
	WorkTypeAssembly   WorkType = "ensamblaje"          // Assembly
)

// OrderRequest represents a request to create or update an order
type OrderRequest struct {
	Title       string      `json:"title" validate:"required,min=1,max=255"`
	Subtitle    string      `json:"subtitle" validate:"max=255"`
	Description string      `json:"description" validate:"max=1000"`
	ItemsList   []OrderItem `json:"items_list" validate:"required,min=1"`
	Notes       string      `json:"notes" validate:"max=1000"`
	DueDate     *time.Time  `json:"due_date,omitempty"`
}

// OrderResponse represents the response structure for order API calls
type OrderResponse struct {
	Order   *Order  `json:"order,omitempty"`
	Orders  []Order `json:"orders,omitempty"`
	Total   int     `json:"total,omitempty"`
	Message string  `json:"message,omitempty"`
	Error   string  `json:"error,omitempty"`
}

// OrderSummary provides a summary view of an order
type OrderSummary struct {
	ID             int         `json:"id"`
	Title          string      `json:"title"`
	Subtitle       string      `json:"subtitle"`
	Status         OrderStatus `json:"status"`
	TotalItems     int         `json:"total_items"`
	TotalQuantity  int         `json:"total_quantity"`
	CompletedItems int         `json:"completed_items"`
	PendingItems   int         `json:"pending_items"`
	CompletionRate float64     `json:"completion_rate"`
	DueDate        *time.Time  `json:"due_date,omitempty"`
	CreatedAt      time.Time   `json:"created_at"`
	UpdatedAt      time.Time   `json:"updated_at"`
}

// Validate validates the order data
func (o *Order) Validate() error {
	if o.Title == "" {
		return NewValidationError("título es requerido")
	}
	if len(o.Title) > 255 {
		return NewValidationError("título no puede exceder 255 caracteres")
	}
	if len(o.Subtitle) > 255 {
		return NewValidationError("subtítulo no puede exceder 255 caracteres")
	}
	if len(o.Description) > 1000 {
		return NewValidationError("descripción no puede exceder 1000 caracteres")
	}
	if len(o.Notes) > 1000 {
		return NewValidationError("notas no pueden exceder 1000 caracteres")
	}

	if len(o.ItemsList) == 0 {
		return NewValidationError("el pedido debe tener al menos un item")
	}

	// Validate each order item
	for i, item := range o.ItemsList {
		if item.DesignID <= 0 {
			return NewValidationFieldError("items_list", "ID de diseño inválido en item "+string(rune(i+1)))
		}
		if item.Quantity <= 0 {
			return NewValidationFieldError("items_list", "cantidad debe ser positiva en item "+string(rune(i+1)))
		}
		if item.Priority < 1 || item.Priority > 5 {
			return NewValidationFieldError("items_list", "prioridad debe estar entre 1 y 5 en item "+string(rune(i+1)))
		}
	}

	return nil
}

// MarshalItems serializes the ItemsList to JSON for database storage
func (o *Order) MarshalItems() error {
	data, err := json.Marshal(o.ItemsList)
	if err != nil {
		return err
	}
	o.Items = string(data)
	return nil
}

// UnmarshalItems deserializes the JSON Items to ItemsList
func (o *Order) UnmarshalItems() error {
	if o.Items == "" {
		o.ItemsList = []OrderItem{}
		return nil
	}
	return json.Unmarshal([]byte(o.Items), &o.ItemsList)
}

// GetTotalQuantity calculates the total quantity of all items
func (o *Order) GetTotalQuantity() int {
	total := 0
	for _, item := range o.ItemsList {
		total += item.Quantity
	}
	return total
}

// GetTotalItems returns the number of different design items
func (o *Order) GetTotalItems() int {
	return len(o.ItemsList)
}

// GetCompletionRate calculates the completion rate as a percentage
func (o *Order) GetCompletionRate() float64 {
	if len(o.ItemsList) == 0 {
		return 0.0
	}

	completed := 0
	for _, item := range o.ItemsList {
		if item.IsCompleted {
			completed++
		}
	}

	return (float64(completed) / float64(len(o.ItemsList))) * 100.0
}

// GetCompletedItemsCount returns the number of completed items
func (o *Order) GetCompletedItemsCount() int {
	completed := 0
	for _, item := range o.ItemsList {
		if item.IsCompleted {
			completed++
		}
	}
	return completed
}

// GetPendingItemsCount returns the number of pending items
func (o *Order) GetPendingItemsCount() int {
	pending := 0
	for _, item := range o.ItemsList {
		if !item.IsCompleted {
			pending++
		}
	}
	return pending
}

// GetSummary returns a summary view of the order
func (o *Order) GetSummary() OrderSummary {
	return OrderSummary{
		ID:             o.ID,
		Title:          o.Title,
		Subtitle:       o.Subtitle,
		Status:         o.Status,
		TotalItems:     o.GetTotalItems(),
		TotalQuantity:  o.GetTotalQuantity(),
		CompletedItems: o.GetCompletedItemsCount(),
		PendingItems:   o.GetPendingItemsCount(),
		CompletionRate: o.GetCompletionRate(),
		DueDate:        o.DueDate,
		CreatedAt:      o.CreatedAt,
		UpdatedAt:      o.UpdatedAt,
	}
}

// AddItem adds a design to the order
func (o *Order) AddItem(designID int, quantity int, priority int, notes string) {
	item := OrderItem{
		ID:       GenerateID(),
		DesignID: designID,
		Quantity: quantity,
		Priority: priority,
		Notes:    notes,
		Works:    []Work{}, // Will be populated based on design
	}
	o.ItemsList = append(o.ItemsList, item)
}

// RemoveItem removes an item from the order by item ID
func (o *Order) RemoveItem(itemID string) bool {
	for i, item := range o.ItemsList {
		if item.ID == itemID {
			o.ItemsList = append(o.ItemsList[:i], o.ItemsList[i+1:]...)
			return true
		}
	}
	return false
}

// UpdateItemQuantity updates the quantity for a specific item
func (o *Order) UpdateItemQuantity(itemID string, quantity int) bool {
	for i := range o.ItemsList {
		if o.ItemsList[i].ID == itemID {
			o.ItemsList[i].Quantity = quantity
			return true
		}
	}
	return false
}

// GetItemByID returns an order item by item ID
func (o *Order) GetItemByID(itemID string) *OrderItem {
	for i := range o.ItemsList {
		if o.ItemsList[i].ID == itemID {
			return &o.ItemsList[i]
		}
	}
	return nil
}

// MarkItemCompleted marks an item as completed
func (o *Order) MarkItemCompleted(itemID string) bool {
	for i := range o.ItemsList {
		if o.ItemsList[i].ID == itemID {
			o.ItemsList[i].IsCompleted = true
			return true
		}
	}
	return false
}

// MarkItemPending marks an item as pending
func (o *Order) MarkItemPending(itemID string) bool {
	for i := range o.ItemsList {
		if o.ItemsList[i].ID == itemID {
			o.ItemsList[i].IsCompleted = false
			return true
		}
	}
	return false
}

// SortItemsByPriority sorts order items by priority (highest first)
func (o *Order) SortItemsByPriority() {
	if len(o.ItemsList) <= 1 {
		return
	}

	// Simple bubble sort by priority (descending)
	for i := 0; i < len(o.ItemsList)-1; i++ {
		for j := 0; j < len(o.ItemsList)-i-1; j++ {
			if o.ItemsList[j].Priority < o.ItemsList[j+1].Priority {
				o.ItemsList[j], o.ItemsList[j+1] = o.ItemsList[j+1], o.ItemsList[j]
			}
		}
	}
}

// PopulateWorksFromDesign generates work items based on design elements
func (item *OrderItem) PopulateWorksFromDesign() {
	if item.Design == nil {
		return
	}

	works := make(map[WorkType]int)

	// Count holes by type
	for _, hole := range item.Design.Elements.Holes {
		switch hole.Type {
		case HoleCircular:
			works[WorkTypeCircleHole]++
		case HoleRectangular, HoleSquare:
			works[WorkTypeRectHole]++
		}
	}

	// Count cuts
	for _, cut := range item.Design.Elements.Cuts {
		switch cut.Type {
		case CutBeveled:
			works[WorkTypeAvellanado]++
		default:
			works[WorkTypeCut]++
		}
	}

	// Convert to Work items
	item.Works = []Work{}
	for workType, count := range works {
		if count > 0 {
			work := Work{
				ID:          GenerateID(),
				Type:        workType,
				Description: getWorkDescription(workType),
				Quantity:    count,
				UnitTime:    getEstimatedTime(workType),
			}
			work.TotalTime = work.UnitTime * float64(work.Quantity) * float64(item.Quantity)
			item.Works = append(item.Works, work)
		}
	}
}

// getWorkDescription returns a Spanish description for the work type
func getWorkDescription(workType WorkType) string {
	descriptions := map[WorkType]string{
		WorkTypeTaladro:    "Perforación con taladro",
		WorkTypeCircleHole: "Resaque circular",
		WorkTypeRectHole:   "Resaque rectangular",
		WorkTypeAvellanado: "Avellanado",
		WorkTypeEdgeClip:   "Clip de borde",
		WorkTypeCut:        "Corte",
		WorkTypePolishing:  "Pulido",
		WorkTypeAssembly:   "Ensamblaje",
	}
	if desc, exists := descriptions[workType]; exists {
		return desc
	}
	return string(workType)
}

// getEstimatedTime returns estimated time in minutes for each work type
func getEstimatedTime(workType WorkType) float64 {
	times := map[WorkType]float64{
		WorkTypeTaladro:    2.0,  // 2 minutes per drill
		WorkTypeCircleHole: 5.0,  // 5 minutes per circle hole
		WorkTypeRectHole:   8.0,  // 8 minutes per rectangle hole
		WorkTypeAvellanado: 3.0,  // 3 minutes per countersink
		WorkTypeEdgeClip:   1.0,  // 1 minute per edge clip
		WorkTypeCut:        10.0, // 10 minutes per cut
		WorkTypePolishing:  15.0, // 15 minutes per piece
		WorkTypeAssembly:   20.0, // 20 minutes per assembly
	}
	if time, exists := times[workType]; exists {
		return time
	}
	return 5.0 // Default 5 minutes
}

// Clone creates a deep copy of the order
func (o *Order) Clone() (*Order, error) {
	data, err := json.Marshal(o)
	if err != nil {
		return nil, err
	}

	var clone Order
	if err := json.Unmarshal(data, &clone); err != nil {
		return nil, err
	}

	// Reset ID for new order
	clone.ID = 0
	clone.CreatedAt = time.Time{}
	clone.UpdatedAt = time.Time{}

	return &clone, nil
}

// GetStatusDisplayName returns the Spanish display name for the status
func (status OrderStatus) GetDisplayName() string {
	statusNames := map[OrderStatus]string{
		OrderStatusPending:    "Pendiente",
		OrderStatusInProgress: "En Proceso",
		OrderStatusCompleted:  "Completado",
		OrderStatusCancelled:  "Cancelado",
		OrderStatusOnHold:     "Pausado",
	}
	if name, exists := statusNames[status]; exists {
		return name
	}
	return string(status)
}

// IsValidStatus checks if the status is valid
func IsValidOrderStatus(status string) bool {
	validStatuses := []OrderStatus{
		OrderStatusPending,
		OrderStatusInProgress,
		OrderStatusCompleted,
		OrderStatusCancelled,
		OrderStatusOnHold,
	}

	for _, validStatus := range validStatuses {
		if string(validStatus) == status {
			return true
		}
	}
	return false
}
