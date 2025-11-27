# Herrajes Quick Start Guide

## What Was Added

A complete hardware (herrajes) catalog system for glass installations, extracted from the Herralum 2025 catalog.

## Key Components

### 1. Database
- `herrajes` table: 8 hardware pieces with full specifications
- `herraje_variants` table: Material/finish alternatives
- Automatic migration for existing databases

### 2. API Routes
```
GET    /api/herrajes              # List all hardware
GET    /api/herrajes?search=1214  # Search
GET    /api/herrajes?category=spider  # Filter by type
GET    /api/herrajes/{id}         # Get single item
POST   /api/herrajes              # Add new (admin)
PUT    /api/herrajes/{id}         # Update (admin)
DELETE /api/herrajes/{id}         # Delete (admin)
```

### 3. Data Seeding
```bash
# Populate database with initial catalog
go run ./cmd/seed-herrajes
```

## Available Hardware Categories

### Spiders (Arañas)
- Interior: 1214, 1213 (for 6-9mm glass)
- Exterior: 1201, 1202 (for 10-19mm glass)
- Wall-mounted: 1250 variants

### Brackets & Connectors
- Ball joints: 1203, 120305BSA
- Support brackets: 1203ESTSA, 2216
- Bolts and hardware: 2237, 2217, 2236

## Hardware Specifications

Each hardware piece includes:
- Product code and name
- Material and finish
- Glass thickness range (6mm to 24mm)
- Load capacity (up to 200kg)
- **Hole specifications**:
  - Hole diameter (8-13mm typical)
  - Countersink size and type (cone, flat)
  - Hole pattern (single, pair, linear, grid)
  - Number of positions (1-4)

## Integration with Designer

When selecting hardware in the designer:

1. **Display**: Show hardware library with filters
2. **Validation**: Check glass thickness compatibility
3. **Generate Holes**: Auto-create holes at specified positions
4. **Add Avellanado**: Create countersink if needed
5. **Export**: Include hole specs in manufacturing drawings

## Example: Araña 1214

```
Code: 1214000
Name: Araña 1214 (4 patas)
Category: Spider
Glass: 6-9mm (templado)
Hole Size: 8mm diameter
Pattern: 4 holes in grid
Material: Stainless steel AISI 316
Variant: AISI 304 (code 1214104)
```

When selected for a 400x600mm glass:
- Holes at: (100,150), (300,150), (100,450), (300,450) - grid pattern
- Diameter: 8mm
- Tolerance: ±0.5mm
- No countersink needed

## Example: Rótula 120305BSA

```
Code: 120305BSA
Name: Soporte con rótula avellanado
Glass: 10-19mm
Hole Size: 10mm
Countersink: 13mm (cone type)
Material: Stainless steel AISI 316
Compatibility: Works with spiders 1201, 1202, 1250, 1251
```

When selected:
- Hole: 10mm diameter
- Countersink: 13mm diameter, 90° cone
- Allows recessed installation
- Works with 150kg load capacity

## Database Queries

### Find all spiders
```sql
SELECT * FROM herrajes WHERE category = 'spider' AND active = 1;
```

### Find by code
```sql
SELECT * FROM herrajes WHERE code = '1214000';
```

### Find with variants
```sql
SELECT h.*, v.code as variant_code, v.material as variant_material
FROM herrajes h
LEFT JOIN herraje_variants v ON h.id = v.herraje_id
WHERE h.code = '1201002'
ORDER BY h.name, v.created_at;
```

### Add new hardware
```go
herraje := &models.Herraje{
    Code: "NEW001",
    Name: "New Hardware",
    Category: models.CategorySpider,
    Material: "Acero inoxidable AISI 316",
    MinThickness: 6,
    MaxThickness: 9,
    HoleSize: 8,
    HolePattern: models.PatternGrid,
    Positions: 4,
    Active: true,
}
store.CreateHerraje(herraje)
```

## Testing the API

```bash
# Start server
./glass-optimizer &

# List all hardware
curl http://localhost:9995/api/herrajes

# Search for spiders
curl "http://localhost:9995/api/herrajes?category=spider"

# Get specific hardware
curl http://localhost:9995/api/herrajes/1

# Pretty print JSON
curl -s http://localhost:9995/api/herrajes | jq '.herrajes | .[0]'
```

## File Locations

- Model: `internal/models/herraje.go`
- Handlers: `internal/handlers/herraje.go`
- Storage: `internal/storage/sqlite.go` (new methods added)
- Schema: `internal/storage/schema.sql` (updated)
- Init: `internal/storage/init.go` (migrations updated)
- Routes: `main.go` (new routes added)
- Seeder: `cmd/seed-herrajes/main.go`
- Docs: `HERRAJES_IMPLEMENTATION.md` (full documentation)

## Next Steps

1. **UI Integration**
   - Add Hardware Library panel to designer
   - Implement hardware selection dialog
   - Display hole pattern preview

2. **Auto-Generation**
   - Create holes when hardware is selected
   - Add avellanados where needed
   - Generate work instructions

3. **Validation**
   - Check glass thickness compatibility
   - Warn on spacing violations
   - Validate load requirements

4. **Export**
   - Include hole specs in cutting plans
   - Generate installation instructions
   - Create technical drawings

## Support

- All hardware data from Herralum 2025 catalog (pages 175+)
- Specifications validated against official product sheets
- Material certifications: AISI 304 and AISI 316 stainless steel
- Load capacities follow manufacturer recommendations
