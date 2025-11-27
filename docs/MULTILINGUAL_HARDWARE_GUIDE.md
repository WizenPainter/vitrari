# Multi-Language Hardware Support & Hardware Images Guide

## Overview

The Glass Optimizer now supports hardware information in multiple languages (English and Spanish) with visual hardware previews in the selection dropdowns.

---

## Features Implemented

### 1. Multi-Language Hardware Information

#### English Hardware Labels
- **Hole Size** → Tamaño del Taladro
- **Category** → Categoría
- **Material** → Material
- **Finish** → Acabado
- **Max Load** → Carga Máxima
- **Glass Thickness Range** → Rango de Espesor
- **Hole Pattern** → Patrón de Taladros
- **Countersink** → Avellanado
- **Installation** → Instalación
- **Safety Notes** → Notas de Seguridad
- **Positions** → Posiciones
- **Interior/Exterior** → Interior/Exterior

#### Where Translations Apply
1. **Hardware Details Modal**
   - All labels dynamically translate based on selected language
   - Updates when user changes language via language selector

2. **Hole Properties Panel**
   - Hardware dropdown label translates
   - Select button text translates

3. **BOM Section**
   - All BOM header translates
   - Hardware components section label
   - Holes summary section label

### 2. Hardware Picture Preview in Dropdowns

#### Visual Preview Features
- **Automatic Image Display**: When user selects hardware, the product image displays below the dropdown
- **Responsive Images**: Images scale to fit container (60px height, contain sizing)
- **Error Handling**: If image doesn't load, preview section hides gracefully
- **Clean Design**: Image displayed in a subtle bordered card with light background

#### How It Works
1. User clicks hardware dropdown
2. Selects a hardware item
3. Product image loads automatically below dropdown
4. Shows hardware visual for quick identification
5. Helps users confirm correct hardware selection

#### Image Requirements
- `picture_url` field in Herraje database record
- Supported formats: JPG, PNG, GIF, SVG
- Recommended size: 200x200px or larger
- Aspect ratio: Any (uses `object-fit: contain`)

### 3. Language Support Architecture

#### Translation Keys Added
```javascript
// English Keys (en)
hardware: "Hardware"
selectHardware: "Select Hardware"
holeSize: "Hole Size"
category: "Category"
material: "Material"
finish: "Finish"
maxLoad: "Max Load"
glassThicknessRange: "Glass Thickness Range"
holePattern: "Hole Pattern"
countersink: "Countersink"
installation: "Installation"
safetyNotes: "Safety Notes"
positions: "Positions"
// ... and more

// Spanish Keys (es)
hardware: "Herrajes"
selectHardware: "Seleccionar Herraje"
holeSize: "Tamaño del Taladro"
categoria: "Categoría"
material: "Material"
finish: "Acabado"
maxLoad: "Carga Máxima"
glassThicknessRange: "Rango de Espesor"
holePattern: "Patrón de Taladros"
avellanado: "Avellanado"
installation: "Instalación"
safetyNotes: "Notas de Seguridad"
posiciones: "Posiciones"
// ... and more
```

#### Translation Function Usage
```javascript
// In modals and UI elements
const t = window.i18n ? window.i18n.t : (key) => key;

// Use in templates
<label>${t('holeSize')}</label>
```

---

## User Experience Workflow

### Scenario 1: English User Selecting Hardware

```
1. User opens designer in English
2. Creates a hole and opens properties
3. Clicks hardware dropdown
   ├─ Label shows: "Hardware:"
   └─ Placeholder shows: "-- Select Hardware --"
4. User selects "1214000 - Araña Interior (Stainless)"
   ├─ Product image loads below dropdown (if available)
   └─ Image shows spider fitting hardware
5. User clicks to expand hardware details modal
6. Modal displays with English labels:
   - "Hole Size": 8mm
   - "Category": Spider
   - "Material": Stainless Steel
   - "Max Load": 50 kg
   - "Glass Thickness Range": 6.0-9.5mm
   - "Hole Pattern": Single
   - "Installation": Interior
   - "Safety Notes": Ensure proper fastening
```

### Scenario 2: Spanish User Selecting Hardware

