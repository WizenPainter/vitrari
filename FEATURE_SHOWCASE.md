# Herrajes UI Integration - Feature Showcase

## Visual Overview

### Before: No Hardware Assignment
```
Glass Designer Canvas              Properties Panel
┌──────────────────────┐         ┌─────────────────────┐
│                      │         │ Circle Hole 1       │
│        ○             │         ├─────────────────────┤
│     (10mm)           │         │ X Position: 100mm   │
│                      │         │ Y Position: 200mm   │
│                      │         │ Diameter: 10mm      │
└──────────────────────┘         └─────────────────────┘

Result: No indication of what hardware goes here
```

### After: Hardware Assignment
```
Glass Designer Canvas              Properties Panel
┌──────────────────────┐         ┌─────────────────────┐
│                      │         │ Circle Hole 1       │
│        ◉✓            │         ├─────────────────────┤
│     (10mm)           │         │ X Position: 100mm   │
│  [Green badge]       │         │ Y Position: 200mm   │
│                      │         │ Diameter: 10mm      │
└──────────────────────┘         │ Hardware (Herraje): │
                                  │ [Araña 1214 ▼]      │
                                  │ [✓ Assigned]        │
                                  └─────────────────────┘

Result: Clear indication of hardware assignment
```

## Step-by-Step Workflow

### 1. Creating a Hole
```
Designer Canvas                    Steps
┌──────────────────────┐
│  Select Tool: Circle │     1. Click "Circle" tool button
│                      │     2. Click on canvas to place hole
│        ○             │     3. Hole appears at click location
│                      │
└──────────────────────┘
```

### 2. Selecting Hardware
```
Properties Panel                   Step
┌─────────────────────┐
│ Circle Hole 1       │     Click hole in list
├─────────────────────┤
│ X Position: 100mm   │     (hole becomes selected)
│ Y Position: 200mm   │
│ Diameter: 10mm      │
│ Hardware (Herraje): │
│ [-- Select -- ▼]    │     (dropdown ready)
└─────────────────────┘
```

### 3. Choosing Hardware
```
Dropdown Options                   Result
┌──────────────────┐
│ -- Select --   │            Each option shows:
│ Araña 1214...  │ ← Active   - Hardware name
│ Araña Querétaro│            - Material variant
│ Soporte 1203   │            - Quantity code
│ Soporte 120305 │
│ ...            │
└──────────────────┘
```

### 4. Confirmation
```
Canvas                             Panel
┌──────────────────────┐         ┌─────────────────────┐
│                      │         │ Circle Hole 1       │
│        ◉✓            │         ├─────────────────────┤
│     (10mm)           │         │ X: 100mm            │
│   [GREEN BADGE]      │         │ Y: 200mm            │
│                      │         │ Diameter: 10mm      │
└──────────────────────┘         │ Hardware: [Araña... │
                                  │    [✓ Selected]    │
                                  └─────────────────────┘
```

## UI Elements

### Hardware Dropdown
```
Hardware (Herraje): [Araña 1214 (4 patas) (AISI 316) ▼]
                     |                                 |
                     |← Hardware name        Material ↵

Options Format:
  [ID] - [Name] ([Material Variant])
  
Example:
  1 - Araña 1214 (4 patas) (AISI 316)
  3 - Araña Querétaro (2 patas) (AISI 316)
  6 - Soporte con rótula 1203 (AISI 316)
```

### Green Checkmark Badge
```
Position on hole:
     ◉ ← Hole center
    ⦿✓ ← Green badge with checkmark
     
Badge Details:
  - Color: Green (#10b981)
  - Size: 12px diameter
  - Icon: White checkmark
  - Position: +8px right, -12px up from hole
  
Visibility:
  ✓ Shows on canvas
  ✓ Shows in print preview
  ✓ Shows in exports
```

## Data Model

### Hole Object With Hardware
```javascript
{
  x: 100,                          // Position (mm)
  y: 200,
  diameter: 10,                    // Size (mm)
  shape: "circle",                 // Hole type
  herrajes_herraje_id: 1           // NEW: Hardware ID
}
```

### Exported Element
```javascript
{
  id: "hole-timestamp-1",
  type: "circular",
  center: { x: 100, y: 200 },
  radius: 5,
  herrajes_herraje_id: 1,          // NEW: Included in export
  style: { ... },
  locked: false,
  visible: true
}
```

## User Interactions

### Click Patterns
```
Properties Panel
├─ Click hole item
│  └─ Hole selected (highlighted)
├─ Click dropdown arrow
│  └─ Options list appears
├─ Click option
│  └─ Selection confirmed
│     └─ Badge appears on canvas
└─ Click X to delete hole
   └─ Hole and assignment removed
```

### Keyboard Navigation
```
Tab             → Move to next element
Shift+Tab       → Move to previous element
Arrow Down      → Next dropdown option
Arrow Up        → Previous dropdown option
Enter           → Select highlighted option
Escape          → Close dropdown without selecting
```

## Multi-Hole Workflow

