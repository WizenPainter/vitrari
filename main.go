package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"

	"glass-optimizer/internal/handlers"
	"glass-optimizer/internal/models"
	"glass-optimizer/internal/storage"
)

var templates *template.Template

func main() {
	// Setup logger
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	// Initialize database
	dbPath := getEnv("DB_PATH", "./database/glass_optimizer.db")

	// Ensure database directory exists
	os.MkdirAll("./database", 0755)

	db, err := storage.InitializeDatabase(dbPath, logger)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Create storage layer
	store := storage.NewSQLiteStorage(db, logger)

	// Create handlers
	projectHandler := handlers.NewProjectHandler(store, logger)

	// Load templates
	templates, err = template.ParseGlob("templates/*.html")
	if err != nil {
		log.Printf("Warning: Failed to load templates: %v", err)
	}

	// Static files
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// Favicon
	http.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "static/favicon.ico")
	})

	// Routes
	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/designer", handleDesigner)
	http.HandleFunc("/optimizer", handleOptimizer)
	http.HandleFunc("/projects", handleProjects)
	http.HandleFunc("/projects/", handleProjectDetail)
	http.HandleFunc("/debug-mobile", handleDebugMobile)

	// API routes
	http.HandleFunc("/api/health", handleHealth)

	// Design routes
	http.HandleFunc("/api/designs/", func(w http.ResponseWriter, r *http.Request) {
		// Route to specific design operations
		if strings.HasPrefix(r.URL.Path, "/api/designs/") && r.URL.Path != "/api/designs/" {
			// Check for move endpoint
			if strings.Contains(r.URL.Path, "/move") {
				handleDesignMove(w, r, store, logger)
			} else {
				handleDesignByID(w, r, store, logger)
			}
		} else {
			handleDesigns(w, r, store, logger)
		}
	})
	http.HandleFunc("/api/designs", func(w http.ResponseWriter, r *http.Request) {
		handleDesigns(w, r, store, logger)
	})

	http.HandleFunc("/api/sheets", handleSheets)

	// Project routes
	http.HandleFunc("/api/projects/", func(w http.ResponseWriter, r *http.Request) {
		// Route to specific project operations
		if strings.HasPrefix(r.URL.Path, "/api/projects/") && r.URL.Path != "/api/projects/" {
			// Check for sub-routes like /designs or /optimizations
			if strings.Contains(r.URL.Path, "/designs") {
				projectHandler.HandleProjectDesigns(w, r)
			} else if strings.Contains(r.URL.Path, "/optimizations") {
				projectHandler.HandleProjectOptimizations(w, r)
			} else {
				projectHandler.HandleProjectByID(w, r)
			}
		} else {
			projectHandler.HandleProjects(w, r)
		}
	})
	http.HandleFunc("/api/projects", projectHandler.HandleProjects)

	http.HandleFunc("/api/optimizations", handleOptimizations)
	http.HandleFunc("/api/optimize", handleOptimize)

	port := getEnv("PORT", "9995")
	log.Printf("Starting server on port %s", port)
	log.Printf("Open http://localhost:%s in your browser", port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	data := map[string]interface{}{
		"Title": "Dashboard",
		"Page":  "home",
	}

	if err := templates.ExecuteTemplate(w, "index.html", data); err != nil {
		log.Printf("Template error: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func handleDesigner(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"Title": "Designer",
		"Page":  "designer",
	}

	if err := templates.ExecuteTemplate(w, "designer.html", data); err != nil {
		log.Printf("Template error: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func handleOptimizer(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"Title": "Optimizer",
		"Page":  "optimizer",
	}

	if err := templates.ExecuteTemplate(w, "optimizer.html", data); err != nil {
		log.Printf("Template error: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func handleProjects(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"Title": "Projects",
		"Page":  "projects",
	}

	if err := templates.ExecuteTemplate(w, "index.html", data); err != nil {
		log.Printf("Template error: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func handleDebugMobile(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "debug-mobile.html")
}

func handleProjectDetail(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"Title": "Project Details",
		"Page":  "project",
	}

	if err := templates.ExecuteTemplate(w, "project.html", data); err != nil {
		log.Printf("Template error: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "healthy",
		"version": "1.0.0",
	})
}

func handleDesigns(w http.ResponseWriter, r *http.Request, store storage.Storage, logger *slog.Logger) {
	w.Header().Set("Content-Type", "application/json")

	switch r.Method {
	case http.MethodGet:
		designs, total, err := store.GetDesigns(100, 0)
		if err != nil {
			logger.Error("Failed to get designs", "error", err)
			http.Error(w, "Failed to get designs", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"designs": designs,
			"total":   total,
		})

	case http.MethodPost:
		var design models.Design
		if err := json.NewDecoder(r.Body).Decode(&design); err != nil {
			logger.Error("Failed to decode design", "error", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if err := store.CreateDesign(&design); err != nil {
			logger.Error("Failed to create design", "error", err)
			http.Error(w, "Failed to create design", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"design":  design,
			"message": "Design created successfully",
		})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleDesignByID(w http.ResponseWriter, r *http.Request, store storage.Storage, logger *slog.Logger) {
	w.Header().Set("Content-Type", "application/json")

	// Extract ID from path
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, "Invalid design ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		design, err := store.GetDesign(id)
		if err != nil {
			logger.Error("Failed to get design", "error", err, "id", id)
			if models.IsNotFoundError(err) {
				http.Error(w, "Design not found", http.StatusNotFound)
			} else {
				http.Error(w, "Failed to get design", http.StatusInternalServerError)
			}
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"design": design,
		})

	case http.MethodPut:
		var design models.Design
		if err := json.NewDecoder(r.Body).Decode(&design); err != nil {
			logger.Error("Failed to decode design", "error", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		design.ID = id
		if err := store.UpdateDesign(&design); err != nil {
			logger.Error("Failed to update design", "error", err, "id", id)
			if models.IsNotFoundError(err) {
				http.Error(w, "Design not found", http.StatusNotFound)
			} else {
				http.Error(w, "Failed to update design", http.StatusInternalServerError)
			}
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"design":  design,
			"message": "Design updated successfully",
		})

	case http.MethodDelete:
		if err := store.DeleteDesign(id); err != nil {
			logger.Error("Failed to delete design", "error", err, "id", id)
			if models.IsNotFoundError(err) {
				http.Error(w, "Design not found", http.StatusNotFound)
			} else {
				http.Error(w, "Failed to delete design", http.StatusInternalServerError)
			}
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Design deleted successfully",
		})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleDesignMove(w http.ResponseWriter, r *http.Request, store storage.Storage, logger *slog.Logger) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Extract ID from path
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, "Invalid design ID", http.StatusBadRequest)
		return
	}

	// Parse request body
	var moveRequest struct {
		ProjectID int `json:"project_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&moveRequest); err != nil {
		logger.Error("Failed to decode move request", "error", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get the design first to verify it exists
	design, err := store.GetDesign(id)
	if err != nil {
		logger.Error("Failed to get design", "error", err, "id", id)
		if models.IsNotFoundError(err) {
			http.Error(w, "Design not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to get design", http.StatusInternalServerError)
		}
		return
	}

	// Verify target project exists
	_, err = store.GetProject(moveRequest.ProjectID)
	if err != nil {
		logger.Error("Failed to get target project", "error", err, "project_id", moveRequest.ProjectID)
		if models.IsNotFoundError(err) {
			http.Error(w, "Target project not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to verify target project", http.StatusInternalServerError)
		}
		return
	}

	// Update the design's project_id
	design.ProjectID = &moveRequest.ProjectID
	if err := store.UpdateDesign(design); err != nil {
		logger.Error("Failed to move design", "error", err, "id", id, "target_project", moveRequest.ProjectID)
		http.Error(w, "Failed to move design", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Design moved successfully",
		"design":  design,
	})
}

func handleSheets(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	sheets := []map[string]interface{}{
		{
			"id":            1,
			"name":          "Standard 2m x 3m",
			"width":         2000,
			"height":        3000,
			"thickness":     6,
			"price_per_sqm": 45.50,
			"in_stock":      15,
		},
		{
			"id":            2,
			"name":          "Large 2.5m x 3.5m",
			"width":         2500,
			"height":        3500,
			"thickness":     6,
			"price_per_sqm": 48.00,
			"in_stock":      8,
		},
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"sheets": sheets,
		"total":  len(sheets),
	})
}

func handleOptimizations(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"optimizations": []interface{}{},
		"total":         0,
	})
}

func handleOptimize(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	// Parse the optimization request
	var req struct {
		Name    string `json:"name"`
		SheetID int    `json:"sheet_id"`
		Designs []struct {
			DesignID int     `json:"design_id"`
			Quantity int     `json:"quantity"`
			Priority int     `json:"priority"`
			Width    float64 `json:"width"`
			Height   float64 `json:"height"`
			Name     string  `json:"name"`
		} `json:"designs"`
		Algorithm string `json:"algorithm"`
		Options   struct {
			AllowRotation bool    `json:"allow_rotation"`
			AllowFlipping bool    `json:"allow_flipping"`
			MinimumGap    float64 `json:"minimum_gap"`
			EdgeMargin    float64 `json:"edge_margin"`
		} `json:"options"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding optimization request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.SheetID == 0 {
		http.Error(w, "Sheet ID is required", http.StatusBadRequest)
		return
	}

	if len(req.Designs) == 0 {
		http.Error(w, "At least one piece is required", http.StatusBadRequest)
		return
	}

	// Get the selected sheet
	sheets := []map[string]interface{}{
		{
			"id":            1,
			"name":          "Standard 2m x 3m",
			"width":         2000,
			"height":        3000,
			"thickness":     6,
			"price_per_sqm": 45.50,
			"in_stock":      15,
		},
		{
			"id":            2,
			"name":          "Large 2.5m x 3.5m",
			"width":         2500,
			"height":        3500,
			"thickness":     6,
			"price_per_sqm": 48.00,
			"in_stock":      8,
		},
	}

	var selectedSheet map[string]interface{}
	for _, sheet := range sheets {
		if int(sheet["id"].(int)) == req.SheetID {
			selectedSheet = sheet
			break
		}
	}

	if selectedSheet == nil {
		http.Error(w, "Sheet not found", http.StatusNotFound)
		return
	}

	// Calculate basic statistics
	sheetWidth := selectedSheet["width"].(int)
	sheetHeight := selectedSheet["height"].(int)
	sheetArea := float64(sheetWidth * sheetHeight)

	totalPieceArea := 0.0
	placedPieces := []map[string]interface{}{}

	// Simple placement algorithm (bottom-left)
	currentX := float64(req.Options.EdgeMargin)
	currentY := float64(req.Options.EdgeMargin)
	rowHeight := 0.0
	placedCount := 0

	for _, design := range req.Designs {
		for i := 0; i < design.Quantity; i++ {
			pieceWidth := design.Width
			pieceHeight := design.Height
			totalPieceArea += pieceWidth * pieceHeight

			// Check if piece fits in current position
			if currentX+pieceWidth+req.Options.EdgeMargin <= float64(sheetWidth) &&
				currentY+pieceHeight+req.Options.EdgeMargin <= float64(sheetHeight) {

				// Place the piece
				placedPieces = append(placedPieces, map[string]interface{}{
					"id":          fmt.Sprintf("piece_%d_%d", design.DesignID, i),
					"design_id":   design.DesignID,
					"design_name": design.Name,
					"x":           currentX,
					"y":           currentY,
					"width":       pieceWidth,
					"height":      pieceHeight,
					"rotation":    0,
					"flipped":     false,
				})

				placedCount++

				// Update position for next piece
				currentX += pieceWidth + req.Options.MinimumGap
				if pieceHeight > rowHeight {
					rowHeight = pieceHeight
				}
			} else {
				// Move to next row
				currentX = req.Options.EdgeMargin
				currentY += rowHeight + req.Options.MinimumGap
				rowHeight = 0

				// Try to place in new row
				if currentX+pieceWidth+req.Options.EdgeMargin <= float64(sheetWidth) &&
					currentY+pieceHeight+req.Options.EdgeMargin <= float64(sheetHeight) {

					placedPieces = append(placedPieces, map[string]interface{}{
						"id":          fmt.Sprintf("piece_%d_%d", design.DesignID, i),
						"design_id":   design.DesignID,
						"design_name": design.Name,
						"x":           currentX,
						"y":           currentY,
						"width":       pieceWidth,
						"height":      pieceHeight,
						"rotation":    0,
						"flipped":     false,
					})

					placedCount++
					currentX += pieceWidth + req.Options.MinimumGap
					rowHeight = pieceHeight
				}
				// If piece doesn't fit in new row, skip it (would be unplaced)
			}
		}
	}

	// Calculate utilization
	placedArea := 0.0
	for _, piece := range placedPieces {
		width := piece["width"].(float64)
		height := piece["height"].(float64)
		placedArea += width * height
	}

	utilizationRate := (placedArea / sheetArea) * 100
	wasteRate := 100 - utilizationRate

	// Calculate total cost
	sheetAreaSqm := sheetArea / 1000000.0 // Convert mm² to m²
	pricePerSqm := selectedSheet["price_per_sqm"].(float64)
	totalCost := sheetAreaSqm * pricePerSqm

	result := map[string]interface{}{
		"optimization": map[string]interface{}{
			"id":   1,
			"name": req.Name,
			"layout": map[string]interface{}{
				"sheet_width":  sheetWidth,
				"sheet_height": sheetHeight,
				"pieces":       placedPieces,
				"statistics": map[string]interface{}{
					"utilization_rate": utilizationRate,
					"waste_rate":       wasteRate,
					"placed_pieces":    placedCount,
					"total_pieces":     len(req.Designs),
					"cutting_length":   0,
					"cutting_time":     0,
				},
			},
			"execution_time": 0.1,
			"total_cost":     totalCost,
		},
	}

	json.NewEncoder(w).Encode(result)
}
