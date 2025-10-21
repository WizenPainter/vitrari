package storage

import (
	"database/sql"
	"encoding/json"
	"log/slog"
	"strings"
	"time"

	"glass-optimizer/internal/models"

	_ "github.com/mattn/go-sqlite3"
)

// SQLiteStorage implements the storage interface using SQLite
type SQLiteStorage struct {
	db     *sql.DB
	logger *slog.Logger
}

// Storage interface defines the contract for data storage operations
type Storage interface {
	// Design operations
	CreateDesign(design *models.Design) error
	GetDesign(id int) (*models.Design, error)
	GetDesigns(limit, offset int) ([]models.Design, int, error)
	UpdateDesign(design *models.Design) error
	DeleteDesign(id int) error
	SearchDesigns(query string, limit, offset int) ([]models.Design, int, error)

	// Glass sheet operations
	CreateGlassSheet(sheet *models.GlassSheet) error
	GetGlassSheet(id int) (*models.GlassSheet, error)
	GetGlassSheets(limit, offset int) ([]models.GlassSheet, int, error)
	UpdateGlassSheet(sheet *models.GlassSheet) error
	DeleteGlassSheet(id int) error
	SearchGlassSheets(query string, limit, offset int) ([]models.GlassSheet, int, error)

	// Optimization operations
	CreateOptimization(opt *models.Optimization) error
	GetOptimization(id int) (*models.Optimization, error)
	GetOptimizations(limit, offset int) ([]models.Optimization, int, error)
	UpdateOptimization(opt *models.Optimization) error
	DeleteOptimization(id int) error

	// Project operations
	CreateProject(project *models.Project) error
	GetProject(id int) (*models.Project, error)
	GetProjects(limit, offset int) ([]models.Project, int, error)
	UpdateProject(project *models.Project) error
	DeleteProject(id int) error

	// Health check
	Ping() error
}

