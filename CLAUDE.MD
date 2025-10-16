# Glass Optimizer Project Documentation

## Project Overview

The Glass Optimizer is a web application that allows users to design custom glass pieces and optimize their cutting patterns to minimize waste. The application serves two primary functions:

1. **Glass Design Tool**: Visual editor for creating custom glass designs with features like holes, custom shapes, and measurements
2. **Sheet Optimization**: Algorithm to arrange multiple glass pieces on standard sheets to minimize waste and calculate material efficiency

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), HTMX
- **Backend**: Go (Golang) with standard library and minimal dependencies
- **Database**: SQLite for data persistence
- **Documentation**: JSDoc for JavaScript code documentation

## Project Structure

```
glass-optimizer/
├── CLAUDE.MD                 # This documentation file
├── README.md                 # Project setup and usage instructions
├── go.mod                    # Go module dependencies
├── main.go                   # Main Go application entry point
├── static/                   # Static web assets
│   ├── css/
│   │   ├── main.css          # Main stylesheet
│   │   ├── designer.css      # Glass design tool styles
│   │   └── optimizer.css     # Optimization view styles
│   ├── js/
│   │   ├── main.js           # Main application logic
│   │   ├── designer.js       # Glass design tool functionality
│   │   ├── optimizer.js      # Optimization algorithms
│   │   └── utils.js          # Utility functions
│   └── assets/
│       └── icons/            # SVG icons and images
├── templates/                # HTML templates
│   ├── layout.html           # Base layout template
│   ├── index.html            # Landing page
│   ├── designer.html         # Design tool interface
│   └── optimizer.html        # Optimization interface
├── internal/                 # Go internal packages
│   ├── handlers/             # HTTP handlers
│   │   ├── designer.go       # Design-related endpoints
│   │   ├── optimizer.go      # Optimization endpoints
│   │   └── static.go         # Static file serving
│   ├── models/               # Data models
│   │   ├── glass.go          # Glass piece models
│   │   ├── design.go         # Design models
│   │   └── optimization.go   # Optimization result models
│   ├── services/             # Business logic
│   │   ├── designer.go       # Design manipulation logic
│   │   └── optimizer.go      # Optimization algorithms
│   └── storage/              # Database layer
│       ├── sqlite.go         # SQLite connection and queries
│       └── migrations/       # Database schema migrations
├── database/                 # Database files
│   └── glass_optimizer.db    # SQLite database file
└── docs/                     # Additional documentation
    ├── API.md                # API documentation
    └── ALGORITHMS.md         # Optimization algorithms explanation
```

## Core Features

### 1. Glass Design Tool

**Visual Designer Interface:**
- Canvas-based design tool using HTML5 Canvas API
- Drag-and-drop interface for creating glass shapes
- Tools for adding:
  - Rectangular and circular holes
  - Custom measurements and dimensions
  - Material thickness specifications
  - Edge finishing requirements
- Real-time preview of design changes
- Export designs as JSON or SVG

**Design Management:**
- Save and load custom designs
- Template library for common glass types
- Version control for design iterations
- Design validation (structural integrity checks)

### 2. Sheet Optimization Engine

**Optimization Algorithms:**
- **Bin Packing Algorithm**: Bottom-left fill (BLF) with rotations
- **Genetic Algorithm**: For complex multi-piece optimization
- **Greedy Algorithm**: Fast approximation for simple cases
- **Custom Nesting**: Handle irregular shapes and holes

**Sheet Management:**
- Standard sheet sizes (configurable)
- Custom sheet dimensions
- Material waste calculation
- Cost analysis based on material pricing
- Cut path optimization to minimize tool changes

**Optimization Results:**
- Visual representation of optimized layout
- Waste percentage calculation
- Material utilization metrics
- Cost breakdown per sheet
- Cutting instructions export

### 3. Material Management

**Glass Types:**
- Different glass thicknesses (3mm, 6mm, 10mm, etc.)
- Material properties (tempered, laminated, etc.)
- Pricing per square unit
- Availability and lead times

**Inventory Tracking:**
- Current sheet inventory
- Material usage history
- Automatic reorder suggestions
- Supplier management

## Database Schema

### Tables

**designs**
```sql
CREATE TABLE designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    width REAL NOT NULL,
    height REAL NOT NULL,
    thickness REAL NOT NULL,
    design_data TEXT NOT NULL, -- JSON blob
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**glass_sheets**
```sql
CREATE TABLE glass_sheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    thickness REAL NOT NULL,
    price_per_sqm REAL NOT NULL,
    in_stock INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**optimizations**
```sql
CREATE TABLE optimizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sheet_id INTEGER NOT NULL,
    design_ids TEXT NOT NULL, -- JSON array of design IDs
    layout_data TEXT NOT NULL, -- JSON blob with optimization results
    waste_percentage REAL NOT NULL,
    total_area REAL NOT NULL,
    used_area REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sheet_id) REFERENCES glass_sheets(id)
);
```

