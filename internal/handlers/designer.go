package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"glass-optimizer/internal/models"
	"glass-optimizer/internal/services"

	"github.com/gorilla/mux"
)

// DesignHandler handles HTTP requests for design operations
type DesignHandler struct {
	service *services.DesignerService
	logger  *slog.Logger
}

// NewDesignHandler creates a new design handler instance
func NewDesignHandler(service *services.DesignerService, logger *slog.Logger) *DesignHandler {
	return &DesignHandler{
		service: service,
		logger:  logger,
	}
}

// ListDesigns handles GET /api/designs
func (h *DesignHandler) ListDesigns(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling list designs request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse query parameters
	limit := h.parseIntQuery(r, "limit", 50)
	offset := h.parseIntQuery(r, "offset", 0)
	search := r.URL.Query().Get("search")

	// Create filters if search is provided
	var filters *services.DesignFilters
	if search != "" {
		filters = &services.DesignFilters{
			Search: search,
		}
	}

	// Get designs from service
	response, err := h.service.GetDesigns(user.ID, limit, offset, filters)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return response
	h.writeJSONResponse(w, http.StatusOK, models.DesignResponse{
		Designs: response.Designs,
		Total:   response.Total,
	})
}

// CreateDesign handles POST /api/designs
func (h *DesignHandler) CreateDesign(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling create design request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse request body
	var req models.DesignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.handleError(w, models.NewValidationError("invalid JSON in request body"))
		return
	}

	// Create design
	design, err := h.service.CreateDesign(&req, user.ID)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return created design
	h.writeJSONResponse(w, http.StatusCreated, models.DesignResponse{
		Design:  design,
		Message: "Design created successfully",
	})
}

// GetDesign handles GET /api/designs/:id
func (h *DesignHandler) GetDesign(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling get design request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get design ID from URL
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.handleError(w, models.NewValidationError("invalid design ID"))
		return
	}

	// Get design from service
	design, err := h.service.GetDesign(id, user.ID)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return design
	h.writeJSONResponse(w, http.StatusOK, models.DesignResponse{
		Design: design,
	})
}

// UpdateDesign handles PUT /api/designs/{id}
func (h *DesignHandler) UpdateDesign(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling update design request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get design ID from URL
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.handleError(w, models.NewValidationError("invalid design ID"))
		return
	}

	// Parse request body
	var req models.DesignRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.handleError(w, models.NewValidationError("invalid JSON in request body"))
		return
	}

	// Update design
	design, err := h.service.UpdateDesign(id, &req, user.ID)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return updated design
	h.writeJSONResponse(w, http.StatusOK, models.DesignResponse{
		Design:  design,
		Message: "Design updated successfully",
	})
}

// DeleteDesign handles DELETE /api/designs/:id
func (h *DesignHandler) DeleteDesign(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling delete design request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get design ID from URL
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.handleError(w, models.NewValidationError("invalid design ID"))
		return
	}

	// Delete design
	err = h.service.DeleteDesign(id, user.ID)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return success response
	h.writeJSONResponse(w, http.StatusOK, models.DesignResponse{
		Message: "Design deleted successfully",
	})
}

// ValidateDesign handles POST /api/designs/{id}/validate
func (h *DesignHandler) ValidateDesign(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling validate design request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get design ID from URL
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.handleError(w, models.NewValidationError("invalid design ID"))
		return
	}

	// Get design
	design, err := h.service.GetDesign(id, user.ID)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Validate design
	result, err := h.service.ValidateDesign(design)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return validation result
	h.writeJSONResponse(w, http.StatusOK, map[string]interface{}{
		"validation": result,
		"design_id":  id,
	})
}

// CloneDesign handles POST /api/designs/{id}/clone
func (h *DesignHandler) CloneDesign(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling clone design request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Get design ID from URL
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.handleError(w, models.NewValidationError("invalid design ID"))
		return
	}

	// Parse request body for new name
	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.handleError(w, models.NewValidationError("invalid JSON in request body"))
		return
	}

	if req.Name == "" {
		h.handleError(w, models.NewValidationError("name is required for cloning"))
		return
	}

	// Clone design
	clonedDesign, err := h.service.CloneDesign(id, user.ID, req.Name)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return cloned design
	h.writeJSONResponse(w, http.StatusCreated, models.DesignResponse{
		Design:  clonedDesign,
		Message: "Design cloned successfully",
	})
}

// GetDesignTemplates handles GET /api/designs/templates
func (h *DesignHandler) GetDesignTemplates(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling get design templates request")

	// Get templates from service
	templates, err := h.service.GetDesignTemplates()
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return templates
	h.writeJSONResponse(w, http.StatusOK, map[string]interface{}{
		"templates": templates,
		"total":     len(templates),
	})
}

// CreateDesignFromTemplate handles POST /api/designs/templates/{template}/create
func (h *DesignHandler) CreateDesignFromTemplate(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling create design from template request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse template name from URL
	vars := mux.Vars(r)
	templateName := vars["template"]

	if templateName == "" {
		h.handleError(w, models.NewValidationError("template name is required"))
		return
	}

	// Parse request body for design name
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.handleError(w, models.NewValidationError("invalid JSON in request body"))
		return
	}

	if req.Name == "" {
		h.handleError(w, models.NewValidationError("name is required"))
		return
	}

	// Get templates
	templates, err := h.service.GetDesignTemplates()
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Find the template
	var selectedTemplate *services.DesignTemplate
	for _, template := range templates {
		if template.Name == templateName {
			selectedTemplate = &template
			break
		}
	}

	if selectedTemplate == nil {
		h.handleError(w, models.NewNotFoundError("template"))
		return
	}

	// Create design request from template
	designReq := &models.DesignRequest{
		Name:        req.Name,
		Description: req.Description,
		Width:       selectedTemplate.Width,
		Height:      selectedTemplate.Height,
		Thickness:   selectedTemplate.Thickness,
		Elements:    selectedTemplate.Elements,
	}

	// Create design
	design, err := h.service.CreateDesign(designReq, user.ID)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return created design
	h.writeJSONResponse(w, http.StatusCreated, models.DesignResponse{
		Design:  design,
		Message: "Design created from template successfully",
	})
}

// Helper methods

func (h *DesignHandler) parseIDFromURL(r *http.Request) (int, error) {
	vars := mux.Vars(r)
	idStr := vars["id"]

	if idStr == "" {
		return 0, models.NewValidationError("ID is required")
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, models.NewValidationError("invalid ID format")
	}

	if id <= 0 {
		return 0, models.NewValidationError("ID must be positive")
	}

	return id, nil
}

func (h *DesignHandler) parseIntQuery(r *http.Request, param string, defaultValue int) int {
	value := r.URL.Query().Get(param)
	if value == "" {
		return defaultValue
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}

	if parsed < 0 {
		return defaultValue
	}

	return parsed
}

func (h *DesignHandler) handleError(w http.ResponseWriter, err error) {
	statusCode := models.GetHTTPStatusCode(err)
	errorResponse := models.NewErrorResponse(err)

	h.logger.Error("HTTP request failed",
		"error", err.Error(),
		"status", statusCode)

	h.writeJSONResponse(w, statusCode, errorResponse)
}

func (h *DesignHandler) writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		h.logger.Error("Failed to encode JSON response", "error", err)
	}
}