// Project represents a collection of designs for optimization
type Project struct {
	ID          int                 `json:"id" db:"id"`
	Name        string              `json:"name" db:"name"`
	Description string              `json:"description" db:"description"`
	Designs     string              `json:"-" db:"designs"` // JSON array of design IDs with quantities
	DesignList  []ProjectDesignItem `json:"designs_list"`   // Parsed design list
	CreatedAt   time.Time           `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time           `json:"updated_at" db:"updated_at"`
}

// ProjectDesignItem represents a design item within a project
type ProjectDesignItem struct {
	DesignID int `json:"design_id"`
	Quantity int `json:"quantity"`
}

// NewSQLiteStorage creates a new SQLite storage instance
func NewSQLiteStorage(db *sql.DB, logger *slog.Logger) *SQLiteStorage {
	return &SQLiteStorage{
		db:     db,
		logger: logger,
	}
}

// Design operations

func (s *SQLiteStorage) CreateDesign(design *models.Design) error {
	if err := design.Validate(); err != nil {
		return models.WrapError(err, "validation failed")
	}

	if err := design.MarshalDesignData(); err != nil {
		return models.NewInternalError("failed to marshal design data", err)
	}

	query := `
		INSERT INTO designs (name, description, width, height, thickness, design_data, project_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	design.CreatedAt = now
	design.UpdatedAt = now

	result, err := s.db.Exec(query,
		design.Name,
		design.Description,
		design.Width,
		design.Height,
		design.Thickness,
		design.DesignData,
		design.ProjectID,
		design.CreatedAt,
		design.UpdatedAt,
	)

	if err != nil {
		s.logger.Error("Failed to create design", "error", err, "name", design.Name)
		return models.NewDatabaseError("failed to create design", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.NewDatabaseError("failed to get insert ID", err)
	}

	design.ID = int(id)

	s.logger.Info("Design created successfully", "id", design.ID, "name", design.Name)
	return nil
}

func (s *SQLiteStorage) GetDesign(id int) (*models.Design, error) {
	query := `
		SELECT id, name, description, width, height, thickness, design_data, project_id, created_at, updated_at
		FROM designs
		WHERE id = ?
	`

	design := &models.Design{}
	var projectID sql.NullInt64
	err := s.db.QueryRow(query, id).Scan(
		&design.ID,
		&design.Name,
		&design.Description,
		&design.Width,
		&design.Height,
		&design.Thickness,
		&design.DesignData,
		&projectID,
		&design.CreatedAt,
		&design.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, models.NewNotFoundError("design")
		}
		s.logger.Error("Failed to get design", "error", err, "id", id)
		return nil, models.NewDatabaseError("failed to get design", err)
	}

	if projectID.Valid {
		pid := int(projectID.Int64)
		design.ProjectID = &pid
	}

	if err := design.UnmarshalDesignData(); err != nil {
		s.logger.Error("Failed to unmarshal design data", "error", err, "id", id)
		return nil, models.NewInternalError("failed to unmarshal design data", err)
	}

	return design, nil
}

func (s *SQLiteStorage) GetDesigns(limit, offset int) ([]models.Design, int, error) {
	// Get total count
	countQuery := "SELECT COUNT(*) FROM designs"
	var total int
	err := s.db.QueryRow(countQuery).Scan(&total)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to count designs", err)
	}

	// Get designs with pagination
	query := `
		SELECT id, name, description, width, height, thickness, design_data, project_id, created_at, updated_at
		FROM designs
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to query designs", err)
	}
	defer rows.Close()

	var designs []models.Design
	for rows.Next() {
		design := models.Design{}
		var projectID sql.NullInt64
		err := rows.Scan(
			&design.ID,
			&design.Name,
			&design.Description,
			&design.Width,
			&design.Height,
			&design.Thickness,
			&design.DesignData,
			&projectID,
			&design.CreatedAt,
			&design.UpdatedAt,
		)
		if err != nil {
			s.logger.Error("Failed to scan design row", "error", err)
			continue
		}

		if projectID.Valid {
			pid := int(projectID.Int64)
			design.ProjectID = &pid
		}

		if err := design.UnmarshalDesignData(); err != nil {
			s.logger.Error("Failed to unmarshal design data", "error", err, "id", design.ID)
			continue
		}

		designs = append(designs, design)
	}

	return designs, total, nil
}

func (s *SQLiteStorage) UpdateDesign(design *models.Design) error {
	if err := design.Validate(); err != nil {
		return models.WrapError(err, "validation failed")
	}

	if err := design.MarshalDesignData(); err != nil {
		return models.NewInternalError("failed to marshal design data", err)
	}

	query := `
		UPDATE designs
		SET name = ?, description = ?, width = ?, height = ?, thickness = ?, design_data = ?, project_id = ?, updated_at = ?
		WHERE id = ?
	`

	design.UpdatedAt = time.Now()

	result, err := s.db.Exec(query,
		design.Name,
		design.Description,
		design.Width,
		design.Height,
		design.Thickness,
		design.DesignData,
		design.ProjectID,
		design.UpdatedAt,
		design.ID,
	)

	if err != nil {
		s.logger.Error("Failed to update design", "error", err, "id", design.ID)
		return models.NewDatabaseError("failed to update design", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.NewDatabaseError("failed to get affected rows", err)
	}

	if rowsAffected == 0 {
		return models.NewNotFoundError("design")
	}

	s.logger.Info("Design updated successfully", "id", design.ID, "name", design.Name)
	return nil
}

func (s *SQLiteStorage) DeleteDesign(id int) error {
	query := "DELETE FROM designs WHERE id = ?"

	result, err := s.db.Exec(query, id)
	if err != nil {
		s.logger.Error("Failed to delete design", "error", err, "id", id)
		return models.NewDatabaseError("failed to delete design", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.NewDatabaseError("failed to get affected rows", err)
	}

	if rowsAffected == 0 {
		return models.NewNotFoundError("design")
	}

	s.logger.Info("Design deleted successfully", "id", id)
	return nil
}

func (s *SQLiteStorage) SearchDesigns(query string, limit, offset int) ([]models.Design, int, error) {
	searchTerm := "%" + strings.ToLower(query) + "%"

	// Get total count
	countQuery := `
		SELECT COUNT(*)
		FROM designs
		WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ?
	`
	var total int
	err := s.db.QueryRow(countQuery, searchTerm, searchTerm).Scan(&total)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to count designs", err)
	}

	// Get designs with search and pagination
	searchQuery := `
		SELECT id, name, description, width, height, thickness, design_data, project_id, created_at, updated_at
		FROM designs
		WHERE LOWER(name) LIKE ? OR LOWER(description) LIKE ?
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(searchQuery, searchTerm, searchTerm, limit, offset)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to search designs", err)
	}
	defer rows.Close()

	var designs []models.Design
	for rows.Next() {
		design := models.Design{}
		var projectID sql.NullInt64
		err := rows.Scan(
			&design.ID,
			&design.Name,
			&design.Description,
			&design.Width,
			&design.Height,
			&design.Thickness,
			&design.DesignData,
			&projectID,
			&design.CreatedAt,
			&design.UpdatedAt,
		)
		if err != nil {
			s.logger.Error("Failed to scan design row", "error", err)
			continue
		}

		if projectID.Valid {
			pid := int(projectID.Int64)
			design.ProjectID = &pid
		}

		if err := design.UnmarshalDesignData(); err != nil {
			s.logger.Error("Failed to unmarshal design data", "error", err, "id", design.ID)
			continue
		}

		designs = append(designs, design)
	}

	return designs, total, nil
}

// Glass sheet operations

