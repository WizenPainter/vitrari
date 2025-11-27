# UI Layout Update - Hardware on Right Side

## Changes Made

### 1. Glass Thickness Range Updates (9.5mm Fix)

**Problem**: Hardware listings showed glass thickness ranges as "6-9mm" and "10-19mm", but there's no 9-10mm gap - 9.5mm is the standard intermediate glass thickness.

**Solution**: Updated all herraje definitions to properly account for 9.5mm glass:

#### Updated Ranges:
- **Interior Hardware (Araña 1214, Araña 1213)**: Now 6-9.5mm (was 6-9mm)
- **Exterior Hardware (Araña Querétaro, Soportes)**: Now 9.5-19mm (was 10-19mm)

**Files Updated**:
- `cmd/seed-herrajes/main.go` - Updated seed data for all herrajes
- `database/glass_optimizer.db` - Updated with correct thickness values via SQL

**Results**:
```
Araña 1214:      6.0 - 9.5mm  ✓
Araña 1213:      6.0 - 9.5mm  ✓
Araña Querétaro: 9.5 - 19mm  ✓
Soporte 1203:    9.5 - 19mm  ✓
Soporte 120305:  9.5 - 19mm  ✓
Soporte Estándar: 9.0 - 24mm ✓
```

### 2. Hardware Panel Moved to Right Side of Canvas

**Problem**: Hardware (herrajes) selection was mixed into the left sidebar properties panel, cluttering the hole properties.

**Solution**: Moved hardware catalog to a dedicated right-side panel next to the canvas.

**HTML Changes** (`templates/designer.html`):
- Created new `right-sidebar` div
- Moved hardware section from left sidebar to right side
- Created dedicated IDs for right-side components:
  - `herrajes-section-right`
  - `herrajes-content-right`
  - `herrajes-list-right`
  - `herrajes-search-right`
  - `herrajes-category-filter-right`
  - `btn-clear-herrajes-right`
  - `herrajes-toggle-right`

**Layout Structure**:
```html
<div class="canvas-area">
  <div class="canvas-toolbar">...</div>
  <div style="display: flex; gap: 1rem; flex: 1;">
    <canvas id="design-canvas"></canvas>
    <div class="right-sidebar" style="width: 300px; overflow-y: auto;">
      <!-- Hardware Panel Here -->
    </div>
  </div>
  <div class="canvas-info">...</div>
</div>
```

**Layout Benefits**:
1. Clean separation: Canvas on left, hardware on right
2. No clutter in hole properties
3. Hardware always visible while designing
4. Uses otherwise empty space on the right
5. Responsive: Hardware panel scrollable independently

### 3. UI Component Layout

**Right Sidebar Sections**:
```
┌─────────────────────────┐
│ Hardware (Herraje) ▼    │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Search hardware...  │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Category Filter ▼   │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Hardware List:      │ │
│ │ • Araña 1214        │ │
│ │ • Araña Querétaro   │ │
│ │ • Soporte 1203      │ │
│ │ • ...               │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Clear All Hardware  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 4. Responsive Design

**Desktop** (≥1024px):
- Canvas takes left/center area
- Hardware panel fixed on right (300px wide)
- Full visibility of all components

**Tablet** (768px - 1024px):
- Canvas flexible width
- Hardware panel still visible on right
- Panel scrollable if needed

**Mobile** (<768px):
- Canvas full width
- Hardware panel may be hidden or collapsed
- Can be accessed via toggle

## CSS Classes Added/Modified

```css
.right-sidebar {
  width: 300px;
  overflow-y: auto;
  border-left: 1px solid var(--border);
  padding: 1rem;
  background: var(--surface);
}
```

**Flexbox Layout**:
```css
div {
  display: flex;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}
```

## JavaScript Updates Required

When implementing the right-side hardware panel in JavaScript, ensure:

1. **Event Listeners**: Update to work with new element IDs
   - `herrajes-toggle-right` for expand/collapse
   - `herrajes-search-right` for search functionality
   - `herrajes-category-filter-right` for filtering
   - `btn-clear-herrajes-right` for clearing selections

2. **Panel Behavior**:
   - Expand/collapse toggle works independently from left sidebar
   - Search and filter work on right panel
   - Selected hardware displays properly

3. **Responsive Behavior**:
   - Panel scrollable when content overflows
   - Panel visible on desktop/tablet
   - Consider collapse/modal on mobile

## Database Updates

### Glass Thickness Values Updated:

```sql
-- Interior Spiders (6-9.5mm)
UPDATE herrajes SET min_thickness = 6.0, max_thickness = 9.5 WHERE code = '1214000'; -- Araña 1214
UPDATE herrajes SET min_thickness = 6.0, max_thickness = 9.5 WHERE code = '1213000'; -- Araña 1213

-- Exterior Spiders & Supports (9.5-19mm)
UPDATE herrajes SET min_thickness = 9.5, max_thickness = 19.0 WHERE code = '1201002'; -- Araña Querétaro 2p
UPDATE herrajes SET min_thickness = 9.5, max_thickness = 19.0 WHERE code = '1201004'; -- Araña Querétaro 4p
UPDATE herrajes SET min_thickness = 9.5, max_thickness = 19.0 WHERE code = '1202001'; -- Araña Querétaro Viga
UPDATE herrajes SET min_thickness = 9.5, max_thickness = 19.0 WHERE code = '1203000'; -- Rótula 1203
UPDATE herrajes SET min_thickness = 9.5, max_thickness = 19.0 WHERE code = '120305BSA'; -- Rótula 120305 BSA
```

## Verification

### API Response (Correct):
```json
{
  "herrajes": [
    {
      "code": "1214000",
      "name": "Araña 1214 (4 patas)",
      "min_thickness": 6.0,
      "max_thickness": 9.5
    },
    {
      "code": "1201002",
      "name": "Araña Querétaro (2 patas)",
      "min_thickness": 9.5,
      "max_thickness": 19.0
    }
  ]
}
```

## Next Steps

1. **Update JavaScript** to handle right-side hardware panel
   - Add event listeners for new element IDs
   - Implement toggle functionality
   - Connect search/filter functionality

2. **Test Responsive Layout**
   - Desktop: Verify right panel displays correctly
   - Tablet: Confirm layout is usable
   - Mobile: Decide on collapse/modal behavior

3. **Style Adjustments**
   - Fine-tune right panel width if needed
   - Adjust spacing and padding
   - Ensure proper scrolling behavior

4. **User Testing**
   - Verify hardware selection works from right panel
   - Confirm glass thickness ranges are correct
   - Check mobile responsiveness

## Summary

✓ Glass thickness ranges updated to properly account for 9.5mm glass
✓ Hardware panel moved from cluttered left sidebar to clean right panel
✓ Layout provides better visual hierarchy and workflow
✓ Ready for JavaScript implementation of right-panel functionality