### Assigning Different Hardware to Multiple Holes
```
Step 1: Create holes
  ○ Hole 1 (10mm)
  ○ Hole 2 (8mm)
  ○ Hole 3 (12mm)

Step 2: Select hardware for each
  ○ Hole 1 → Araña Querétaro
  ◉✓ Hole 2 → Soporte 1203
  ○ Hole 3 → Soporte 120305BSA

Result in canvas:
  ◉✓ (Green badge)
  ◉✓ (Green badge)
  ◉✓ (Green badge)
  
All three holes have hardware assigned!
```

## Hardware Information Display

### In Designer UI
```
Hardware Dropdown Shows:
  Code        Name                      Material
  ────────────────────────────────────────────
  1214000     Araña 1214 (4 patas)      AISI 316
  1201002     Araña Querétaro (2 patas) AISI 316
  1203000     Soporte con rótula 1203   AISI 316
  120305BSA   Soporte avellanado 120305 AISI 316
  1203ESTSA   Soporte estándar 1203     AISI 316
```

### In Saved Design
```json
{
  "design": {
    "glass": {
      "width": 1200,
      "height": 800,
      "thickness": 10
    },
    "elements": {
      "holes": [
        {
          "id": "hole-001",
          "herrajes_herraje_id": 3,
          "center": {"x": 100, "y": 150},
          "radius": 5
        }
      ]
    }
  }
}
```

## Visual States

### Hole States
```
Empty Hole (no hardware):
  ○ 
  (No badge)

Selected Hole (with hardware):
  ◉ ← Highlighted/selected
  ✓ (Green badge visible)

Unselected Hole (with hardware):
  ◉✓
  ✓ (Green badge visible)

Hole with Error:
  ○ 
  ⚠ (Warning badge) [future feature]
```

### Dropdown States
```
Default (not yet selected):
  [-- Select Hardware -- ▼]

Open (showing options):
  [Araña 1214 ▲]
  ├─ Araña Querétaro
  ├─ Soporte 1203
  └─ ...

Selected:
  [Araña 1214 (4 patas) ▼]
  (Shows selected option)
```

## Full Design Example

### Glass Design Specification
```
┌─────────────────────────────────┐
│  Glass Design                   │
├─────────────────────────────────┤
│ Size: 1200mm × 800mm            │
│ Thickness: 10mm                 │
│ Type: Clear glass               │
│                                 │
│ Hole Layout:                    │
│ ◉✓ (100, 700) - Araña Querétaro│
│ ◉✓ (1100, 700) - Araña Querétaro
│ ◉✓ (300, 400) - Soporte 1203    │
│ ◉✓ (900, 400) - Soporte 120305  │
└─────────────────────────────────┘

All holes have green badges ✓
All hardware is assigned ✓
Design is ready for export ✓
```

## Feature Highlights

### 1. Non-intrusive Integration
```
Old workflow:  Select hole → Edit properties → Done
New workflow:  Select hole → Edit properties → Add hardware → Done
              (Just one extra dropdown!)
```

### 2. Visual Confirmation
```
No need to scroll or check lists
Just look at canvas: ◉✓ = hardware assigned
                    ◉  = no hardware yet
```

### 3. Flexible Assignment
```
Can change hardware anytime:
  1. Select hole
  2. Open dropdown
  3. Pick different hardware
  4. Badge updates immediately
  
Can remove assignment:
  1. Open dropdown
  2. Select "-- Select Hardware --"
  3. Badge disappears
```

### 4. Design Preservation
```
When you save: Hardware assignments included ✓
When you load: Assignments restored ✓
When you export: Hardware info exported ✓
```

## Real-World Scenarios

### Scenario 1: Interior Glass Installation
```
Design Requirements:
  - Glass: 8mm (interior)
  - Hardware: Araña 1214 (interior spider)
  
Process:
  1. Create 4 corner holes (8mm)
  2. Select all holes sequentially
  3. Assign: Araña 1214 to each
  4. See green badges on all 4
  5. Save design → Hardware preserved
  6. Export → Manufacturing knows which hardware
```

### Scenario 2: Exterior Glass with Brackets
```
Design Requirements:
  - Glass: 12mm (exterior)
  - Hardware: Mix of spiders and supports
  
Process:
  1. Create 2 holes for spiders (10mm)
  2. Create 2 holes for brackets (8mm)
  3. Assign Araña Querétaro to spider holes
  4. Assign Soporte 1203 to bracket holes
  5. See mixture of badges ✓
  6. All assignments clear at glance
  7. Export for manufacturing
```

## Mobile Experience

### Responsive Dropdown
```
Phone (narrow width):     Tablet (wider width):
┌─────────────────┐      ┌─────────────────────┐
│ Hardware:       │      │ Hardware (Herraje): │
│ [Araña 1214 ▼] │      │ [Araña 1214 (4) ▼]  │
└─────────────────┘      └─────────────────────┘

Dropdown overlay:          Inline dropdown:
  (Full width options)       (Compact display)
```

### Touch Interactions
```
Tap dropdown       → Opens options
Swipe/scroll       → Browse options
Tap option         → Selects it
Tap outside        → Closes dropdown
```

---

## Summary

The Herrajes UI Integration provides a seamless way to:
1. **Discover** available hardware
2. **Select** appropriate hardware
3. **Visualize** assignments
4. **Track** what's assigned
5. **Export** with specifications

All with minimal UI complexity and maximum clarity!