func (s *SQLiteStorage) CreateGlassSheet(sheet *models.GlassSheet) error {
	if err := sheet.Validate(); err != nil {
		return models.WrapError(err, "validation failed")
	}

	if err := sheet.MarshalProperties(); err != nil {
		return models.NewInternalError("failed to marshal sheet properties", err)
	}

	query := `
		INSERT INTO glass_sheets (name, width, height, thickness, price_per_sqm, in_stock, material, supplier, grade, properties, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	sheet.CreatedAt = now

	result, err := s.db.Exec(query,
		sheet.Name,
		sheet.Width,
		sheet.Height,
		sheet.Thickness,
		sheet.PricePerSqm,
		sheet.InStock,
		sheet.Material,
		sheet.Supplier,
		sheet.Grade,
		sheet.Properties,
		sheet.CreatedAt,
	)

	if err != nil {
		s.logger.Error("Failed to create glass sheet", "error", err, "name", sheet.Name)
		return models.NewDatabaseError("failed to create glass sheet", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.NewDatabaseError("failed to get insert ID", err)
	}

	sheet.ID = int(id)

	s.logger.Info("Glass sheet created successfully", "id", sheet.ID, "name", sheet.Name)
	return nil
}

func (s *SQLiteStorage) GetGlassSheet(id int) (*models.GlassSheet, error) {
	query := `
		SELECT id, name, width, height, thickness, price_per_sqm, in_stock, material, supplier, grade, properties, created_at
		FROM glass_sheets
		WHERE id = ?
	`

	sheet := &models.GlassSheet{}
	var properties sql.NullString

	err := s.db.QueryRow(query, id).Scan(
		&sheet.ID,
		&sheet.Name,
		&sheet.Width,
		&sheet.Height,
		&sheet.Thickness,
		&sheet.PricePerSqm,
		&sheet.InStock,
		&sheet.Material,
		&sheet.Supplier,
		&sheet.Grade,
		&properties,
		&sheet.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, models.NewNotFoundError("glass sheet")
		}
		s.logger.Error("Failed to get glass sheet", "error", err, "id", id)
		return nil, models.NewDatabaseError("failed to get glass sheet", err)
	}

	if properties.Valid {
		sheet.Properties = properties.String
		if err := sheet.UnmarshalProperties(); err != nil {
			s.logger.Error("Failed to unmarshal sheet properties", "error", err, "id", id)
			return nil, models.NewInternalError("failed to unmarshal sheet properties", err)
		}
	}

	return sheet, nil
}

func (s *SQLiteStorage) GetGlassSheets(limit, offset int) ([]models.GlassSheet, int, error) {
	// Get total count
	countQuery := "SELECT COUNT(*) FROM glass_sheets"
	var total int
	err := s.db.QueryRow(countQuery).Scan(&total)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to count glass sheets", err)
	}

	// Get sheets with pagination
	query := `
		SELECT id, name, width, height, thickness, price_per_sqm, in_stock, material, supplier, grade, properties, created_at
		FROM glass_sheets
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to query glass sheets", err)
	}
	defer rows.Close()

	var sheets []models.GlassSheet
	for rows.Next() {
		sheet := models.GlassSheet{}
		var properties sql.NullString

		err := rows.Scan(
			&sheet.ID,
			&sheet.Name,
			&sheet.Width,
			&sheet.Height,
			&sheet.Thickness,
			&sheet.PricePerSqm,
			&sheet.InStock,
			&sheet.Material,
			&sheet.Supplier,
			&sheet.Grade,
			&properties,
			&sheet.CreatedAt,
		)
		if err != nil {
			s.logger.Error("Failed to scan glass sheet row", "error", err)
			continue
		}

		if properties.Valid {
			sheet.Properties = properties.String
			if err := sheet.UnmarshalProperties(); err != nil {
				s.logger.Error("Failed to unmarshal sheet properties", "error", err, "id", sheet.ID)
				continue
			}
		}

		sheets = append(sheets, sheet)
	}

	return sheets, total, nil
}

