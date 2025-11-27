package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"glass-optimizer/internal/models"
	"glass-optimizer/internal/storage"
)

// HerrajeHandler handles herraje (hardware) related HTTP requests
type HerrajeHandler struct {
	store  storage.Storage
	logger *slog.Logger
}

// NewHerrajeHandler creates a new herraje handler
func NewHerrajeHandler(store storage.Storage, logger *slog.Logger) *HerrajeHandler {
	return &HerrajeHandler{
		store:  store,
		logger: logger,
	}
}

// HandleHerrajes handles GET and POST requests for herrajes
func (h *HerrajeHandler) HandleHerrajes(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		h.getHerrajes(w, r)
	case http.MethodPost:
		h.createHerraje(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleHerrajeByID handles GET, PUT, DELETE requests for specific herraje
func (h *HerrajeHandler) HandleHerrajeByID(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Extract ID from path
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		http.Error(w, "Invalid herraje ID", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(parts[2])
	if err != nil {
		http.Error(w, "Invalid herraje ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.getHerraje(w, r, id)
	case http.MethodPut:
		h.updateHerraje(w, r, id)
	case http.MethodDelete:
		h.deleteHerraje(w, r, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// getHerrajes retrieves all herrajes with optional filtering
func (h *HerrajeHandler) getHerrajes(w http.ResponseWriter, r *http.Request) {
	limit := 50
	offset := 0
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")

	// Parse pagination parameters
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	var herrajes []models.Herraje
	var total int
	var err error

	if search != "" {
		herrajes, total, err = h.store.SearchHerrajes(search, limit, offset)
	} else if category != "" {
		herrajes, total, err = h.store.GetHerrajesByCategory(category, limit, offset)
	} else {
		herrajes, total, err = h.store.GetHerrajes(limit, offset)
	}

	if err != nil {
		h.logger.Error("Failed to get herrajes", "error", err)
		http.Error(w, "Failed to get herrajes", http.StatusInternalServerError)
		return
	}

	if herrajes == nil {
		herrajes = []models.Herraje{}
	}

	response := models.HerrajeResponse{
		Herrajes: herrajes,
		Total:    total,
	}

	json.NewEncoder(w).Encode(response)
}

// getHerraje retrieves a single herraje by ID
func (h *HerrajeHandler) getHerraje(w http.ResponseWriter, r *http.Request, id int) {
	herraje, err := h.store.GetHerraje(id)
	if err != nil {
		if models.IsNotFoundError(err) {
			http.Error(w, "Herraje not found", http.StatusNotFound)
		} else {
			h.logger.Error("Failed to get herraje", "error", err, "id", id)
			http.Error(w, "Failed to get herraje", http.StatusInternalServerError)
		}
		return
	}

	response := models.HerrajeResponse{
		Herraje: herraje,
	}

	json.NewEncoder(w).Encode(response)
}

// createHerraje creates a new herraje
func (h *HerrajeHandler) createHerraje(w http.ResponseWriter, r *http.Request) {
	var req models.HerrajeRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("Failed to decode herraje request", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	herraje := &models.Herraje{
		Code:            req.Code,
		Name:            req.Name,
		Description:     req.Description,
		Category:        models.HerrajeCategory(req.Category),
		Material:        req.Material,
		Finish:          req.Finish,
		MaxLoad:         req.MaxLoad,
		MinThickness:    req.MinThickness,
		MaxThickness:    req.MaxThickness,
		HoleSize:        req.HoleSize,
		CountersinkSize: req.CountersinkSize,
		CountersinkType: req.CountersinkType,
		HolePattern:     models.HolePattern(req.HolePattern),
		Positions:       req.Positions,
		PictureURL:      req.PictureURL,
		Specs:           req.Specs,
		Variants:        req.Variants,
		Notes:           req.Notes,
		Active:          req.Active,
	}

	if err := h.store.CreateHerraje(herraje); err != nil {
		h.logger.Error("Failed to create herraje", "error", err)
		http.Error(w, "Failed to create herraje", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	response := models.HerrajeResponse{
		Herraje: herraje,
		Message: "Herraje created successfully",
	}

	json.NewEncoder(w).Encode(response)
}

// updateHerraje updates an existing herraje
func (h *HerrajeHandler) updateHerraje(w http.ResponseWriter, r *http.Request, id int) {
	var req models.HerrajeRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("Failed to decode herraje request", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	herraje := &models.Herraje{
		ID:              id,
		Code:            req.Code,
		Name:            req.Name,
		Description:     req.Description,
		Category:        models.HerrajeCategory(req.Category),
		Material:        req.Material,
		Finish:          req.Finish,
		MaxLoad:         req.MaxLoad,
		MinThickness:    req.MinThickness,
		MaxThickness:    req.MaxThickness,
		HoleSize:        req.HoleSize,
		CountersinkSize: req.CountersinkSize,
		CountersinkType: req.CountersinkType,
		HolePattern:     models.HolePattern(req.HolePattern),
		Positions:       req.Positions,
		PictureURL:      req.PictureURL,
		Specs:           req.Specs,
		Variants:        req.Variants,
		Notes:           req.Notes,
		Active:          req.Active,
	}

	if err := h.store.UpdateHerraje(herraje); err != nil {
		h.logger.Error("Failed to update herraje", "error", err, "id", id)
		http.Error(w, "Failed to update herraje", http.StatusInternalServerError)
		return
	}

	response := models.HerrajeResponse{
		Herraje: herraje,
		Message: "Herraje updated successfully",
	}

	json.NewEncoder(w).Encode(response)
}

// deleteHerraje deletes a herraje
func (h *HerrajeHandler) deleteHerraje(w http.ResponseWriter, r *http.Request, id int) {
	if err := h.store.DeleteHerraje(id); err != nil {
		h.logger.Error("Failed to delete herraje", "error", err, "id", id)
		http.Error(w, "Failed to delete herraje", http.StatusInternalServerError)
		return
	}

	response := models.HerrajeResponse{
		Message: "Herraje deleted successfully",
	}

	json.NewEncoder(w).Encode(response)
}
