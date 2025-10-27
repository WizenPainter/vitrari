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

	log.Printf("Received optimization request: name=%s, sheet_id=%d, designs=%d, algorithm=%s",
		req.Name, req.SheetID, len(req.Designs), req.Algorithm)

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

	// Multi-sheet optimization algorithm
	sheetWidth := float64(selectedSheet["width"].(int))
	sheetHeight := float64(selectedSheet["height"].(int))
	sheetArea := sheetWidth * sheetHeight
	pricePerSqm := selectedSheet["price_per_sqm"].(float64)
	sheetAreaSqm := sheetArea / 1000000.0 // Convert mm² to m²

	// Calculate total pieces requested
	totalPieces := 0
	allPieces := []map[string]interface{}{}

	// Expand pieces with quantities
	for _, design := range req.Designs {
		totalPieces += design.Quantity
		for i := 0; i < design.Quantity; i++ {
			allPieces = append(allPieces, map[string]interface{}{
				"id":          fmt.Sprintf("piece_%d_%d", design.DesignID, i+1),
				"design_id":   design.DesignID,
				"design_name": design.Name,
				"width":       design.Width,
				"height":      design.Height,
				"area":        design.Width * design.Height,
			})
		}
	}

	log.Printf("Starting multi-sheet optimization: %d total pieces requested", totalPieces)

	// Sort pieces by area (largest first for better packing)
	for i := 0; i < len(allPieces)-1; i++ {
		for j := i + 1; j < len(allPieces); j++ {
			if allPieces[i]["area"].(float64) < allPieces[j]["area"].(float64) {
				allPieces[i], allPieces[j] = allPieces[j], allPieces[i]
			}
		}
	}

	// Multi-sheet placement
	optimizationSheets := []map[string]interface{}{}
	totalPlacedPieces := 0

	for len(allPieces) > 0 {
		sheetNum := len(optimizationSheets) + 1
		log.Printf("Starting sheet %d with %d remaining pieces", sheetNum, len(allPieces))

		// Initialize new sheet
		currentSheet := map[string]interface{}{
			"sheet_number": sheetNum,
			"width":        sheetWidth,
			"height":       sheetHeight,
			"pieces":       []map[string]interface{}{},
		}

		// Track available rectangles for this sheet
		availableRects := []map[string]interface{}{
			{
				"x":      req.Options.EdgeMargin,
				"y":      req.Options.EdgeMargin,
				"width":  sheetWidth - 2*req.Options.EdgeMargin,
				"height": sheetHeight - 2*req.Options.EdgeMargin,
			},
		}

		piecesPlacedThisSheet := 0

		// Try to place pieces on current sheet
		for i := 0; i < len(allPieces); i++ {
			piece := allPieces[i]
			pieceWidth := piece["width"].(float64)
			pieceHeight := piece["height"].(float64)

			placed := false

			// Try both orientations if rotation is allowed
			orientations := []map[string]float64{
				{"width": pieceWidth, "height": pieceHeight, "rotation": 0},
			}
			if req.Options.AllowRotation {
				orientations = append(orientations, map[string]float64{
					"width": pieceHeight, "height": pieceWidth, "rotation": 90,
				})
			}

			// Try each orientation and each available rectangle
			for _, orientation := range orientations {
				if placed {
					break
				}

				w := orientation["width"]
				h := orientation["height"]
				rotation := orientation["rotation"]

				for rectIdx, rect := range availableRects {
					if w <= rect["width"].(float64) && h <= rect["height"].(float64) {
						// Place the piece
						placedPiece := map[string]interface{}{
							"id":          piece["id"],
							"design_id":   piece["design_id"],
							"design_name": piece["design_name"],
							"x":           rect["x"].(float64),
							"y":           rect["y"].(float64),
							"width":       w,
							"height":      h,
							"rotation":    rotation,
							"flipped":     false,
							"sheet":       sheetNum,
						}

						currentSheet["pieces"] = append(currentSheet["pieces"].([]map[string]interface{}), placedPiece)
						piecesPlacedThisSheet++
						totalPlacedPieces++
						placed = true

						// Update available rectangles
						newRects := []map[string]interface{}{}

						// Add rectangles to the right and below the placed piece
						rightRect := map[string]interface{}{
							"x":      rect["x"].(float64) + w + req.Options.MinimumGap,
							"y":      rect["y"].(float64),
							"width":  rect["width"].(float64) - w - req.Options.MinimumGap,
							"height": h,
						}
						if rightRect["width"].(float64) > 0 {
							newRects = append(newRects, rightRect)
						}

						belowRect := map[string]interface{}{
							"x":      rect["x"].(float64),
							"y":      rect["y"].(float64) + h + req.Options.MinimumGap,
							"width":  rect["width"].(float64),
							"height": rect["height"].(float64) - h - req.Options.MinimumGap,
						}
						if belowRect["height"].(float64) > 0 {
							newRects = append(newRects, belowRect)
						}

						// Replace the used rectangle with new ones
						availableRects = append(availableRects[:rectIdx], availableRects[rectIdx+1:]...)
						availableRects = append(availableRects, newRects...)

						// Remove placed piece from remaining pieces
						allPieces = append(allPieces[:i], allPieces[i+1:]...)
						i-- // Adjust index since we removed an element

						log.Printf("Placed piece %s on sheet %d at (%.0f,%.0f) size %.0fx%.0f rotation=%.0f°",
							piece["id"], sheetNum, rect["x"].(float64), rect["y"].(float64), w, h, rotation)

						break
					}
				}
			}
		}

		if piecesPlacedThisSheet > 0 {
			optimizationSheets = append(optimizationSheets, currentSheet)
			log.Printf("Sheet %d completed with %d pieces", sheetNum, piecesPlacedThisSheet)
		} else {
			// No more pieces can be placed
			log.Printf("No more pieces can be placed. Stopping optimization.")
			break
		}
	}

	log.Printf("Optimization completed: %d pieces placed across %d sheets, %d pieces unplaced",
		totalPlacedPieces, len(optimizationSheets), len(allPieces))

	// Calculate overall statistics
	totalUsedArea := 0.0
	totalSheetArea := float64(len(optimizationSheets)) * sheetArea

	for _, sheet := range optimizationSheets {
		pieces := sheet["pieces"].([]map[string]interface{})
		for _, piece := range pieces {
			width := piece["width"].(float64)
			height := piece["height"].(float64)
			totalUsedArea += width * height
		}
	}

	overallUtilization := 0.0
	if totalSheetArea > 0 {
		overallUtilization = (totalUsedArea / totalSheetArea) * 100
	}

	totalCost := float64(len(optimizationSheets)) * sheetAreaSqm * pricePerSqm

	// Return first sheet for primary visualization, with overall statistics
	firstSheet := map[string]interface{}{
		"pieces": []map[string]interface{}{},
	}
	if len(optimizationSheets) > 0 {
		firstSheet = optimizationSheets[0]
	}

	result := map[string]interface{}{
		"optimization": map[string]interface{}{
			"id":   1,
			"name": req.Name,
			"layout": map[string]interface{}{
				"sheet_width":  sheetWidth,
				"sheet_height": sheetHeight,
				"pieces":       firstSheet["pieces"],
				"statistics": map[string]interface{}{
					"utilization_rate":    overallUtilization,
					"waste_rate":          100 - overallUtilization,
					"placed_pieces":       totalPlacedPieces,
					"total_pieces":        totalPieces,
					"unplaced_pieces":     len(allPieces),
					"sheets_used":         len(optimizationSheets),
					"total_sheet_area_m2": totalSheetArea / 1000000.0,
					"used_area_m2":        totalUsedArea / 1000000.0,
					"waste_area_m2":       (totalSheetArea - totalUsedArea) / 1000000.0,
					"cutting_length":      0,
					"cutting_time":        0,
				},
			},
			"sheets": optimizationSheets,
			"sheet_details": map[string]interface{}{
				"sheet_type":     selectedSheet["name"],
				"sheet_size":     fmt.Sprintf("%.0fx%.0fmm", sheetWidth, sheetHeight),
				"price_per_m2":   pricePerSqm,
				"cost_per_sheet": sheetAreaSqm * pricePerSqm,
			},
			"execution_time": 0.1,
			"total_cost":     totalCost,
		},
	}

	json.NewEncoder(w).Encode(result)
}