**projects**
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    designs TEXT NOT NULL, -- JSON array of design IDs with quantities
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Design Management
- `GET /api/designs` - List all designs
- `GET /api/designs/:id` - Get specific design
- `POST /api/designs` - Create new design
- `PUT /api/designs/:id` - Update existing design
- `DELETE /api/designs/:id` - Delete design

### Sheet Management
- `GET /api/sheets` - List all glass sheets
- `GET /api/sheets/:id` - Get specific sheet
- `POST /api/sheets` - Create new sheet type
- `PUT /api/sheets/:id` - Update sheet information
- `DELETE /api/sheets/:id` - Delete sheet type

### Optimization
- `POST /api/optimize` - Run optimization algorithm
- `GET /api/optimizations` - List optimization results
- `GET /api/optimizations/:id` - Get specific optimization
- `GET /api/optimizations/:id/export` - Export cutting instructions

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## Key Algorithms

### 1. Bottom-Left Fill (BLF) Algorithm
Primary bin packing algorithm for rectangular pieces:
1. Sort pieces by area (largest first)
2. For each piece, find the bottom-left position where it fits
3. Consider rotations (90°, 180°, 270°)
4. Place piece and update available space

### 2. No-Fit Polygon Algorithm
For irregular shapes and pieces with holes:
1. Calculate no-fit polygons between pieces
2. Use orbital approach to find valid placements
3. Minimize bounding rectangle of all placed pieces

### 3. Genetic Algorithm
For complex multi-sheet optimization:
1. Population: Different arrangements of pieces
2. Fitness: Minimize total waste across all sheets
3. Crossover: Combine successful arrangements
4. Mutation: Random piece repositioning
5. Selection: Keep best performing arrangements

## User Interface Design

### Landing Page
- Project overview and feature highlights
- Quick start buttons for design and optimization
- Recent projects and designs
- Statistics dashboard (total designs, optimizations, waste saved)

### Design Tool Interface
- Canvas area with zoom and pan controls
- Tool palette (rectangle, circle, hole tools, measurement tools)
- Properties panel for selected elements
- Layer management
- Save/load controls
- Export options

### Optimization Interface
- Design selection area (multi-select with quantities)
- Sheet selection and configuration
- Algorithm selection and parameters
- Results visualization
- Export and printing options
- Cost calculation display

## Development Guidelines

### Go Code Standards
- Use Go modules for dependency management
- Follow Go naming conventions and formatting (gofmt)
- Implement proper error handling and logging
- Use structured logging (slog package)
- Write unit tests for all business logic
- Use interfaces for testability

### JavaScript Standards
- Use ES6+ features (const/let, arrow functions, modules)
- Document all functions with JSDoc
- Implement error handling for all async operations
- Use modern DOM APIs
- Follow functional programming patterns where applicable
- Implement proper event handling and cleanup

### CSS Standards
- Use CSS Grid and Flexbox for layouts
- Implement responsive design principles
- Use CSS custom properties (variables)
- Follow BEM methodology for class naming
- Optimize for performance (minimize repaints)
- Support dark/light theme modes

### Database Guidelines
- Use prepared statements for all queries
- Implement proper indexing for performance
- Use transactions for multi-table operations
- Regular backup strategies
- Data validation at database level

## Security Considerations

### Input Validation
- Sanitize all user inputs
- Validate file uploads (size, type)
- Implement rate limiting for API endpoints
- Use CSRF protection for forms

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper session management
- Regular security audits

## Performance Optimization

### Frontend
- Lazy load large datasets
- Implement virtual scrolling for long lists
- Use Web Workers for heavy computations
- Optimize Canvas rendering with off-screen canvases
- Implement proper caching strategies

### Backend
- Use connection pooling for database
- Implement caching for frequently accessed data
- Optimize database queries with proper indexing
- Use compression for API responses
- Implement pagination for large datasets

### Algorithms
- Use spatial indexing for collision detection
- Implement early termination conditions
- Cache optimization results
- Use parallel processing where applicable

## Testing Strategy

### Unit Tests
- All optimization algorithms
- Database operations
- Business logic functions
- Utility functions

### Integration Tests
- API endpoints
- Database migrations
- File upload/download
- Template rendering

### End-to-End Tests
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarks

## Deployment

### Local Development
- Go 1.21+ required
- SQLite database auto-creation
- Hot reload for development
- Environment-based configuration

### Production
- Docker containerization
- Reverse proxy setup (nginx)
- SSL certificate configuration
- Database backup automation
- Monitoring and logging setup

## Future Enhancements

### Phase 2 Features
- 3D visualization of glass pieces
- Advanced material properties (stress analysis)
- Integration with CAD software
- Multi-user collaboration
- API for third-party integrations

### Phase 3 Features
- Machine learning for optimization improvements
- Mobile app development
- Cloud synchronization
- Advanced reporting and analytics
- Integration with manufacturing systems

## Getting Started

1. Clone the repository
2. Install Go 1.21+
3. Run `go mod tidy` to install dependencies
4. Run `go run main.go` to start the development server
5. Open `http://localhost:8080` in your browser
6. Create your first glass design or optimization

## Contributing

Please refer to CONTRIBUTING.md for development workflow, code review process, and contribution guidelines.