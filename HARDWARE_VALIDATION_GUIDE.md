# Hardware Validation & Bill of Materials User Guide

## Overview

The Glass Optimizer designer now includes three key features for managing hardware (herrajes) in your glass designs:

1. **Hardware Validation** - Ensures hole sizes match hardware specifications
2. **Hardware Details** - View complete hardware information in a modal
3. **Bill of Materials** - Generate and export complete project specifications

---

## Feature 1: Hardware Validation

### How It Works

When you assign hardware to a hole, the system automatically validates that the hole size matches the hardware's requirements.

### Validation Logic

- **Tolerance**: ±1mm difference is allowed
- **Example**: If hardware requires a 10mm hole, holes between 9mm-11mm are acceptable
- **Mismatches**: If the hole is outside the tolerance range, you'll see a warning

### Workflow

1. **Select a hole** in the designer
2. **Open the hole properties** in the left sidebar
3. **Choose hardware** from the "Hardware (Herraje)" dropdown
4. **If compatible**: Details modal opens automatically
5. **If incompatible**: Warning modal appears with options

### Warning Modal Options

```
Hardware Size Mismatch Warning
├─ Hardware requires 8mm hole
├─ But this hole is 6mm
├─ Difference: 2mm

Options:
├─ Cancel - Don't assign the hardware
└─ Assign Anyway - Proceed with assignment and see details
```

### Best Practices

- Always check the warning messages
- Adjust hole sizes to match hardware if possible
- Use "Assign Anyway" only if you plan to modify the hole during fabrication
- Reference the hardware details modal for exact specifications

---

## Feature 2: Hardware Details Modal

### Accessing Hardware Details

Hardware details automatically display when:
1. **Assigning compatible hardware** - Shows immediately after validation
2. **Assigning incompatible hardware** - Shows after you confirm "Assign Anyway"

### Information Displayed

#### Header Section
- Hardware code (e.g., "1214000")
- Hardware name (e.g., "Araña Interior")
- Close button

#### Image
- Product image/diagram (if available)

#### Description
- Full product description

#### Key Specifications (2-column grid)
- **Hole Size**: Diameter in mm (e.g., 8mm)
- **Category**: Type of hardware (spider, bracket, connector, etc.)
- **Material**: Steel, stainless, aluminum, etc.
- **Max Load**: Weight capacity in kg
- **Glass Thickness Range**: Compatible glass thicknesses (e.g., 6-9.5mm)
- **Hole Pattern**: Pattern type (single, pair, linear, grid)

#### Countersink Info (if applicable)
- Countersink diameter
- Countersink type (cone, flat, etc.)

#### Installation Details (if available)
- Installation type (interior, exterior)
- Safety notes and warnings

### Example Modal Content

```
CODE: 1214000
NAME: Araña Interior 1214/1213

[Product Image]

Description: Interior spider fitting for mounting glass...

Specifications:
- Hole Size: 8mm
- Category: Spider
- Material: Stainless Steel AISI 304
- Max Load: 50 kg
- Glass Thickness: 6.0-9.5mm
- Hole Pattern: Single

Countersink: 10mm (Cone)

Installation: Interior mounting
Safety: Use appropriate fasteners and ensure proper installation
```

---

## Feature 3: Bill of Materials (BOM)

### Accessing the BOM

1. **Design your glass piece** with holes and hardware
2. **Click the "BOM" button** in the toolbar (between Load Design and Print Design buttons)
3. **Review the generated BOM** in the modal
4. **Export as JSON** if needed for external processing

### BOM Sections

#### Glass Specifications
```
Glass Specifications
├─ Size: 1200×800mm
├─ Area: 0.96m²
├─ Thickness: 6mm
├─ Type: clear
├─ CPB (Polished Edge): Yes/No
└─ Painted Areas: X areas = Y m²
```

#### Hardware Components
```
Hardware Components
┌────────────────────────────────────────────┐
│ Code    │ Name           │ Qty │ Material   │
├────────────────────────────────────────────┤
│ 1214000 │ Araña Interior │ 2   │ Stainless │
│ 1215200 │ Support Bracket│ 4   │ Aluminum  │
└────────────────────────────────────────────┘
```

#### Holes Summary
```
Holes Summary
┌────────────────────────────────────────────┐
│ Circle Holes: 2    │ Drill Holes: 4       │
│ Countersinks: 1    │ Rectangular: 0       │
│ Edge Clips: 0      │                      │
└────────────────────────────────────────────┘
```

#### Summary
```
Summary
- Total Holes: 7
- Total Hardware Items: 2
- Total Area: 0.96 m²
```

### BOM Uses

**For Ordering:**
- Exact glass dimensions and specifications
- Hardware quantities and specifications
- Material information

**For Fabrication:**
- Detailed hole specifications
- Hardware requirements per hole
- Material and finish requirements

**For Documentation:**
- Complete project specifications
- Hardware compatibility info
- Safety and installation notes

### Exporting BOM

1. **Click "Export JSON"** button in the BOM modal
2. **File downloads** as `bom-[timestamp].json`
3. **Use for:**
   - CNC machine programming
   - Inventory management
   - Quote generation
   - External software integration

