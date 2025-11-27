# Testing Checklist - Hardware Validation & BOM

## Pre-Deployment Testing

### Environment Setup
- [ ] Backend running (go run main.go or ./glass-optimizer)
- [ ] Database initialized with hardware data
- [ ] Frontend accessible at http://localhost:8080
- [ ] Browser console shows no errors
- [ ] All CSS/JS files loading properly

---

## Hardware Validation Testing

### Basic Validation
- [ ] Open designer and create a hole (6mm)
- [ ] Open hole properties panel
- [ ] Select hardware requiring 6mm
- [ ] Verify details modal appears
- [ ] Verify modal shows correct hardware specs

### Tolerance Testing (±1mm)
- [ ] Create hole with 10mm diameter
- [ ] Test hardware requiring:
  - [ ] 9mm (within tolerance) - should show details
  - [ ] 10mm (exact match) - should show details
  - [ ] 11mm (within tolerance) - should show details
  - [ ] 8mm (outside tolerance) - should show warning
  - [ ] 12mm (outside tolerance) - should show warning

### Warning Modal Testing
- [ ] Verify mismatch message displays correctly
- [ ] Verify difference calculation is accurate
- [ ] Test "Cancel" button - hardware not assigned
- [ ] Test "Assign Anyway" button:
  - [ ] Hardware is assigned to hole
  - [ ] Details modal appears after override
  - [ ] Hole properties update in sidebar

### Edge Cases
- [ ] Assign hardware to circle hole ✓
- [ ] Assign hardware to taladro hole ✓
- [ ] Assign hardware to avellanado hole ✓
- [ ] Assign hardware to rectangle hole ✓
- [ ] Assign hardware to clip hole ✓
- [ ] Clear hardware selection (select "-- Select Hardware --") ✓
- [ ] Change hardware multiple times on same hole ✓

---

## Hardware Details Modal Testing

### Display Testing
- [ ] Hardware code displays
- [ ] Hardware name displays
- [ ] Product image loads (if available)
- [ ] Description text displays correctly
- [ ] All specification fields present:
  - [ ] Hole Size
  - [ ] Category
  - [ ] Material
  - [ ] Max Load
  - [ ] Glass Thickness Range
  - [ ] Hole Pattern
  - [ ] Countersink (if applicable)
  - [ ] Installation type (if available)
  - [ ] Safety notes (if available)

### Modal Behavior
- [ ] Modal is centered on screen
- [ ] Modal has proper shadow
- [ ] Close button (×) functional
- [ ] Modal scrolls on small screens
- [ ] Modal doesn't overlap other elements
- [ ] Background is semi-transparent

### Responsive Testing
- [ ] Test on desktop (1920×1080)
- [ ] Test on tablet (1024×768)
- [ ] Test on mobile (375×667)
- [ ] Verify text is readable on all sizes
- [ ] Verify no horizontal scrolling
- [ ] Verify buttons accessible on mobile

---

## Bill of Materials Testing

### BOM Button
- [ ] BOM button visible in toolbar
- [ ] BOM button clickable
- [ ] BOM button labeled correctly
- [ ] Tooltip shows "Generate Bill of Materials"

### BOM Modal Display
- [ ] Modal displays with correct title
- [ ] Modal is scrollable
- [ ] Close button functional
- [ ] Export JSON button functional

### Glass Specifications Section
- [ ] Glass dimensions display correctly
- [ ] Area calculation accurate (mm² to m²)
- [ ] Thickness displays
- [ ] Glass type displays
- [ ] CPB status shows (yes/no)
- [ ] Painted areas show count and area

### Hardware Components Section
- [ ] Hardware table displays (if hardware assigned)
- [ ] Hardware code correct
- [ ] Hardware name correct
- [ ] Quantity calculated correctly:
  - [ ] Single hardware on one hole
  - [ ] Same hardware on multiple holes (quantity counts up)
  - [ ] Different hardware on different holes
- [ ] Material shows correctly
- [ ] Table has proper formatting

### Holes Summary Section
- [ ] Summary shows count by hole type
- [ ] Counts are accurate:
  - [ ] Circle holes
  - [ ] Drill holes (taladro)
  - [ ] Countersinks (avellanado)
  - [ ] Rectangle holes
  - [ ] Edge clips
- [ ] Only shows types that exist in design
- [ ] Visual cards display nicely

### Summary Section
- [ ] Total holes displayed correctly
- [ ] Total hardware items counted correctly
- [ ] Total area calculated accurately

### BOM without Hardware
- [ ] BOM displays without errors if no hardware assigned
- [ ] Hardware table hidden or shows "empty"
- [ ] Other sections display normally

### BOM with Multiple Hardware
- [ ] Multiple hardware items listed
- [ ] Quantities aggregate correctly
- [ ] All hardware details display

---

## JSON Export Testing

### Export Functionality
- [ ] "Export JSON" button downloads file
- [ ] File named correctly: `bom-[timestamp].json`
- [ ] File is valid JSON:
  ```bash
  cat bom-*.json | jq . # Should parse without errors
  ```