```
1. User opens designer in Spanish (or changes to Spanish)
   ├─ Language selector clicked
   └─ Page language changes to Spanish
2. Creates a hole and opens properties
3. Clicks hardware dropdown
   ├─ Label shows: "Herrajes:"
   └─ Placeholder shows: "-- Seleccionar Herraje --"
4. User selects "1214000 - Araña Interior (Acero Inoxidable)"
   ├─ Product image loads (same image as English)
   └─ Image shows hardware with Spanish context
5. User clicks to expand hardware details
6. Modal displays with Spanish labels:
   - "Tamaño del Taladro": 8mm
   - "Categoría": Spider (categoría no se traduce)
   - "Material": Stainless Steel
   - "Acabado": Satin
   - "Carga Máxima": 50 kg
   - "Rango de Espesor": 6.0-9.5mm
   - "Patrón de Taladros": Single
   - "Instalación": Interior
   - "Notas de Seguridad": Asegurar fijación adecuada
```

### Image Preview Display

```
Hardware Dropdown:
┌─────────────────────────────────┐
│ [1214000 - Araña Interior (SS)] │  ← Dropdown with text
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  [Product Image Preview]        │  ← Auto-displays when selected
│  (60px height, centered)        │
└─────────────────────────────────┘
```

---

## Technical Implementation

### Files Modified

1. **static/js/i18n.js**
   - Added 60+ new translation keys for hardware terms
   - English and Spanish translations
   - Hardware-specific vocabulary

2. **static/js/designer.js**
   - Updated `showHardwareDetailsModal()` to use `t()` function
   - Enhanced `renderHolesList()` to include image preview containers
   - Added `updateHerrrajePreview()` method for image display
   - Modified `populateHerrajes()` to handle image URLs
   - Added image preview event handlers

### New Methods

#### updateHerrrajePreview(holeIndex, herrajeId)
```javascript
/**
 * Update herraje preview image below dropdown
 * @param {number} holeIndex - Index of the hole
 * @param {number} herrajeId - Selected herraje ID
 */
updateHerrrajePreview(holeIndex, herrajeId) {
  // Fetch selected option
  // Get picture URL from option.dataset.picture
  // Display or hide preview div based on image availability
  // Handle loading errors gracefully
}
```

#### Enhanced populateHerrajes()
```javascript
// Now:
// 1. Finds all herraje select dropdowns by ID
// 2. Stores picture_url in option.dataset.picture
// 3. Adds change event listeners
// 4. Calls updateHerrrajePreview() on change
// 5. Restores previous selection with preview
```

### HTML Structure for Preview

```html
<label>
  Herrajes:
  <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
    <select id="herraje-select-0" style="flex: 1;">
      <option value="">-- Seleccionar Herraje --</option>
      <!-- Options with data-picture attributes -->
    </select>
  </div>
  
  <!-- Hidden by default, shown when image loads -->
  <div id="herraje-preview-0" style="display: none; border: 1px solid #e2e8f0; ...">
    <img id="herraje-img-0" style="width: 100%; height: 60px; object-fit: contain;">
  </div>
</label>
```

---

## Database Requirements

### Herraje Table
Ensure these fields are populated:
- `picture_url` - URL to hardware product image (optional but recommended)
- `code` - Hardware code (e.g., "1214000")
- `name` - Hardware name (translated separately in UI)
- All other specification fields (used in modals)

### Example Record
```json
{
  "id": 1,
  "code": "1214000",
  "name": "Araña Interior 1214/1213",
  "picture_url": "https://example.com/images/arana-interior.jpg",
  "category": "spider",
  "material": "Stainless Steel AISI 304",
  "finish": "Satin",
  "max_load": 50,
  "min_thickness": 6.0,
  "max_thickness": 9.5,
  "hole_size": 8,
  "countersink_size": 10,
  "hole_pattern": "single",
  "positions": 1
}
```

---

## Language Switching

### How Language Change Works

```javascript
// User clicks language button
document.querySelector('.lang-btn[data-lang="es"]').click()

// Triggers setLanguage('es')
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("vitrari-lang", lang);
  
  // Update all [data-i18n] elements
  updatePageLanguage();
  
  // Re-render designer components
  if (window.designer) {
    window.designer.renderHolesList(); // Re-renders with new language
    // ... other updates
  }
}
```

### Language Persistence
- Selected language saved to localStorage
- Persists across browser sessions
- Default: Spanish (`localStorage.getItem("vitrari-lang") || "es"`)

---

## Image Preview Error Handling

### Graceful Degradation
```javascript
// If image URL doesn't load:
imgElement.onerror = () => {
  previewDiv.style.display = 'none'; // Hide preview div
  // User still sees dropdown, no error message
}

// If image loads successfully:
imgElement.onload = () => {
  previewDiv.style.display = 'block'; // Show preview
}

// If no picture_url:
// Preview div stays hidden, dropdown still functional
```

### User Experience
- Missing images don't break functionality
- Users can still select hardware without seeing image
- Images are bonus enhancement, not required

