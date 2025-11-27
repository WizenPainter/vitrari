# Herrajes (Hardware) UI Integration

## Overview
Successfully integrated the Hardware (Herrajes) Catalog System with the Glass Designer UI. Users can now associate hardware components with each hole in their glass designs.

## Changes Made

### 1. **Designer Properties Panel** (`static/js/designer.js`)

#### Added Herraje Selection Dropdown
- All hole types now support hardware selection via dropdown menu:
  - Circle holes
  - Taladro (drill) holes
  - Avellanado (countersink) holes
  - Rectangle holes
  - Clip (edge) holes

#### Implementation Details:
```javascript
// Each hole now stores:
hole.herrajes_herraje_id = <id> // Reference to the Herraje record
```

### 2. **Dynamic Herraje Loading** (`populateHerrajes()` method)

```javascript
async populateHerrajes() {
  // Fetches from /api/herrajes?limit=100
  // Populates all dropdown selects in the properties panel
  // Shows herraje name with material variant
}
```

Features:
- Loads herrajes from the API endpoint
- Displays hardware name with material variant
- Updates all dropdowns when rendering holes list
- Preserves selected values during re-renders

### 3. **Hole Property Updates**

```javascript
updateHoleProperty(index, property, value) {
  // Handle herraje selection
  if (property === "herrajes_herraje_id") {
    hole.herrajes_herraje_id = value ? parseInt(value) : null;
    this.renderHolesList();
    return;
  }
  // ... other properties
}
```

### 4. **Visual Indicators**

Added a green checkmark badge on holes with assigned hardware:
- Badge position: Top-right corner of hole
- Color: Green (#10b981)
- Icon: White checkmark
- Visible on canvas and print views

```javascript
// Draw herraje indicator badge if hardware is assigned
if (hole.herrajes_herraje_id) {
  // Draw green circle with checkmark
}
```

### 5. **Backend Format Conversion**

Updated `convertToBackendFormat()` to include herraje IDs:

```javascript
// For each hole element:
if (hole.herrajes_herraje_id) {
  element.herrajes_herraje_id = hole.herrajes_herraje_id;
}
```

When saving designs, the herraje associations are preserved in the elements structure.

## UI Layout

Each hole's properties panel now includes:
```
[Hole Type] #1
├─ X Position (mm): [input]
├─ Y Position (mm): [input]
├─ Diameter/Width (mm): [input]
├─ Height/Countersink (mm): [input]
└─ Hardware (Herraje): [dropdown ▼]
    ├─ -- Select Hardware --
    ├─ Araña 1214 (4 patas) (AISI 316)
    ├─ Araña Querétaro (2 patas) (AISI 316)
    ├─ Soporte con rótula 1203 (AISI 316)
    └─ ... more options
```

## Event Handling

- Clicking on hole items in the list maintains selection
- Dropdown changes trigger herraje update and re-render
- Selected dropdown value is preserved during panel re-renders
- No selection of hole when clicking dropdown

## Data Flow

1. **Create hole** → hole object initialized with `herrajes_herraje_id: null`
2. **Render panel** → `renderHolesList()` generates dropdowns
3. **Populate dropdowns** → `populateHerrajes()` loads from API
4. **User selects hardware** → `updateHoleProperty()` stores ID
5. **Visual feedback** → Green badge drawn on hole
6. **Save design** → `convertToBackendFormat()` includes herraje ID in elements

## API Integration

### Endpoint: `/api/herrajes`
- Query params: `limit=100` (retrieve all hardware)
- Response format:
```json
{
  "herrajes": [
    {
      "id": 1,
      "code": "1214000",
      "nombre": "Araña 1214 (4 patas)",
      "material_variants": ["AISI 316", "AISI 304"],
      ...
    },
    ...
  ],
  "total": 8
}
```

## Browser Compatibility

- Works with all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard DOM APIs and fetch()
- No external dependencies required

## Testing Checklist

✓ Dropdown loads herraje options on page load
✓ Can select hardware from dropdown
✓ Selection persists when switching between holes
✓ Green badge appears when hardware is assigned
✓ Badge disappears when hardware is deselected
✓ Design data includes herraje IDs when saved
✓ Hole selection works properly when clicking list items
✓ Dropdown doesn't trigger hole selection

## Future Enhancements

1. **Hardware Details Modal**
   - Click on selected hardware name to view specs
   - Show compatibility information
   - Display material variants and pricing

2. **Hardware Validation**
   - Warn if hole diameter doesn't match hardware requirements
   - Suggest compatible hardware based on hole specifications
   - Validate glass thickness compatibility

3. **Bulk Operations**
   - Apply same hardware to multiple holes at once
   - Save hardware presets for quick assignment

4. **Visual Rendering**
   - Show herraje specifications in hole tooltip
   - Render hardware component as overlay on hole
   - Display hole patterns visually

5. **Export Features**
   - Include herraje information in PDF exports
   - Generate BOM (Bill of Materials) from assigned hardware
   - Export shopping list with quantities

## Files Modified

- `static/js/designer.js` - Main implementation
  - `renderHolesList()` - Added herraje dropdowns to all hole types
  - `updateHoleProperty()` - Handle herraje selection
  - `populateHerrajes()` - New method to load and populate dropdowns
  - `drawHole()` - Added visual indicator badge
  - `convertToBackendFormat()` - Include herraje IDs in exported data

## Notes

- Herraje information is stored locally in the designer object
- When loading a saved design, herraje associations are restored
- The system gracefully handles missing or invalid herraje IDs
- Dropdown updates are non-blocking (async fetch)