### JSON Export Format

```json
{
  "glass": {
    "quantity": 1,
    "width": 1200,
    "height": 800,
    "thickness": 6,
    "area": "0.96",
    "type": "clear",
    "cpb": true,
    "painted": false
  },
  "hardware": [
    {
      "id": 1,
      "code": "1214000",
      "name": "Araña Interior",
      "category": "spider",
      "material": "Stainless Steel",
      "quantity": 2,
      "holeSize": 8,
      "maxLoad": 50
    }
  ],
  "holes": {
    "circle": [
      {"index": 1, "x": "600", "y": "400", "diameter": "8"}
    ],
    "taladro": [],
    "avellanado": [],
    "rectangle": [],
    "clip": []
  },
  "summary": {
    "totalHoles": 1,
    "totalHardwareItems": 1,
    "totalArea": "0.96"
  }
}
```

---

## Workflow Example: Complete Project

### Step 1: Design Glass Piece
- Set dimensions: 1200mm × 800mm
- Set thickness: 6mm
- Type: Clear glass

### Step 2: Add Holes
- Create two circle holes (8mm diameter) at center top and bottom
- Create four taladro holes (6mm) for mounting

### Step 3: Assign Hardware
1. **Select first circle hole**
2. **Choose hardware**: "1214000 - Araña Interior (Stainless)"
3. **Validation passes** (hole is 8mm, hardware needs 8mm)
4. **Details modal opens** - review hardware specs
5. **Repeat** for second hole

### Step 4: Check Compatibility
- Glass thickness: 6mm ✓ (within 6-9.5mm range)
- All holes compatible ✓

### Step 5: Generate BOM
1. **Click BOM button**
2. **Review specifications**
3. **Export JSON** for supplier/fabricator
4. **Print or save** for documentation

### Step 6: Validation Workflow (Mismatch Example)

1. **Select hole** with 6mm diameter
2. **Choose hardware** requiring 8mm
3. **Warning modal appears**:
   ```
   Hardware requires 8mm hole
   But this hole is 6mm
   Difference: 2mm
   ```
4. **Options:**
   - ✓ Cancel - select different hardware
   - → Assign Anyway - proceed and modify during fabrication
5. **If "Assign Anyway":**
   - Hardware is assigned
   - Details modal shows specifications
   - Make a note to adjust hole during fabrication

---

## Technical Details

### Validation Tolerance
```
TOLERANCE = 1mm
isCompatible = |holeDiameter - hardwareHoleSize| <= TOLERANCE
```

### Data Structure for Each Hole
```javascript
{
  x: number,              // X position in mm
  y: number,              // Y position in mm
  diameter: number,       // For circles/taladro
  shape: string,          // "circle", "taladro", "avellanado", "rectangle", "clip"
  herrajes_herraje_id: number, // Hardware ID (null if none assigned)
  holeDiameter: number    // For avellanado (countersink)
}
```

### Hardware Specification Fields
```javascript
{
  id: number,
  code: string,
  name: string,
  description: string,
  category: string,
  material: string,
  finish: string,
  max_load: number,
  min_thickness: number,
  max_thickness: number,
  hole_size: number,
  countersink_size: number,
  countersink_type: string,
  hole_pattern: string,
  picture_url: string,
  specs: {
    installation: string,
    safety_notes: string,
    // ...other metadata
  }
}
```

---

## Troubleshooting

### Issue: Hardware dropdown shows "Loading hardware..."
**Solution**: Wait a moment for the API to respond. If it persists, check browser console for errors.

### Issue: Validation modal keeps appearing
**Solution**: You need to either:
1. Adjust the hole size to match hardware requirements
2. Select different hardware
3. Click "Assign Anyway" to proceed with incompatible size

### Issue: BOM doesn't show hardware
**Solution**: Hardware only appears in BOM if it's assigned to holes. Assign hardware first, then generate BOM.

### Issue: Countersink details not showing
**Solution**: Not all hardware has countersink. Only hardware with countersink_size > 0 will display this section.

---

## API Endpoints Used

### Get Hardware List
```
GET /api/herrajes?limit=100
Response: { herrajes: [...] }
```

### Get Hardware Details
```
GET /api/herrajes/{id}
Response: { herraje: {...} }
```

---

## Tips & Tricks

1. **Quick Hardware Assignment**
   - Sort hardware by category to find compatible items faster
   - Use the search in the right sidebar to filter by code or name

2. **Validation Workflow**
   - Always check the tolerance message before confirming incompatible assignments
   - Reference the details modal to understand exact specifications

3. **BOM Optimization**
   - Generate BOM before finalizing to catch any issues
   - Export JSON for CNC programming
   - Keep BOM for fabrication reference

4. **Mobile Friendly**
   - All modals are responsive
   - Scroll within modals on smaller screens
   - Touch-friendly buttons and dropdowns

---

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review the hardware specifications in the details modal
3. Verify hole sizes match hardware requirements
4. Export BOM as JSON for external analysis
