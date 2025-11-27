# Hardware Features Quick Guide

## Three Core Features Implemented

### 1. Hardware Image Preview 🖼️

**What it does:**
- Shows hardware product images in dropdown selections
- Displays 60px thumbnail below the hardware dropdown

**How to use:**
1. Open a hole's properties panel
2. Click the hardware dropdown
3. Select a hardware item
4. See the product image appear below the dropdown

**Technical:**
- Images stored in `picture_url` field
- Handled in `updateHerrrajePreview()` method
- Gracefully hides if image unavailable

---

### 2. Hardware Insertion Depth Validation 📏

**What it does:**
- Validates that hardware insertion depth matches glass thickness
- Prevents assigning hardware that's too deep for the glass
- Shows detailed warnings with specific measurements

**How it works:**
1. User selects hardware for a hole
2. System checks TWO things:
   - ✓ Does hole size match hardware requirements? (±1mm tolerance)
   - ✓ Does hardware insertion depth fit in glass thickness?
3. If both pass → Shows hardware details
4. If depth too deep → Shows warning modal

**Warning Modal Shows:**
- Hardware insertion depth requirement
- Current glass thickness  
- Recommendation to use thicker glass
- Option to assign anyway if needed

**Technical:**
- Insertion depth in `specs.insertion_depth` field
- Validated in `validateHardwareCompatibility()`
- Warning modal: `showHardwareDepthWarningModal()`

**Example:**
```
Hardware requires 2.5mm insertion depth
Current glass: 6mm ← OK ✓

Hardware requires 3.5mm insertion depth  
Current glass: 3mm ← NOT OK, shows warning ⚠️
```

---

### 3. Spanish Language Support 🇪🇸

**What it does:**
- All hardware labels translate to Spanish
- Hardware → Herrajes
- All specifications and messages translated

**How to use:**
1. Click Spanish language button (usually top of page)
2. All hardware UI updates automatically
3. Hardware dropdown now shows "Herrajes"
4. All warning messages in Spanish

**Translated Terms:**
| English | Spanish |
|---------|---------|
| Hardware | Herrajes |
| Hole Size | Tamaño del Taladro |
| Category | Categoría |
| Material | Material |
| Insertion Depth | Profundidad de Inserción |
| Max Load | Carga Máxima |
| Installation | Instalación |

**Technical:**
- Translations in `i18n.js`
- Default language: Spanish (es)
- Current language stored in localStorage
- Uses `t()` function for dynamic translation

---

## Hardware Properties Panel Workflow

```
1. User selects hole in canvas or holes list
   ↓
2. Properties panel opens for that hole
   ↓
3. Hardware dropdown available
   ↓
4. User selects hardware from dropdown
   ↓
5. VALIDATION
   ├─ Check hole size match ← (±1mm tolerance)
   └─ Check insertion depth ← (must fit in glass)
   ↓
6. RESULT
   ├─ If VALID → Show Hardware Details Modal
   │   ├─ Product image (if available)
   │   ├─ Specifications
   │   ├─ Insertion depth info
   │   └─ Safety notes
   │
   └─ If INVALID → Show Warning Modal
       ├─ Problem description
       ├─ Required vs actual measurements
       └─ Option: Assign Anyway or Cancel
```

---

## Hardware Details Modal

Shows when hardware is successfully selected:

**Contains:**
- Product image (60px height minimum)
- Code and name
- Full specifications:
  - Hole size
  - Category
  - Material
  - Finish
  - Max load
  - Glass thickness range
  - **Insertion depth** (if available)
  - Hole pattern
  - Number of positions
- Installation instructions
- Safety notes/warnings

**Language Support:**
- All labels automatically translate to current language
- Images remain the same across all languages

---

## Size Mismatch vs Depth Mismatch

### Size Mismatch Warning ⚠️
Appears when: Hole diameter ≠ Hardware hole size (beyond ±1mm)

**Example:**
- Hardware needs 6mm hole
- You have 8mm hole
- Difference: 2mm → WARNING

**Solution:**
- Resize hole to match (ideally)
- Drill to exact size during fabrication
- Or select different hardware

### Depth Mismatch Warning ⚠️⚠️
Appears when: Hardware insertion depth > glass thickness

**Example:**
- Hardware needs 3.5mm insertion depth
- Glass thickness: 3mm
- Hardware won't fit → CRITICAL WARNING

**Solution:**
- Use thicker glass (must be ≥3.5mm)
- Select different hardware with less insertion depth
- This is a hard constraint (hardware physically won't fit)

---

## For Developers

### Database Fields
```javascript
// In Herraje/hardware specs
{
  "insertion_depth": 2.5,  // mm into glass
  "min_distance": 50,      // mm from edge
  "recommended_distance": 75,
  "installation": "interior",
  "safety_notes": "...",
  // ... other fields
}
```

### Key Methods
```javascript
// Validate hardware compatibility
validateHardwareCompatibility(holeIndex, herrajeId)

// Populate hardware dropdowns
populateHerrajes()

// Update image preview
updateHerrrajePreview(holeIndex, herrajeId)

// Show details modal
showHardwareDetailsModal(herraje, hole)

// Show warnings
showHardwareWarningModal()      // Size mismatch
showHardwareDepthWarningModal() // Depth mismatch
```

### API Response
```json
{
  "herraje": {
    "id": 1,
    "code": "1214000",
    "name": "Spider Fitting",
    "hole_size": 6,
    "picture_url": "https://...",
    "specs": {
      "insertion_depth": 2.5,
      "safety_notes": "..."
    },
    "min_thickness": 6,
    "max_thickness": 9
  }
}
```

---

## Troubleshooting

### Image not showing?
- Check `picture_url` is valid URL
- Verify CORS settings for image hosting
- Image preview will hide if load fails

### Insertion depth warning not appearing?
- Verify `specs.insertion_depth` is set for hardware
- Check glass thickness value in glass properties
- Clear browser cache and reload

### Spanish labels not translating?
- Check language button is active for Spanish (es)
- Verify `i18n` is initialized (check console)
- Check localStorage for `vitrari-lang` value

---

## Testing Checklist

- [ ] Select hardware with picture_url → image appears
- [ ] Select hardware without picture → no preview shown
- [ ] Select hardware with matching hole size → details modal
- [ ] Select hardware with mismatched hole size → size warning
- [ ] Select hardware with insertion depth < glass thickness → details modal
- [ ] Select hardware with insertion depth > glass thickness → depth warning
- [ ] Switch to Spanish → Hardware → Herrajes translation works
- [ ] Switch to Spanish → All specs labels translate
- [ ] Click "Assign Anyway" on warning → hardware assigned despite warning
- [ ] Hardware details modal shows insertion depth (if available)

---

## User Tips

1. **Always check insertion depth** when selecting thin glass (3-5mm)
2. **Image preview helps identify** the correct hardware at a glance
3. **Use Spanish translation** if working with Spanish-speaking team
4. **"Assign Anyway" is for override** - use only if you know what you're doing
5. **Hardware specs can be found** in the details modal when selected

---

## Related Files

- `static/js/designer.js` - Main implementation
- `static/js/i18n.js` - Translations
- `internal/models/herraje.go` - Data model
- `COMPLETION_SUMMARY.md` - Detailed documentation
- `THREAD_COMPLETION_STATUS.md` - Implementation status