### JSON Structure
- [ ] Has "glass" object with correct fields
- [ ] Has "hardware" array with correct structure
- [ ] Has "holes" object with type arrays
- [ ] Has "summary" object
- [ ] All numeric values are correct type
- [ ] All string values are present

### Data Accuracy
- [ ] Glass specs match design
- [ ] Hardware list matches assigned hardware
- [ ] Hole types correct
- [ ] Quantities accurate
- [ ] No missing data

---

## Integration Testing

### With Existing Features
- [ ] Hardware selection doesn't break hole movement
- [ ] Hardware assignment doesn't interfere with hole editing
- [ ] BOM generation doesn't affect design
- [ ] Multiple hole assignments don't conflict
- [ ] Paint areas don't interfere with hardware

### With Herrajes Manager (Right Sidebar)
- [ ] Hardware catalog still functional
- [ ] Hardware search still works
- [ ] Hardware filter still works
- [ ] Hardware selected in catalog doesn't override hole assignment
- [ ] Clear all hardware button works

### With Hole Properties Panel
- [ ] Hole properties update correctly
- [ ] Hardware dropdown populated
- [ ] Hardware selection updates sidebar
- [ ] Selected hardware shows in hole item

---

## Error Handling Testing

### Network Errors
- [ ] Validation handles API failure gracefully
- [ ] Hardware details fail gracefully
- [ ] BOM generation continues if hardware fetch fails
- [ ] User gets helpful error messages

### Invalid Data
- [ ] Hole without diameter validates gracefully
- [ ] Hardware without specifications displays partial info
- [ ] Missing images don't break modal
- [ ] Missing descriptions don't break display

### Browser Issues
- [ ] Modals close on escape key (if implemented)
- [ ] Modals close on outside click (if implemented)
- [ ] No console errors on any action
- [ ] Memory usage reasonable for large designs

---

## Performance Testing

### Response Time
- [ ] Hardware validation < 500ms
- [ ] Details modal displays < 200ms
- [ ] BOM generation < 1s (for typical design)
- [ ] JSON export < 100ms

### Memory Usage
- [ ] No memory leaks on repeated actions
- [ ] Modals properly garbage collected after close
- [ ] Large designs don't cause slowdown

### Concurrent Operations
- [ ] Multiple modal opens/closes work
- [ ] Validation doesn't block UI
- [ ] BOM generation doesn't freeze interface

---

## Browser Compatibility

### Chrome/Chromium
- [ ] All features work
- [ ] Modals display correctly
- [ ] Export functionality works
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] Modal styling correct
- [ ] Export functionality works
- [ ] No console errors

### Safari
- [ ] All features work
- [ ] Modal z-index correct
- [ ] Fetch API works
- [ ] No console errors

### Edge
- [ ] All features work
- [ ] Modals display correctly
- [ ] No compatibility issues
- [ ] No console errors

### Mobile Browsers
- [ ] iOS Safari: All features work
- [ ] Chrome Mobile: All features work
- [ ] Touch events work properly
- [ ] Modals are touch-friendly

---

## Documentation Testing

- [ ] PENDING_TASKS_COMPLETED.md is accurate
- [ ] HARDWARE_VALIDATION_GUIDE.md is clear
- [ ] IMPLEMENTATION_SUMMARY_FINAL.md is complete
- [ ] QUICK_REFERENCE.md has correct method signatures
- [ ] All code examples in docs are correct
- [ ] All links in docs work

---

## User Acceptance Testing

### Typical Workflow
- [ ] User creates design
- [ ] User adds holes
- [ ] User assigns hardware
- [ ] User generates BOM
- [ ] User exports for fabrication

### Edge Case Workflows
- [ ] Reassign hardware on same hole
- [ ] Remove hardware from hole
- [ ] Add multiple holes with same hardware
- [ ] Edit hole size after hardware assignment

---

## Deployment Testing

- [ ] Build completes without errors
- [ ] JavaScript syntax valid
- [ ] No TypeErrors at runtime
- [ ] All API endpoints respond correctly
- [ ] Database queries work
- [ ] File exports save correctly

---

## Final Checklist

Before marking as complete:
- [ ] All tests in this document pass
- [ ] No critical bugs found
- [ ] No performance issues
- [ ] Documentation is complete
- [ ] Code follows style guide
- [ ] Git commits are clean
- [ ] Build is production-ready

---

## Test Sign-Off

**Testing Date**: _______________  
**Tested By**: _______________  
**Status**: ☐ Pass ☐ Conditional Pass ☐ Fail  

**Notes**:
```
[Space for tester notes]
```

**Known Issues** (if any):
```
[Space for known issues]
```

**Approved By**: _______________  
**Date**: _______________  

---

## Regression Testing (Before Each Release)

- [ ] Hardware validation still works
- [ ] Hardware details modal still displays
- [ ] BOM generation still functions
- [ ] No new console errors
- [ ] No new performance issues
- [ ] All existing tests still pass
