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

// OptimizerHandler handles HTTP requests for optimization operations
type OptimizerHandler struct {
	service *services.OptimizerService
	logger  *slog.Logger
}

// NewOptimizerHandler creates a new optimizer handler instance
func NewOptimizerHandler(service *services.OptimizerService, logger *slog.Logger) *OptimizerHandler {
	return &OptimizerHandler{
		service: service,
		logger:  logger,
	}
}

// RunOptimization handles POST /api/optimize
func (h *OptimizerHandler) RunOptimization(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling run optimization request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse request body
	var req models.OptimizationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.handleError(w, models.NewValidationError("invalid JSON in request body"))
		return
	}

	// Run optimization
	optimization, err := h.service.RunOptimization(&req, user.ID)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return optimization result
	h.writeJSONResponse(w, http.StatusCreated, models.OptimizationResponse{
		Optimization: optimization,
		Message:      "Optimization completed successfully",
	})
}

// ListOptimizations handles GET /api/optimizations
func (h *OptimizerHandler) ListOptimizations(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling list optimizations request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse query parameters
	limit := h.parseIntQuery(r, "limit", 50)
	offset := h.parseIntQuery(r, "offset", 0)

	// Get optimizations from service
	response, err := h.service.GetOptimizations(user.ID, limit, offset)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return response
	h.writeJSONResponse(w, http.StatusOK, models.OptimizationResponse{
		Optimizations: response.Optimizations,
		Total:         response.Total,
	})
}

// GetOptimization handles GET /api/optimizations/{id}
func (h *OptimizerHandler) GetOptimization(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling get optimization request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse ID from URL
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.handleError(w, models.NewValidationError("invalid optimization ID"))
		return
	}

	// Get optimization from service
	optimization, err := h.service.GetOptimization(id, user.ID)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return optimization
	h.writeJSONResponse(w, http.StatusOK, models.OptimizationResponse{
		Optimization: optimization,
	})
}

// ExportOptimization handles GET /api/optimizations/{id}/export
func (h *OptimizerHandler) ExportOptimization(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling export optimization request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse ID from URL
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.handleError(w, models.NewValidationError("invalid optimization ID"))
		return
	}

	// Parse format from query params
	format := r.URL.Query().Get("format")
	if format == "" {
		format = "pdf" // default format
	}

	// Export optimization
	result, err := h.service.ExportOptimization(id, user.ID, format)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Set appropriate content type and headers based on format
	switch format {
	case "json":
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Content-Disposition", "attachment; filename="+result.Filename)
		h.writeJSONResponse(w, http.StatusOK, result)
	case "svg":
		w.Header().Set("Content-Type", "image/svg+xml")
		w.Header().Set("Content-Disposition", "attachment; filename="+result.Filename)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(result.Data.(string)))
	case "dxf":
		w.Header().Set("Content-Type", "application/dxf")
		w.Header().Set("Content-Disposition", "attachment; filename="+result.Filename)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(result.Data.(string)))
	case "cutting_list", "txt":
		w.Header().Set("Content-Type", "text/plain")
		w.Header().Set("Content-Disposition", "attachment; filename="+result.Filename)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(result.Data.(string)))
	default:
		h.writeJSONResponse(w, http.StatusOK, result)
	}
}

// GetOptimizationStatistics handles GET /api/optimizations/{id}/statistics
// GetOptimizerSettings handles GET /api/optimizer/settings
func (h *OptimizerHandler) GetOptimizerSettings(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling get optimizer settings request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse ID from URL
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.handleError(w, models.NewValidationError("invalid optimization ID"))
		return
	}

	// Get optimization for settings context
	optimization, err := h.service.GetOptimization(id, user.ID)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Create detailed statistics response
	stats := map[string]interface{}{
		"optimization_id":     optimization.ID,
		"name":                optimization.Name,
		"algorithm":           optimization.Algorithm,
		"execution_time":      optimization.ExecutionTime,
		"sheet_utilization":   optimization.Layout.Statistics.UtilizationRate,
		"waste_percentage":    optimization.Layout.Statistics.WasteRate,
		"material_efficiency": optimization.Layout.Statistics.MaterialEfficiency,
		"total_pieces":        optimization.Layout.Statistics.TotalPieces,
		"placed_pieces":       optimization.Layout.Statistics.PlacedPieces,
		"unplaced_pieces":     optimization.Layout.Statistics.UnplacedPieces,
		"cutting_length":      optimization.Layout.Statistics.CuttingLength,
		"estimated_cut_time":  optimization.Layout.Statistics.CuttingTime,
		"total_area":          optimization.TotalArea,
		"used_area":           optimization.UsedArea,
		"wasted_area":         optimization.WastedArea,
		"total_cost":          optimization.TotalCost,
		"cost_per_sqm":        optimization.Sheet.PricePerSqm,
		"sheet_dimensions": map[string]float64{
			"width":     optimization.Sheet.Width,
			"height":    optimization.Sheet.Height,
			"thickness": optimization.Sheet.Thickness,
		},
	}

	// Return statistics
	h.writeJSONResponse(w, http.StatusOK, map[string]interface{}{
		"statistics": stats,
	})
}