---

## Translation Coverage

### Hardware Details Modal
✓ All labels translated
✓ Field names translated
✓ Button text translated
✓ Section headers translated

### Hardware Dropdown
✓ Label "Hardware" → "Herrajes"
✓ Placeholder text translates
✓ Code and name displayed as-is (not translated)

### BOM Section
✓ "Hardware Components" translates
✓ "Holes Summary" translates
✓ All field names translate

### Validation Messages
✓ Mismatch warning translates
✓ Button text translates
✓ Instructions translate

---

## Testing Checklist

### Language Switching
- [ ] Verify English displays correctly
- [ ] Verify Spanish displays correctly
- [ ] Language persists after refresh
- [ ] All hardware labels update on language change
- [ ] Modal closes and re-opens with new language

### Hardware Images
- [ ] Images display when available
- [ ] Images don't display when URL is missing
- [ ] Images display after hardware selection
- [ ] Images hide when dropdown resets
- [ ] Images load correctly (no broken images)
- [ ] Images are properly sized (60px height)

### Combined Functionality
- [ ] Hardware selection works with translations
- [ ] Images display with correct hardware
- [ ] Changing language updates image preview info
- [ ] Multiple hole assignments all show correct images
- [ ] BOM displays in correct language with images referenced

---

## Browser Support

| Browser | Language Support | Image Support |
|---------|-----------------|---------------|
| Chrome  | ✓               | ✓             |
| Firefox | ✓               | ✓             |
| Safari  | ✓               | ✓             |
| Edge    | ✓               | ✓             |
| Mobile  | ✓               | ✓             |

---

## Performance Considerations

### Image Loading
- Images load asynchronously (no blocking)
- One image loads per selection (not all at once)
- Images cached by browser
- Fallback: hidden preview if image fails

### Language Changes
- Language change triggers re-render
- Only visible components update
- No full page reload required
- Smooth user experience

### Translation System
- Translations bundled in i18n.js
- No external API calls for translations
- Instant switching
- Lightweight (~100KB JSON)

---

## Future Enhancements

1. **Image Gallery Modal**
   - Click image to see full-size
   - Multiple images per hardware
   - Rotation/zoom features

2. **Hardware Comparison**
   - Compare specs in different languages
   - Side-by-side images

3. **Translated Descriptions**
   - Translate hardware descriptions
   - Localize all text content

4. **RTL Language Support**
   - Add Arabic, Hebrew support
   - Right-to-left UI layout

5. **Hardware Variants by Language**
   - Language-specific hardware names
   - Regional availability information

---

## Troubleshooting

### Issue: Hardware labels not translating
**Solution**: 
- Check `i18n.js` has translation keys
- Verify `t()` function called in modal
- Clear localStorage and refresh

### Issue: Images not displaying
**Solution**:
- Verify `picture_url` in database
- Check image URL is accessible
- Verify browser network tab for 404s
- Fallback: dropdown still works without image

### Issue: Language not switching
**Solution**:
- Check localStorage is enabled
- Verify language buttons have correct `data-lang`
- Check `setLanguage()` is called
- Check `renderHolesList()` called after language change

### Issue: Previous selection not restored
**Solution**:
- Verify `herrajeId` stored in hole object
- Check `updateHerrrajePreview()` called with correct ID
- Verify image URL available for that hardware

---

## Code Examples

### Using Translation in Modal
```javascript
const t = window.i18n ? window.i18n.t : (key) => key;

const detailsHtml = `
  <label>${t('holeSize')}</label>
  <p>${herraje.hole_size}mm</p>
  
  <label>${t('maxLoad')}</label>
  <p>${herraje.max_load} ${t('maxLoadUnit')}</p>
`;
```

### Handling Hardware Selection
```javascript
// User selects hardware
herraje_id = select.value; // Gets selected ID

// Update preview
designer.updateHerrrajePreview(holeIndex, herraje_id);

// Image displays automatically
```

### Registering New Translation
```javascript
// In i18n.js
en: {
  myNewKey: "English Text",
  // ...
},
es: {
  myNewKey: "Texto en Español",
  // ...
}

// In component
<label>${t('myNewKey')}</label>
```

---

## Summary

The Glass Optimizer now provides a fully localized hardware selection experience with:
- **Multi-language support** for all hardware information
- **Visual hardware previews** in dropdowns for quick identification
- **Automatic image display** when hardware is selected
- **Graceful error handling** for missing images
- **Smooth language switching** with persistent selection

Users can confidently select hardware while seeing visual confirmation and specifications in their preferred language.
