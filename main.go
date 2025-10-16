package main

import (
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"os"
)

var templates *template.Template

func main() {
	// Load templates
	var err error
	templates, err = template.ParseGlob("templates/*.html")
	if err != nil {
		log.Printf("Warning: Failed to load templates: %v", err)
	}

	// Static files
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// Routes
	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/designer", handleDesigner)
	http.HandleFunc("/optimizer", handleOptimizer)

	// API routes
	http.HandleFunc("/api/health", handleHealth)
	http.HandleFunc("/api/designs", handleDesigns)
	http.HandleFunc("/api/sheets", handleSheets)
	http.HandleFunc("/api/projects", handleProjects)
	http.HandleFunc("/api/optimizations", handleOptimizations)
	http.HandleFunc("/api/optimize", handleOptimize)

	port := getEnv("PORT", "8080")
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

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "healthy",
		"version": "1.0.0",
	})
}

func handleDesigns(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	designs := []map[string]interface{}{
		{
			"id": 1,
			"name": "Window Panel",
			"width": 1200,
			"height": 800,
			"thickness": 6,
			"created_at": "2024-01-01T00:00:00Z",
		},
		{
			"id": 2,
			"name": "Door Glass",
			"width": 600,
			"height": 1800,
			"thickness": 8,
			"created_at": "2024-01-02T00:00:00Z",
		},
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"designs": designs,
		"total": len(designs),
	})
}

func handleSheets(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	sheets := []map[string]interface{}{
		{
			"id": 1,
			"name": "Standard 2m x 3m",
			"width": 2000,
			"height": 3000,
			"thickness": 6,
			"price_per_sqm": 45.50,
			"in_stock": 15,
		},
		{
			"id": 2,
			"name": "Large 2.5m x 3.5m",
			"width": 2500,
			"height": 3500,
			"thickness": 6,
			"price_per_sqm": 48.00,
			"in_stock": 8,
		},
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"sheets": sheets,
		"total": len(sheets),
	})
}

func handleProjects(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	projects := []map[string]interface{}{
		{
			"id": 1,
			"name": "Office Renovation",
			"description": "Glass panels for office",
			"designs": []int{1, 2},
		},
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"projects": projects,
		"total": len(projects),
	})
}

func handleOptimizations(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"optimizations": []interface{}{},
		"total": 0,
	})
}

func handleOptimize(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	result := map[string]interface{}{
		"optimization": map[string]interface{}{
			"id": 1,
			"name": "Optimization Result",
			"layout": map[string]interface{}{
				"sheet_width": 3000,
				"sheet_height": 2000,
				"pieces": []interface{}{},
				"statistics": map[string]interface{}{
					"utilization_rate": 75.5,
					"waste_rate": 24.5,
					"placed_pieces": 0,
					"cutting_length": 0,
					"cutting_time": 0,
				},
			},
			"execution_time": 0.5,
			"total_cost": 273.0,
		},
	}

	json.NewEncoder(w).Encode(result)
}
