package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"glass-optimizer/internal/models"
	"glass-optimizer/internal/services"
	"glass-optimizer/internal/storage"
)

type ProjectHandler struct {
	storage storage.Storage
	logger  *slog.Logger
}

func NewProjectHandler(storage storage.Storage, logger *slog.Logger) *ProjectHandler {
	return &ProjectHandler{
		storage: storage,
		logger:  logger,
	}
}

// HandleProjects handles GET (list) and POST (create) for /api/projects
func (h *ProjectHandler) HandleProjects(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listProjects(w, r)
	case http.MethodPost:
		h.createProject(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleProjectByID handles GET, PUT, DELETE for /api/projects/:id
func (h *ProjectHandler) HandleProjectByID(w http.ResponseWriter, r *http.Request) {
	// Extract ID from path
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.getProject(w, r, id)
	case http.MethodPut:
		h.updateProject(w, r, id)
	case http.MethodDelete:
		h.deleteProject(w, r, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleProjectDesigns handles GET /api/projects/:id/designs
func (h *ProjectHandler) HandleProjectDesigns(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	// First verify the project belongs to the user
	_, err = h.storage.GetProject(id, user.ID)
	if err != nil {
		h.logger.Error("Failed to verify project ownership", "error", err, "project_id", id, "user_id", user.ID)
		if models.IsNotFoundError(err) {
			http.Error(w, "Project not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to access project", http.StatusInternalServerError)
		}
		return
	}

	// TODO: GetDesignsByProject needs to be updated to filter by user_id
	// For now, return empty results to avoid security issues
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"designs": []interface{}{},
		"total":   0,
		"message": "Project designs temporarily disabled for security",
	})
}

// HandleProjectOptimizations handles GET /api/projects/:id/optimizations
func (h *ProjectHandler) HandleProjectOptimizations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	// First verify the project belongs to the user
	_, err = h.storage.GetProject(id, user.ID)
	if err != nil {
		h.logger.Error("Failed to verify project ownership", "error", err, "project_id", id, "user_id", user.ID)
		if models.IsNotFoundError(err) {
			http.Error(w, "Project not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to access project", http.StatusInternalServerError)
		}
		return
	}

	optimizations, err := h.storage.(*storage.SQLiteStorage).GetOptimizationsByProject(id, user.ID)
	if err != nil {
		h.logger.Error("Failed to get optimizations by project", "error", err, "project_id", id, "user_id", user.ID)
		http.Error(w, "Failed to get optimizations", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"optimizations": optimizations,
		"total":         len(optimizations),
	})
}

// HandleProjectTree handles GET /api/projects/tree
func (h *ProjectHandler) HandleProjectTree(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	projects, err := h.storage.(*storage.SQLiteStorage).GetProjectTree(user.ID)
	if err != nil {
		h.logger.Error("Failed to get project tree", "error", err, "user_id", user.ID)
		http.Error(w, "Failed to get project tree", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"projects": projects,
		"total":    len(projects),
	})
}

// Private methods

func (h *ProjectHandler) listProjects(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Check if tree view is requested
	if r.URL.Query().Get("tree") == "true" {
		h.HandleProjectTree(w, r)
		return
	}

	// Parse query parameters
	limit := 100
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	projects, total, err := h.storage.GetProjects(user.ID, limit, offset)
	if err != nil {
		h.logger.Error("Failed to get projects", "error", err, "user_id", user.ID)
		http.Error(w, "Failed to get projects", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"projects": projects,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

func (h *ProjectHandler) createProject(w http.ResponseWriter, r *http.Request) {
	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var project models.Project

	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		h.logger.Error("Failed to decode project", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Set the user ID for the project
	project.UserID = user.ID

	if err := h.storage.CreateProject(&project); err != nil {
		h.logger.Error("Failed to create project", "error", err, "user_id", user.ID)
		if models.IsValidationError(err) {
			http.Error(w, err.Error(), http.StatusBadRequest)
		} else {
			http.Error(w, "Failed to create project", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"project": project,
		"message": "Project created successfully",
	})
}

func (h *ProjectHandler) getProject(w http.ResponseWriter, r *http.Request, id int) {
	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	project, err := h.storage.GetProject(id, user.ID)
	if err != nil {
		h.logger.Error("Failed to get project", "error", err, "id", id, "user_id", user.ID)
		if models.IsNotFoundError(err) {
			http.Error(w, "Project not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to get project", http.StatusInternalServerError)
		}
		return
	}

	// Also get children (subprojects)
	children, err := h.storage.(*storage.SQLiteStorage).GetProjectsByParent(&id, user.ID)
	if err == nil {
		project.Children = children
	} else {
		h.logger.Warn("Failed to load project children", "error", err, "project_id", id, "user_id", user.ID)
		// Continue without children rather than failing the whole request
		project.Children = []models.Project{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"project": project,
	})
}

func (h *ProjectHandler) updateProject(w http.ResponseWriter, r *http.Request, id int) {
	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var project models.Project

	if err := json.NewDecoder(r.Body).Decode(&project); err != nil {
		h.logger.Error("Failed to decode project", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	project.ID = id
	project.UserID = user.ID

	if err := h.storage.UpdateProject(&project, user.ID); err != nil {
		h.logger.Error("Failed to update project", "error", err, "id", id, "user_id", user.ID)
		if models.IsNotFoundError(err) {
			http.Error(w, "Project not found", http.StatusNotFound)
		} else if models.IsValidationError(err) {
			http.Error(w, err.Error(), http.StatusBadRequest)
		} else {
			http.Error(w, "Failed to update project", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"project": project,
		"message": "Project updated successfully",
	})
}

func (h *ProjectHandler) deleteProject(w http.ResponseWriter, r *http.Request, id int) {
	// Get user from context
	user := services.GetUserFromContext(r.Context())
	if user == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.storage.DeleteProject(id, user.ID); err != nil {
		h.logger.Error("Failed to delete project", "error", err, "id", id, "user_id", user.ID)
		if models.IsNotFoundError(err) {
			http.Error(w, "Project not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to delete project", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Project deleted successfully",
	})
}
