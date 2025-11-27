# Herrajes (Hardware) Implementation Summary

## Overview
Complete implementation of a hardware catalog system for glass installations, extracted from the Herralum 2025 catalog (pages 175+). Users can now select hardware pieces and automatically generate required holes and avellanados (countersinks) on glass designs.

## Implementation Completed

### 1. Data Model (`internal/models/herraje.go`)
Created comprehensive Herraje (Hardware) model with:
- **Basic Information**: Code, Name, Description, Category
- **Material Specifications**: Material type, Finish, Max Load capacity
- **Glass Compatibility**: Min/Max thickness support
- **Hole Specifications**: 
  - Hole size (diameter in mm)
  - Countersink size and type (cone, flat, etc.)
  - Hole pattern (single, pair, linear, grid, custom)
  - Number of positions
- **Additional Features**:
  - Picture URL for product images
  - Extended specifications as JSON blob
  - Variants for different material/finish combinations
  - Active status for soft-delete
  - Timestamps for audit trail

### 2. Database Schema
#### Tables Created:
- **herrajes**: Main hardware catalog table
  - 20 columns including code (unique), name, category, material specs, hole specs
  - Indexes on: code, category, active status
  
- **herraje_variants**: Variants for each hardware piece
  - Links to parent herraje
  - Stores different material/finish combinations (e.g., AISI 316 vs AISI 304)
  - Unique code per variant

### 3. API Endpoints
Full REST API implemented for herraje management:

#### GET /api/herrajes
- List all active herrajes with pagination
- Query parameters:
  - `limit`: Results per page (default 50, max 100)
  - `offset`: Pagination offset
  - `category`: Filter by spider/bracket/connector/etc.
  - `search`: Full-text search by code, name, or description
- Response: Array of herrajes with total count

#### GET /api/herrajes/{id}
- Get single herraje with all variant information
- Includes related parts and compatibility data

#### POST /api/herrajes
- Create new herraje (admin only)
- Validates all required fields
- Auto-creates associated variants

#### PUT /api/herrajes/{id}
- Update herraje details
- Validates data integrity

#### DELETE /api/herrajes/{id}
- Soft-delete (marks as inactive)
- Preserves data for audit trail

### 4. Storage Layer
SQLite implementation with proper:
- Transaction handling
- Error management
- Proper type conversion (bool ↔ int for SQLite compatibility)
- Variant loading and management
- Pagination and search optimization

### 5. Seeded Data
Initial catalog includes 8 hardware pieces from Herralum:

**Spiders (Arañas):**
- Araña 1214 (4 patas) - Interior installations, 6-9mm glass
- Araña 1213 (2 patas) - Interior installations, 6-9mm glass
- Araña Querétaro 1201 (2 patas) - Exterior, 10-19mm glass, 150kg load
- Araña Querétaro 1201 (4 patas) - Exterior, 10-19mm glass
- Araña Querétaro 1202 (1 pata) - For beams/cables, 10-19mm glass
- Araña Querétaro wall-mounted variants (1250, 1250DERSA, 1250IZQSA)
- Araña Querétaro with rib support (1251DERSA)

**Brackets & Connectors:**
- Rótula 1203 - Ball joint for Querétaro spiders, 200kg max load
- Rótula 120305BSA - Countersink ball joint variant
- Soporte 1203ESTSA - Standard support bracket
- Soporte 2216 - Fixed support for beam installation
- Base 2236 - Bolt base for Querétaro spiders
- Tornillo 2237 - 5/8-11 standard fastener
- Tensor 2217 - Tensioning bolt with hardware

### 6. Features Implemented

#### Hole Position Calculation
`GetHolePositions()` method automatically calculates placement for:
- **Single**: Center point
- **Pair**: Two vertically aligned holes
- **Linear**: Horizontal line pattern
- **Grid**: Multi-position grid pattern

#### Avellanado Support
- `CreateCountersinkHole()`: Standard circular hole with tolerance
- `CreateAvellanado()`: Countersink hole for recessed fittings
- Supports cone and flat countersink types
- Customizable countersink diameter and angle

#### Variants System
- Store multiple material/finish combinations per hardware piece
- Example: 1214000 (AISI 316) and 1214104 (AISI 304)
- Easy selection in designer UI

### 7. Integration Points