// CompareOptimizations handles POST /api/optimizations/compare
func (h *OptimizerHandler) CompareOptimizations(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling compare optimizations request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse request body
	var req struct {
		OptimizationIDs []int `json:"optimization_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.handleError(w, models.NewValidationError("invalid JSON in request body"))
		return
	}

	// Validate we have exactly 2 optimizations
	if len(req.OptimizationIDs) != 2 {
		h.handleError(w, models.NewValidationError("exactly 2 optimization IDs are required for comparison"))
		return
	}

	// Fetch all optimizations
	var optimizations []*models.Optimization
	for _, id := range req.OptimizationIDs {
		opt, err := h.service.GetOptimization(id, user.ID)
		if err != nil {
			h.handleError(w, err)
			return
		}
		optimizations = append(optimizations, opt)
	}

	// Create comparison data
	comparison := map[string]interface{}{
		"optimizations":       make([]map[string]interface{}, len(optimizations)),
		"best_by_utilization": nil,
		"best_by_efficiency":  nil,
		"fastest_algorithm":   nil,
	}

	bestUtilization := 0.0
	bestEfficiency := 0.0
	fastestTime := float64(999999)
	var bestUtilOpt, bestEffOpt, fastestOpt *models.Optimization

	for i, opt := range optimizations {
		optData := map[string]interface{}{
			"id":                  opt.ID,
			"name":                opt.Name,
			"algorithm":           opt.Algorithm,
			"utilization_rate":    opt.Layout.Statistics.UtilizationRate,
			"material_efficiency": opt.Layout.Statistics.MaterialEfficiency,
			"waste_rate":          opt.Layout.Statistics.WasteRate,
			"execution_time":      opt.ExecutionTime,
			"placed_pieces":       opt.Layout.Statistics.PlacedPieces,
			"total_pieces":        opt.Layout.Statistics.TotalPieces,
			"cutting_length":      opt.Layout.Statistics.CuttingLength,
			"total_cost":          opt.TotalCost,
		}

		comparison["optimizations"].([]map[string]interface{})[i] = optData

		// Track best performers
		if opt.Layout.Statistics.UtilizationRate > bestUtilization {
			bestUtilization = opt.Layout.Statistics.UtilizationRate
			bestUtilOpt = opt
		}

		if opt.Layout.Statistics.MaterialEfficiency > bestEfficiency {
			bestEfficiency = opt.Layout.Statistics.MaterialEfficiency
			bestEffOpt = opt
		}

		if opt.ExecutionTime < fastestTime {
			fastestTime = opt.ExecutionTime
			fastestOpt = opt
		}
	}

	// Set best performers
	if bestUtilOpt != nil {
		comparison["best_by_utilization"] = map[string]interface{}{
			"id":   bestUtilOpt.ID,
			"name": bestUtilOpt.Name,
			"rate": bestUtilization,
		}
	}

	if bestEffOpt != nil {
		comparison["best_by_efficiency"] = map[string]interface{}{
			"id":         bestEffOpt.ID,
			"name":       bestEffOpt.Name,
			"efficiency": bestEfficiency,
		}
	}

	if fastestOpt != nil {
		comparison["fastest_algorithm"] = map[string]interface{}{
			"id":             fastestOpt.ID,
			"name":           fastestOpt.Name,
			"algorithm":      fastestOpt.Algorithm,
			"execution_time": fastestTime,
		}
	}

	// Return comparison
	h.writeJSONResponse(w, http.StatusOK, comparison)
}

// RerunOptimization handles POST /api/optimizations/{id}/rerun
// AnalyzeOptimization handles POST /api/optimizations/{id}/analyze
func (h *OptimizerHandler) AnalyzeOptimization(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling analyze optimization request")

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse ID from URL
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		h.handleError(w, models.NewValidationError("invalid optimization ID"))
		return
	}

	// Get optimization
	optimization, err := h.service.GetOptimization(id, user.ID)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Parse optional new parameters
	var req struct {
		Name      string                  `json:"name,omitempty"`
		Algorithm string                  `json:"algorithm,omitempty"`
		Options   *models.OptimizeOptions `json:"options,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// Body is optional, continue with existing parameters
	}

	// Create new optimization request based on existing one
	optimizationReq := &models.OptimizationRequest{
		Name:      optimization.Name + " (Rerun)",
		SheetID:   optimization.SheetID,
		Designs:   optimization.DesignList,
		Algorithm: optimization.Algorithm,
		Options:   models.OptimizeOptions{}, // Use default options
	}

	// Override with new parameters if provided
	if req.Name != "" {
		optimizationReq.Name = req.Name
	}
	if req.Algorithm != "" {
		optimizationReq.Algorithm = req.Algorithm
	}
	if req.Options != nil {
		optimizationReq.Options = *req.Options
	}

	// Run new optimization
	newOptimization, err := h.service.RunOptimization(optimizationReq, user.ID)
	if err != nil {
		h.handleError(w, err)
		return
	}

	// Return new optimization result
	h.writeJSONResponse(w, http.StatusCreated, models.OptimizationResponse{
		Optimization: newOptimization,
		Message:      "Optimization analysis completed successfully",
	})
}

// Helper methods

func (h *OptimizerHandler) parseIDFromURL(r *http.Request) (int, error) {
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

func (h *OptimizerHandler) parseIntQuery(r *http.Request, param string, defaultValue int) int {
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

func (h *OptimizerHandler) handleError(w http.ResponseWriter, err error) {
	statusCode := models.GetHTTPStatusCode(err)
	errorResponse := models.NewErrorResponse(err)

	h.logger.Error("HTTP request failed",
		"error", err.Error(),
		"status", statusCode)

	h.writeJSONResponse(w, statusCode, errorResponse)
}

func (h *OptimizerHandler) writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		h.logger.Error("Failed to encode JSON response", "error", err)
	}
}
