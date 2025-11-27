package main

import (
	"fmt"
	"log/slog"
	"os"

	"glass-optimizer/internal/models"
	"glass-optimizer/internal/storage"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	// Initialize database
	db, err := storage.InitializeDatabase("./database/glass_optimizer.db", logger)
	if err != nil {
		logger.Error("Failed to initialize database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	store := storage.NewSQLiteStorage(db, logger)

	// Seed herrajes from Herralum catalog (pages 175+)
	herrajes := []models.Herraje{
		// Araña 1214 - Spider with 4 feet
		{
			Code:            "1214000",
			Name:            "Araña 1214 (4 patas)",
			Description:     "Araña baby Mérida con portacostillas de 4 patas. Diseñada para instalación en interiores, con modulaciones de vidrio de 1.20 x 3.00m máximo. Incluye conectores a vidrio.",
			Category:        models.CategorySpider,
			Material:        "Acero inoxidable AISI 316",
			Finish:          "Satinado",
			MaxLoad:         0,
			MinThickness:    6,
			MaxThickness:    9.5,
			HoleSize:        8,
			CountersinkSize: 0,
			HolePattern:     models.PatternGrid,
			Positions:       4,
			Notes:           "No usar limpiadores base cloro. Recomendable usar limpiador 138010100. Medidas en mm.",
			Active:          true,
			Specs: models.HerrajeSpecs{
				GlassThicknessRange: "6 a 9.5mm",
				Installation:        "Interiores",
				Quantity:            "1pz",
			},
			Variants: []models.HerrajeVariant{
				{
					Code:     "1214104",
					Name:     "Araña 1214 AISI 304",
					Material: "Acero inoxidable AISI 304",
					Finish:   "Satinado",
				},
			},
		},
		// Araña 1213 - Spider with 2 feet
		{
			Code:            "1213000",
			Name:            "Araña baby Mérida (2 patas)",
			Description:     "Araña baby Mérida con portacostillas de 2 patas. Diseñada para instalación en interiores, con modulaciones de vidrio de 1.20 x 3.00m máximo. Incluye conectores a vidrio.",
			Category:        models.CategorySpider,
			Material:        "Acero inoxidable AISI 316",
			Finish:          "Satinado",
			MaxLoad:         0,
			MinThickness:    6,
			MaxThickness:    9.5,
			HoleSize:        8,
			CountersinkSize: 0,
			HolePattern:     models.PatternPair,
			Positions:       2,
			Notes:           "No usar limpiadores base cloro. Recomendable usar limpiador 138010100.",
			Active:          true,
			Specs: models.HerrajeSpecs{
				GlassThicknessRange: "6 a 9.5mm",
				Installation:        "Interiores",
				Quantity:            "1pz",
			},
			Variants: []models.HerrajeVariant{
				{
					Code:     "1213102",
					Name:     "Araña Mérida AISI 304",
					Material: "Acero inoxidable AISI 304",
					Finish:   "Satinado",
				},
			},
		},
		// Araña Querétaro 1201 - 2 feet for exterior
		{
			Code:            "1201002",
			Name:            "Araña Querétaro (2 patas)",
			Description:     "Araña Querétaro de 2 patas con portacostilla para vidrio. Diseñada para instalación en exteriores. Soporta máximo 150Kg de peso. Compatible con rótulas 120305BSA y 1203ESTSA.",
			Category:        models.CategorySpider,
			Material:        "Acero inoxidable AISI 316",
			Finish:          "Satinado",
			MaxLoad:         150,
			MinThickness:    9.5,
			MaxThickness:    19,
			HoleSize:        10,
			CountersinkSize: 0,
			HolePattern:     models.PatternPair,
			Positions:       2,
			Notes:           "No usar limpiadores base cloro. Recomendable usar limpiador 138010100. La araña puede separarse para instalarse a muro con 1 sola pata.",
			Active:          true,
			Specs: models.HerrajeSpecs{
				GlassThicknessRange: "9.5 a 19mm",
				Installation:        "Exteriores",
				LoadPerHole:         75,
				Quantity:            "1pz",
				Compatibility:       []string{"1203", "120305BSA", "1203ESTSA"},
			},
			Variants: []models.HerrajeVariant{
				{
					Code:     "1201102",
					Name:     "Araña Querétaro AISI 304",
					Material: "Acero inoxidable AISI 304",
					Finish:   "Satinado",
				},
			},
		},
		// Araña Querétaro 1201 - 4 feet for exterior
		{
			Code:            "1201004",
			Name:            "Araña Querétaro (4 patas)",
			Description:     "Araña Querétaro de 4 patas con portacostilla para vidrio. Diseñada para instalación en exteriores. Compatible con rótulas 120305BSA y 1203ESTSA.",
			Category:        models.CategorySpider,
			Material:        "Acero inoxidable AISI 316",
			Finish:          "Satinado",
			MaxLoad:         150,
			MinThickness:    9.5,
			MaxThickness:    19,
			HoleSize:        10,
			CountersinkSize: 0,
			HolePattern:     models.PatternGrid,
			Positions:       4,
			Notes:           "No usar limpiadores base cloro. La araña puede separarse para instalarse a muro con 2 patas.",
			Active:          true,
			Specs: models.HerrajeSpecs{
				GlassThicknessRange: "9.5 a 19mm",
				Installation:        "Exteriores",
				Quantity:            "1pz",
				Compatibility:       []string{"1203", "120305BSA", "1203ESTSA"},
			},
			Variants: []models.HerrajeVariant{
				{
					Code:     "1201104",
					Name:     "Araña Querétaro 4p AISI 304",
					Material: "Acero inoxidable AISI 304",
					Finish:   "Satinado",
				},
			},
		},
		// Araña Querétaro 1202 - para viga tubular
		{
			Code:            "1202001",
			Name:            "Araña Querétaro para viga (1 pata)",
			Description:     "Araña Querétaro de 1 pata para instalación a viga, tubular o tensor. Compatible con rótula 1203, soporte 2216, tensor 2217, base 2236 y tornillo 2237.",
			Category:        models.CategorySpider,
			Material:        "Acero inoxidable AISI 316",
			Finish:          "Satinado",
			MaxLoad:         150,
			MinThickness:    9.5,
			MaxThickness:    19,
			HoleSize:        10,
			CountersinkSize: 0,
			HolePattern:     models.PatternSingle,
			Positions:       1,
			Notes:           "No usar limpiadores base cloro.",
			Active:          true,
			Specs: models.HerrajeSpecs{
				GlassThicknessRange: "9.5 a 19mm",
				Installation:        "Vigas tubulares",
				Quantity:            "1pz",
				Compatibility:       []string{"1203", "2216", "2217", "2236", "2237"},
			},
		},
		// Rótula 1203
		{
			Code:            "1203000",
			Name:            "Soporte con rótula 1203",
			Description:     "Soporte con rótula para arañas Querétaro 1201, 1202, 1250 y 1251. Facilita el ajuste fácil de paneles.",
			Category:        models.CategoryConnector,
			Material:        "Acero inoxidable AISI 316",
			Finish:          "Satinado",
			MaxLoad:         200,
			MinThickness:    9.5,
			MaxThickness:    19,
			HoleSize:        10,
			CountersinkSize: 0,
			HolePattern:     models.PatternSingle,
			Positions:       1,
			Active:          true,
			Specs: models.HerrajeSpecs{
				GlassThicknessRange: "9.5 a 19mm",
				Quantity:            "1pz",
				RelatedParts:        []string{"1201", "1202", "1250", "1251"},
			},
			Variants: []models.HerrajeVariant{
				{
					Code:     "1203101",
					Name:     "Rótula 1203 AISI 304",
					Material: "Acero inoxidable AISI 304",
					Finish:   "Satinado",
				},
			},
		},
		// Rótula 120305BSA - avellanada
		{
			Code:            "120305BSA",
			Name:            "Soporte con rótula avellanada 120305BSA",
			Description:     "Soporte con rótula avellanado para arañas Querétaro 1201, 1202, 1250 y 1251.",
			Category:        models.CategoryConnector,
			Material:        "Acero inoxidable AISI 316",
			Finish:          "Satinado",
			MaxLoad:         200,
			MinThickness:    9.5,
			MaxThickness:    19,
			HoleSize:        10,
			CountersinkSize: 13,
			CountersinkType: "cone",
			HolePattern:     models.PatternSingle,
			Positions:       1,
			Active:          true,
			Specs: models.HerrajeSpecs{
				GlassThicknessRange: "9.5 a 19mm",
				Quantity:            "1pz",
				RelatedParts:        []string{"1201", "1202", "1250", "1251"},
			},
		},
		// Soporte estándar 1203ESTSA
		{
			Code:            "1203ESTSA",
			Name:            "Soporte estándar 1203ESTSA",
			Description:     "Soporte estándar para arañas Querétaro. Requiere de perforación avellanada y permite que el cristal vaya más cerca del cuerpo de las arañas.",
			Category:        models.CategoryBracket,
			Material:        "Acero inoxidable AISI 316",
			Finish:          "Satinado",
			MaxLoad:         0,
			MinThickness:    9,
			MaxThickness:    24,
			HoleSize:        10,
			CountersinkSize: 13,
			CountersinkType: "cone",
			HolePattern:     models.PatternSingle,
			Positions:       1,
			Active:          true,
			Specs: models.HerrajeSpecs{
				GlassThicknessRange: "9 a 24mm",
				Quantity:            "1pz",
			},
		},
	}

	fmt.Printf("Seeding %d herrajes...\n", len(herrajes))

	for i, herraje := range herrajes {
		herraje.Active = true
		if err := store.CreateHerraje(&herraje); err != nil {
			logger.Error("Failed to create herraje", "error", err, "code", herraje.Code)
			fmt.Printf("[%d/%d] FAILED: %s (%s)\n", i+1, len(herrajes), herraje.Name, err)
		} else {
			fmt.Printf("[%d/%d] Created: %s (ID: %d)\n", i+1, len(herrajes), herraje.Name, herraje.ID)
		}
	}

	fmt.Println("\nHerrajesseed completed!")
}