#### Main Application
- Added `herrajeHandler` to main.go
- Registered routes: `/api/herrajes` and `/api/herrajes/{id}`
- Public read access, admin write operations

#### Storage Interface
- 8 new interface methods for CRUD operations
- GetHerrajeByCode() for catalog lookups
- GetHerrajesByCategory() for filtering
- SearchHerrajes() for full-text search

#### Database Initialization
- Automatic table creation for new databases
- Migration support for existing databases
- Proper foreign key relationships

## Usage Examples

### Get All Hardware
```bash
curl http://localhost:9995/api/herrajes?limit=20
```

### Search for Spider Hardware
```bash
curl "http://localhost:9995/api/herrajes?category=spider"
```

### Search by Product Code
```bash
curl "http://localhost:9995/api/herrajes?search=1214"
```

### Get Specific Hardware
```bash
curl http://localhost:9995/api/herrajes/1
```

## Next Steps: Designer Integration

To complete the implementation, add to designer UI:

### 1. Hardware Library Panel
- Display list of available herrajes by category
- Show thumbnails and key specs
- Filter and search capabilities
- Add "Add Hardware" button

### 2. Hardware Selection
- Allow users to click herraje to select
- Display hole pattern preview
- Show compatible glass thickness range
- Warn if glass doesn't meet spec

### 3. Automatic Hole Generation
When herraje is selected:
```javascript
// Get hole positions for glass dimensions
const positions = herraje.GetHolePositions(glassWidth, glassHeight);

// Create holes in design
positions.forEach(pos => {
  const hole = herraje.CreateCountersinkHole(pos);
  design.elements.holes.push(hole);
});

// Add avellanado if countersink specified
if (herraje.countersink_size > 0) {
  const avellanado = herraje.CreateAvellanado(pos);
  design.elements.holes.push(avellanado);
}
```

### 4. Work Instructions
- Generate PDF or instructions showing:
  - Exact hole positions and dimensions
  - Countersink angles and sizes
  - Required tolerance
  - Installation notes from herraje specs

### 5. Designer Modifications
- Add herraje object to Design.Elements
- Track which herrajes are used
- Validate hardware compatibility with glass specs
- Warn on conflicts (e.g., spacing violations)

## File Structure

```
internal/
├── models/
│   └── herraje.go          # Herraje model and types
├── handlers/
│   └── herraje.go          # HTTP request handlers
└── storage/
    ├── schema.sql          # Database schema (updated)
    └── sqlite.go           # Database operations (extended)

cmd/
└── seed-herrajes/
    └── main.go             # Data seeding utility
```

## API Response Examples

### List Response
```json
{
  "herrajes": [
    {
      "id": 1,
      "code": "1214000",
      "name": "Araña 1214 (4 patas)",
      "category": "spider",
      "material": "Acero inoxidable AISI 316",
      "finish": "Satinado",
      "max_load": 0,
      "min_thickness": 6,
      "max_thickness": 9,
      "hole_size": 8,
      "countersink_size": 0,
      "hole_pattern": "grid",
      "positions": 4,
      "specs": {
        "glass_thickness_range": "6 a 9mm",
        "installation": "Interiores"
      },
      "variants": [
        {
          "id": 1,
          "code": "1214104",
          "name": "Araña 1214 AISI 304",
          "material": "Acero inoxidable AISI 304"
        }
      ],
      "created_at": "2025-11-26T15:31:02Z",
      "updated_at": "2025-11-26T15:31:02Z"
    }
  ],
  "total": 8
}
```

## Notes

- All herrajes are stored with both metric and imperial measurements where applicable
- Countersink types follow ISO 14420 standard (cone 90°, flat, etc.)
- Load capacities reflect maximum recommended values from manufacturer
- Installation notes include maintenance recommendations (e.g., avoid chlorine-based cleaners)
- Images can be added via PictureURL field for UI display
- Soft-delete preserves historical data for audit and reporting

## Future Enhancements

1. **Image Management**: Upload and store product images
2. **PDF Export**: Generate technical drawings with hole patterns
3. **Load Calculations**: Compute actual load per hole based on configuration
4. **Compatibility Warnings**: Prevent incompatible combinations
5. **Multi-language Support**: Store descriptions in multiple languages
6. **Revision History**: Track changes to hardware specifications
7. **Supplier Integration**: Link to supplier catalogs and pricing