func (s *SQLiteStorage) UpdateGlassSheet(sheet *models.GlassSheet) error {
	if err := sheet.Validate(); err != nil {
		return models.WrapError(err, "validation failed")
	}

	if err := sheet.MarshalProperties(); err != nil {
		return models.NewInternalError("failed to marshal sheet properties", err)
	}

	query := `
		UPDATE glass_sheets
		SET name = ?, width = ?, height = ?, thickness = ?, price_per_sqm = ?, in_stock = ?, material = ?, supplier = ?, grade = ?, properties = ?
		WHERE id = ?
	`

	result, err := s.db.Exec(query,
		sheet.Name,
		sheet.Width,
		sheet.Height,
		sheet.Thickness,
		sheet.PricePerSqm,
		sheet.InStock,
		sheet.Material,
		sheet.Supplier,
		sheet.Grade,
		sheet.Properties,
		sheet.ID,
	)

	if err != nil {
		s.logger.Error("Failed to update glass sheet", "error", err, "id", sheet.ID)
		return models.NewDatabaseError("failed to update glass sheet", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.NewDatabaseError("failed to get affected rows", err)
	}

	if rowsAffected == 0 {
		return models.NewNotFoundError("glass sheet")
	}

	s.logger.Info("Glass sheet updated successfully", "id", sheet.ID, "name", sheet.Name)
	return nil
}

func (s *SQLiteStorage) DeleteGlassSheet(id int) error {
	query := "DELETE FROM glass_sheets WHERE id = ?"

	result, err := s.db.Exec(query, id)
	if err != nil {
		s.logger.Error("Failed to delete glass sheet", "error", err, "id", id)
		return models.NewDatabaseError("failed to delete glass sheet", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.NewDatabaseError("failed to get affected rows", err)
	}

	if rowsAffected == 0 {
		return models.NewNotFoundError("glass sheet")
	}

	s.logger.Info("Glass sheet deleted successfully", "id", id)
	return nil
}

func (s *SQLiteStorage) SearchGlassSheets(query string, limit, offset int) ([]models.GlassSheet, int, error) {
	searchTerm := "%" + strings.ToLower(query) + "%"

	// Get total count
	countQuery := `
		SELECT COUNT(*)
		FROM glass_sheets
		WHERE LOWER(name) LIKE ? OR LOWER(material) LIKE ? OR LOWER(supplier) LIKE ?
	`
	var total int
	err := s.db.QueryRow(countQuery, searchTerm, searchTerm, searchTerm).Scan(&total)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to count glass sheets", err)
	}

	// Get sheets with search and pagination
	searchQuery := `
		SELECT id, name, width, height, thickness, price_per_sqm, in_stock, material, supplier, grade, properties, created_at
		FROM glass_sheets
		WHERE LOWER(name) LIKE ? OR LOWER(material) LIKE ? OR LOWER(supplier) LIKE ?
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(searchQuery, searchTerm, searchTerm, searchTerm, limit, offset)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to search glass sheets", err)
	}
	defer rows.Close()

	var sheets []models.GlassSheet
	for rows.Next() {
		sheet := models.GlassSheet{}
		var properties sql.NullString

		err := rows.Scan(
			&sheet.ID,
			&sheet.Name,
			&sheet.Width,
			&sheet.Height,
			&sheet.Thickness,
			&sheet.PricePerSqm,
			&sheet.InStock,
			&sheet.Material,
			&sheet.Supplier,
			&sheet.Grade,
			&properties,
			&sheet.CreatedAt,
		)
		if err != nil {
			s.logger.Error("Failed to scan glass sheet row", "error", err)
			continue
		}

		if properties.Valid {
			sheet.Properties = properties.String
			if err := sheet.UnmarshalProperties(); err != nil {
				s.logger.Error("Failed to unmarshal sheet properties", "error", err, "id", sheet.ID)
				continue
			}
		}

		sheets = append(sheets, sheet)
	}

	return sheets, total, nil
}

// Optimization operations

func (s *SQLiteStorage) CreateOptimization(opt *models.Optimization) error {
	if err := opt.Validate(); err != nil {
		return models.WrapError(err, "validation failed")
	}

	if err := opt.MarshalDesignIDs(); err != nil {
		return models.NewInternalError("failed to marshal design IDs", err)
	}

	if err := opt.MarshalLayoutData(); err != nil {
		return models.NewInternalError("failed to marshal layout data", err)
	}

	query := `
		INSERT INTO optimizations (name, sheet_id, design_ids, layout_data, waste_percentage, total_area, used_area, algorithm, execution_time, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	opt.CreatedAt = now

	result, err := s.db.Exec(query,
		opt.Name,
		opt.SheetID,
		opt.DesignIDs,
		opt.LayoutData,
		opt.WastePercentage,
		opt.TotalArea,
		opt.UsedArea,
		opt.Algorithm,
		opt.ExecutionTime,
		opt.CreatedAt,
	)

	if err != nil {
		s.logger.Error("Failed to create optimization", "error", err, "name", opt.Name)
		return models.NewDatabaseError("failed to create optimization", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.NewDatabaseError("failed to get insert ID", err)
	}

	opt.ID = int(id)

	s.logger.Info("Optimization created successfully", "id", opt.ID, "name", opt.Name)
	return nil
}

func (s *SQLiteStorage) GetOptimization(id int) (*models.Optimization, error) {
	query := `
		SELECT o.id, o.name, o.sheet_id, o.design_ids, o.layout_data, o.waste_percentage, o.total_area, o.used_area, o.algorithm, o.execution_time, o.created_at,
			   gs.name as sheet_name, gs.width, gs.height, gs.thickness, gs.price_per_sqm, gs.in_stock
		FROM optimizations o
		LEFT JOIN glass_sheets gs ON o.sheet_id = gs.id
		WHERE o.id = ?
	`

	opt := &models.Optimization{}
	sheet := &models.GlassSheet{}
	var sheetName sql.NullString

	err := s.db.QueryRow(query, id).Scan(
		&opt.ID,
		&opt.Name,
		&opt.SheetID,
		&opt.DesignIDs,
		&opt.LayoutData,
		&opt.WastePercentage,
		&opt.TotalArea,
		&opt.UsedArea,
		&opt.Algorithm,
		&opt.ExecutionTime,
		&opt.CreatedAt,
		&sheetName,
		&sheet.Width,
		&sheet.Height,
		&sheet.Thickness,
		&sheet.PricePerSqm,
		&sheet.InStock,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, models.NewNotFoundError("optimization")
		}
		s.logger.Error("Failed to get optimization", "error", err, "id", id)
		return nil, models.NewDatabaseError("failed to get optimization", err)
	}

	// Set sheet data if available
	if sheetName.Valid {
		sheet.ID = opt.SheetID
		sheet.Name = sheetName.String
		opt.Sheet = sheet
	}

	// Unmarshal JSON data
	if err := opt.UnmarshalDesignIDs(); err != nil {
		s.logger.Error("Failed to unmarshal design IDs", "error", err, "id", id)
		return nil, models.NewInternalError("failed to unmarshal design IDs", err)
	}

	if err := opt.UnmarshalLayoutData(); err != nil {
		s.logger.Error("Failed to unmarshal layout data", "error", err, "id", id)
		return nil, models.NewInternalError("failed to unmarshal layout data", err)
	}

	// Calculate derived values
	opt.WastedArea = opt.TotalArea - opt.UsedArea
	if opt.Sheet != nil {
		opt.TotalCost = opt.Sheet.AreaInSquareMeters() * opt.Sheet.PricePerSqm
	}

	return opt, nil
}

func (s *SQLiteStorage) GetOptimizations(limit, offset int) ([]models.Optimization, int, error) {
	// Get total count
	countQuery := "SELECT COUNT(*) FROM optimizations"
	var total int
	err := s.db.QueryRow(countQuery).Scan(&total)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to count optimizations", err)
	}

	// Get optimizations with pagination
	query := `
		SELECT o.id, o.name, o.sheet_id, o.design_ids, o.layout_data, o.waste_percentage, o.total_area, o.used_area, o.algorithm, o.execution_time, o.created_at,
			   gs.name as sheet_name, gs.width, gs.height, gs.thickness, gs.price_per_sqm, gs.in_stock
		FROM optimizations o
		LEFT JOIN glass_sheets gs ON o.sheet_id = gs.id
		ORDER BY o.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to query optimizations", err)
	}
	defer rows.Close()

	var optimizations []models.Optimization
	for rows.Next() {
		opt := models.Optimization{}
		sheet := &models.GlassSheet{}
		var sheetName sql.NullString

		err := rows.Scan(
			&opt.ID,
			&opt.Name,
			&opt.SheetID,
			&opt.DesignIDs,
			&opt.LayoutData,
			&opt.WastePercentage,
			&opt.TotalArea,
			&opt.UsedArea,
			&opt.Algorithm,
			&opt.ExecutionTime,
			&opt.CreatedAt,
			&sheetName,
			&sheet.Width,
			&sheet.Height,
			&sheet.Thickness,
			&sheet.PricePerSqm,
			&sheet.InStock,
		)
		if err != nil {
			s.logger.Error("Failed to scan optimization row", "error", err)
			continue
		}

		// Set sheet data if available
		if sheetName.Valid {
			sheet.ID = opt.SheetID
			sheet.Name = sheetName.String
			opt.Sheet = sheet
		}

		// Unmarshal JSON data
		if err := opt.UnmarshalDesignIDs(); err != nil {
			s.logger.Error("Failed to unmarshal design IDs", "error", err, "id", opt.ID)
			continue
		}

		if err := opt.UnmarshalLayoutData(); err != nil {
			s.logger.Error("Failed to unmarshal layout data", "error", err, "id", opt.ID)
			continue
		}

		// Calculate derived values
		opt.WastedArea = opt.TotalArea - opt.UsedArea
		if opt.Sheet != nil {
			opt.TotalCost = opt.Sheet.AreaInSquareMeters() * opt.Sheet.PricePerSqm
		}

		optimizations = append(optimizations, opt)
	}

	return optimizations, total, nil
}

func (s *SQLiteStorage) UpdateOptimization(opt *models.Optimization) error {
	if err := opt.Validate(); err != nil {
		return models.WrapError(err, "validation failed")
	}

	if err := opt.MarshalDesignIDs(); err != nil {
		return models.NewInternalError("failed to marshal design IDs", err)
	}

	if err := opt.MarshalLayoutData(); err != nil {
		return models.NewInternalError("failed to marshal layout data", err)
	}

	query := `
		UPDATE optimizations
		SET name = ?, sheet_id = ?, design_ids = ?, layout_data = ?, waste_percentage = ?, total_area = ?, used_area = ?, algorithm = ?, execution_time = ?
		WHERE id = ?
	`

	result, err := s.db.Exec(query,
		opt.Name,
		opt.SheetID,
		opt.DesignIDs,
		opt.LayoutData,
		opt.WastePercentage,
		opt.TotalArea,
		opt.UsedArea,
		opt.Algorithm,
		opt.ExecutionTime,
		opt.ID,
	)

	if err != nil {
		s.logger.Error("Failed to update optimization", "error", err, "id", opt.ID)
		return models.NewDatabaseError("failed to update optimization", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.NewDatabaseError("failed to get affected rows", err)
	}

	if rowsAffected == 0 {
		return models.NewNotFoundError("optimization")
	}

	s.logger.Info("Optimization updated successfully", "id", opt.ID, "name", opt.Name)
	return nil
}

func (s *SQLiteStorage) DeleteOptimization(id int) error {
	query := "DELETE FROM optimizations WHERE id = ?"

	result, err := s.db.Exec(query, id)
	if err != nil {
		s.logger.Error("Failed to delete optimization", "error", err, "id", id)
		return models.NewDatabaseError("failed to delete optimization", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.NewDatabaseError("failed to get affected rows", err)
	}

	if rowsAffected == 0 {
		return models.NewNotFoundError("optimization")
	}

	s.logger.Info("Optimization deleted successfully", "id", id)
	return nil
}

// Project operations

func (s *SQLiteStorage) CreateProject(project *models.Project) error {
	if project.Name == "" {
		return models.NewValidationError("project name is required")
	}

	// If parent_id is set, get parent's path
	var parentPath string
	if project.ParentID != nil {
		parent, err := s.GetProject(*project.ParentID)
		if err != nil {
			return models.NewValidationError("parent project not found")
		}
		parentPath = parent.Path
	} else {
		parentPath = "/"
	}

	// Build path for this project
	project.Path = models.BuildPath(parentPath, project.Name)

	// Marshal design list to JSON
	designData, err := json.Marshal(project.DesignList)
	if err != nil {
		return models.NewInternalError("failed to marshal project designs", err)
	}

	query := `
		INSERT INTO projects (name, description, parent_id, path, designs, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	project.CreatedAt = now
	project.UpdatedAt = now

	result, err := s.db.Exec(query,
		project.Name,
		project.Description,
		project.ParentID,
		project.Path,
		string(designData),
		project.CreatedAt,
		project.UpdatedAt,
	)

	if err != nil {
		s.logger.Error("Failed to create project", "error", err, "name", project.Name)
		return models.NewDatabaseError("failed to create project", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return models.NewDatabaseError("failed to get insert ID", err)
	}

	project.ID = int(id)
	project.Designs = string(designData)

	s.logger.Info("Project created successfully", "id", project.ID, "name", project.Name)
	return nil
}

func (s *SQLiteStorage) GetProject(id int) (*models.Project, error) {
	query := `
		SELECT p.id, p.name, p.description, p.parent_id, p.path, p.designs, p.created_at, p.updated_at,
		       (SELECT COUNT(*) FROM designs WHERE project_id = p.id) as design_count,
		       (SELECT COUNT(*) FROM optimizations WHERE project_id = p.id) as opt_count
		FROM projects p
		WHERE p.id = ?
	`

	project := &models.Project{}
	var parentID sql.NullInt64

	err := s.db.QueryRow(query, id).Scan(
		&project.ID,
		&project.Name,
		&project.Description,
		&parentID,
		&project.Path,
		&project.Designs,
		&project.CreatedAt,
		&project.UpdatedAt,
		&project.DesignCount,
		&project.OptCount,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, models.NewNotFoundError("project")
		}
		s.logger.Error("Failed to get project", "error", err, "id", id)
		return nil, models.NewDatabaseError("failed to get project", err)
	}

	if parentID.Valid {
		pid := int(parentID.Int64)
		project.ParentID = &pid
	}

	// Unmarshal design list
	if project.Designs != "" {
		if err := json.Unmarshal([]byte(project.Designs), &project.DesignList); err != nil {
			s.logger.Error("Failed to unmarshal project designs", "error", err, "id", id)
			return nil, models.NewInternalError("failed to unmarshal project designs", err)
		}
	}

	return project, nil
}

func (s *SQLiteStorage) GetProjects(limit, offset int) ([]models.Project, int, error) {
	// Get total count
	countQuery := "SELECT COUNT(*) FROM projects"
	var total int
	err := s.db.QueryRow(countQuery).Scan(&total)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to count projects", err)
	}

	// Get projects with counts
	query := `
		SELECT p.id, p.name, p.description, p.parent_id, p.path, p.designs, p.created_at, p.updated_at,
		       (SELECT COUNT(*) FROM designs WHERE project_id = p.id) as design_count,
		       (SELECT COUNT(*) FROM optimizations WHERE project_id = p.id) as opt_count
		FROM projects p
		ORDER BY p.path
		LIMIT ? OFFSET ?
	`

	rows, err := s.db.Query(query, limit, offset)
	if err != nil {
		return nil, 0, models.NewDatabaseError("failed to query projects", err)
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		project := models.Project{}
		var parentID sql.NullInt64

		err := rows.Scan(
			&project.ID,
			&project.Name,
			&project.Description,
			&parentID,
			&project.Path,
			&project.Designs,
			&project.CreatedAt,
			&project.UpdatedAt,
			&project.DesignCount,
			&project.OptCount,
		)
		if err != nil {
			s.logger.Error("Failed to scan project row", "error", err)
			continue
		}

		if parentID.Valid {
			pid := int(parentID.Int64)
			project.ParentID = &pid
		}

		// Unmarshal design list
		if project.Designs != "" {
			if err := json.Unmarshal([]byte(project.Designs), &project.DesignList); err != nil {
				s.logger.Error("Failed to unmarshal project designs", "error", err, "id", project.ID)
				continue
			}
		}

		projects = append(projects, project)
	}

	return projects, total, nil
}

func (s *SQLiteStorage) UpdateProject(project *models.Project) error {
	if project.Name == "" {
		return models.NewValidationError("project name is required")
	}

	// Get current project to check if we need to update path
	current, err := s.GetProject(project.ID)
	if err != nil {
		return err
	}

	// If parent changed or name changed, update path
	if current.Name != project.Name || (current.ParentID == nil && project.ParentID != nil) ||
		(current.ParentID != nil && project.ParentID == nil) ||
		(current.ParentID != nil && project.ParentID != nil && *current.ParentID != *project.ParentID) {

		var parentPath string
		if project.ParentID != nil {
			parent, err := s.GetProject(*project.ParentID)
			if err != nil {
				return models.NewValidationError("parent project not found")
			}
			parentPath = parent.Path
		} else {
			parentPath = "/"
		}
		project.Path = models.BuildPath(parentPath, project.Name)
	} else {
		project.Path = current.Path
	}

	// Marshal design list to JSON
	designData, err := json.Marshal(project.DesignList)
	if err != nil {
		return models.NewInternalError("failed to marshal project designs", err)
	}

	query := `
		UPDATE projects
		SET name = ?, description = ?, parent_id = ?, path = ?, designs = ?, updated_at = ?
		WHERE id = ?
	`

	project.UpdatedAt = time.Now()

	result, err := s.db.Exec(query,
		project.Name,
		project.Description,
		project.ParentID,
		project.Path,
		string(designData),
		project.UpdatedAt,
		project.ID,
	)

	if err != nil {
		s.logger.Error("Failed to update project", "error", err, "id", project.ID)
		return models.NewDatabaseError("failed to update project", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.NewDatabaseError("failed to get affected rows", err)
	}

	if rowsAffected == 0 {
		return models.NewNotFoundError("project")
	}

	project.Designs = string(designData)

	s.logger.Info("Project updated successfully", "id", project.ID, "name", project.Name)
	return nil
}

func (s *SQLiteStorage) DeleteProject(id int) error {
	query := "DELETE FROM projects WHERE id = ?"

	result, err := s.db.Exec(query, id)
	if err != nil {
		s.logger.Error("Failed to delete project", "error", err, "id", id)
		return models.NewDatabaseError("failed to delete project", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return models.NewDatabaseError("failed to get affected rows", err)
	}

	if rowsAffected == 0 {
		return models.NewNotFoundError("project")
	}

	s.logger.Info("Project deleted successfully", "id", id)
	return nil
}

// Ping tests the database connection
func (s *SQLiteStorage) Ping() error {
	return s.db.Ping()
}

// GetProjectTree builds a hierarchical tree of all projects
func (s *SQLiteStorage) GetProjectTree() ([]models.Project, error) {
	// Get all projects
	projects, _, err := s.GetProjects(1000, 0)
	if err != nil {
		return nil, err
	}

	// Build tree structure
	projectMap := make(map[int]*models.Project)
	var rootProjects []models.Project

	// First pass: create map and initialize children
	for i := range projects {
		projectMap[projects[i].ID] = &projects[i]
		projects[i].Children = []models.Project{}

		// Load designs for this project and populate designs_list
		designs, err := s.GetDesignsByProject(projects[i].ID)
		if err == nil && len(designs) > 0 {
			projects[i].DesignList = make([]models.ProjectDesignItem, len(designs))
			for j, design := range designs {
				projects[i].DesignList[j] = models.ProjectDesignItem{
					DesignID:    design.ID,
					Design:      &designs[j],
					Quantity:    1,
					Priority:    0,
					Notes:       "",
					UnitCost:    0,
					TotalCost:   0,
					IsCompleted: false,
				}
			}
		}
	}

	// Second pass: build tree by adding children to parents
	for i := range projects {
		if projects[i].ParentID != nil {
			if parent, exists := projectMap[*projects[i].ParentID]; exists {
				parent.Children = append(parent.Children, projects[i])
			}
		}
	}

	// Third pass: collect root projects (now with children populated)
	for i := range projects {
		if projects[i].ParentID == nil {
			if p, exists := projectMap[projects[i].ID]; exists {
				rootProjects = append(rootProjects, *p)
			}
		}
	}

	return rootProjects, nil
}

// GetProjectsByParent gets all direct children of a project
func (s *SQLiteStorage) GetProjectsByParent(parentID *int) ([]models.Project, error) {
	var query string
	var args []interface{}

	if parentID == nil {
		query = `
			SELECT p.id, p.name, p.description, p.parent_id, p.path, p.designs, p.created_at, p.updated_at,
			       (SELECT COUNT(*) FROM designs WHERE project_id = p.id) as design_count,
			       (SELECT COUNT(*) FROM optimizations WHERE project_id = p.id) as opt_count
			FROM projects p
			WHERE p.parent_id IS NULL
			ORDER BY p.name
		`
	} else {
		query = `
			SELECT p.id, p.name, p.description, p.parent_id, p.path, p.designs, p.created_at, p.updated_at,
			       (SELECT COUNT(*) FROM designs WHERE project_id = p.id) as design_count,
			       (SELECT COUNT(*) FROM optimizations WHERE project_id = p.id) as opt_count
			FROM projects p
			WHERE p.parent_id = ?
			ORDER BY p.name
		`
		args = append(args, *parentID)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, models.NewDatabaseError("failed to query projects by parent", err)
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		project := models.Project{}
		var parentIDNullable sql.NullInt64

		err := rows.Scan(
			&project.ID,
			&project.Name,
			&project.Description,
			&parentIDNullable,
			&project.Path,
			&project.Designs,
			&project.CreatedAt,
			&project.UpdatedAt,
			&project.DesignCount,
			&project.OptCount,
		)
		if err != nil {
			s.logger.Error("Failed to scan project row", "error", err)
			continue
		}

		if parentIDNullable.Valid {
			pid := int(parentIDNullable.Int64)
			project.ParentID = &pid
		}

		if project.Designs != "" {
			if err := json.Unmarshal([]byte(project.Designs), &project.DesignList); err != nil {
				s.logger.Error("Failed to unmarshal project designs", "error", err, "id", project.ID)
				continue
			}
		}

		projects = append(projects, project)
	}

	return projects, nil
}

// GetDesignsByProject gets all designs in a specific project
func (s *SQLiteStorage) GetDesignsByProject(projectID int) ([]models.Design, error) {
	query := `
		SELECT id, name, description, width, height, thickness, design_data, project_id, created_at, updated_at
		FROM designs
		WHERE project_id = ?
		ORDER BY created_at DESC
	`

	rows, err := s.db.Query(query, projectID)
	if err != nil {
		return nil, models.NewDatabaseError("failed to query designs by project", err)
	}
	defer rows.Close()

	var designs []models.Design
	for rows.Next() {
		design := models.Design{}
		var projectIDNullable sql.NullInt64

		err := rows.Scan(
			&design.ID,
			&design.Name,
			&design.Description,
			&design.Width,
			&design.Height,
			&design.Thickness,
			&design.DesignData,
			&projectIDNullable,
			&design.CreatedAt,
			&design.UpdatedAt,
		)
		if err != nil {
			s.logger.Error("Failed to scan design row", "error", err)
			continue
		}

		if projectIDNullable.Valid {
			pid := int(projectIDNullable.Int64)
			design.ProjectID = &pid
		}

		if err := design.UnmarshalDesignData(); err != nil {
			s.logger.Error("Failed to unmarshal design data", "error", err, "id", design.ID)
			continue
		}

		designs = append(designs, design)
	}

	return designs, nil
}

// GetOptimizationsByProject gets all optimizations in a specific project
func (s *SQLiteStorage) GetOptimizationsByProject(projectID int) ([]models.Optimization, error) {
	query := `
		SELECT o.id, o.name, o.sheet_id, o.design_ids, o.layout_data, o.waste_percentage,
		       o.total_area, o.used_area, o.algorithm, o.execution_time, o.project_id, o.created_at
		FROM optimizations o
		WHERE o.project_id = ?
		ORDER BY o.created_at DESC
	`

	rows, err := s.db.Query(query, projectID)
	if err != nil {
		return nil, models.NewDatabaseError("failed to query optimizations by project", err)
	}
	defer rows.Close()

	var optimizations []models.Optimization
	for rows.Next() {
		opt := models.Optimization{}
		var projectIDNullable sql.NullInt64

		err := rows.Scan(
			&opt.ID,
			&opt.Name,
			&opt.SheetID,
			&opt.DesignIDs,
			&opt.LayoutData,
			&opt.WastePercentage,
			&opt.TotalArea,
			&opt.UsedArea,
			&opt.Algorithm,
			&opt.ExecutionTime,
			&projectIDNullable,
			&opt.CreatedAt,
		)
		if err != nil {
			s.logger.Error("Failed to scan optimization row", "error", err)
			continue
		}

		if projectIDNullable.Valid {
			pid := int(projectIDNullable.Int64)
			opt.ProjectID = &pid
		}

		if err := opt.UnmarshalDesignIDs(); err != nil {
			s.logger.Error("Failed to unmarshal design IDs", "error", err, "id", opt.ID)
			continue
		}

		if err := opt.UnmarshalLayoutData(); err != nil {
			s.logger.Error("Failed to unmarshal layout data", "error", err, "id", opt.ID)
			continue
		}

		optimizations = append(optimizations, opt)
	}

	return optimizations, nil
}
