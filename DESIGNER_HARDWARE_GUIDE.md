# Glass Designer - Hardware (Herrajes) Guide

## Quick Start

### Assigning Hardware to Holes

1. **Click on a hole** in the left properties panel to select it
2. **Scroll to the bottom** of the hole's properties
3. **Click the "Hardware (Herraje)"** dropdown
4. **Select hardware** from the list
5. **Green checkmark badge** appears on the hole to confirm assignment

## Available Hardware Types

### Spiders (Arañas) - Connection points for glass
- **Araña 1214 (4 patas)** - Interior installations, 6-9mm glass
- **Araña Querétaro (2 patas)** - Exterior installations, 10-19mm glass, up to 150kg

### Connectors & Supports (Soportes y Rótulas)
- **Soporte con rótula 1203** - Ball joint support, 10-19mm glass, 200kg load
- **Soporte con rótula avellanada 120305BSA** - Countersink ball joint support
- **Soporte estándar 1203ESTSA** - Standard bracket support

Each hardware component shows:
- Name/Model number
- Material variant (e.g., "AISI 316" stainless steel)
- Compatibility information

## Understanding Hardware Properties

### What Information Is Stored

When you assign hardware to a hole, the system records:
- Hardware ID (unique identifier)
- Hardware code (e.g., "1214000")
- Compatibility requirements
- Material specifications

### How Hardware Affects Design

Hardware determines:
- **Hole diameter requirements** - Each hardware expects specific hole sizes
- **Minimum/maximum glass thickness** - Hardware compatibility with your glass
- **Load capacity** - Maximum weight the hardware can support
- **Countersink specifications** - Some hardware requires countersunk holes

## Hole Types & Compatible Hardware

### Circle Holes (Large circular openings)
- Use for: Main connection points
- Compatible with: Spiders, connectors, supports
- Typical diameter: 8-14mm (varies by hardware)

### Taladro Holes (Drill holes - small)
- Use for: Fastening points, secondary connections
- Compatible with: Any hardware requiring small holes
- Typical diameter: 6mm

### Avellanado Holes (Countersink holes - recessed)
- Use for: Flush-mount hardware, ball joints
- Compatible with: Countersink-capable hardware
- Specifications: Inner diameter + outer diameter

### Rectangle Holes (Large rectangular openings)
- Use for: Cable passages, ventilation, large components
- Compatible with: Specialized hardware
- Flexible sizing: Custom width and height

### Edge Clips (Notches cut into glass edge)
- Use for: Edge mounted hardware
- Compatible with: Edge-mounted connectors
- Positioned: Along any edge of the glass

## Visual Indicators

### Green Checkmark Badge
- **Position**: Top-right corner of the hole
- **Meaning**: Hardware has been assigned to this hole
- **Color**: Green (#10b981)
- **Visibility**: Appears on canvas and in printed designs

### Example
```
     [Green badge with checkmark]
        ↓
    ○────── Hole with hardware assigned
```

## Workflow Example

### Scenario: Installing exterior glass with spiders

1. **Create main holes for spiders**
   - Use: Circle holes (4 total)
   - Diameter: 10mm each
   - Position: Near corners of glass

2. **Assign hardware**
   - Select each hole
   - Assign: "Araña Querétaro (2 patas)"
   - Confirm: See green badges appear

3. **Add support brackets**
   - Create avellanado holes (2 total)
   - Use: Avellanado shape
   - Outer diameter: 13mm, Inner: 10mm
   - Assign: "Soporte estándar 1203ESTSA"

4. **Verify design**
   - Check all holes have green badges
   - Confirm glass thickness: 10-19mm
   - Review: Compatibility notes in documentation

5. **Export design**
   - Hardware assignments are included
   - PDF shows which hardware for each hole
   - BOM (Bill of Materials) reflects selections

## Common Tasks

### Changing Hardware Assignment
1. Click the hole in the properties panel
2. Open the Hardware dropdown
3. Select a different hardware
4. Badge updates automatically

### Removing Hardware Assignment
1. Click the hole's Hardware dropdown
2. Select "-- Select Hardware --"
3. Badge disappears from the hole

### Finding Compatible Hardware
1. Note your glass specifications (thickness, size)
2. Open any hole's Hardware dropdown
3. Look for hardware matching your glass thickness range
4. Check the hardware documentation for full specs

### Reviewing All Assignments
1. Look at the left properties panel
2. Scan all hole items
3. Green badges indicate assigned hardware
4. Holes without badges have no hardware assigned

## Hardware Properties Reference

### Glass Thickness Ranges
- Interior (Araña 1214): 6-9mm
- Standard connectors: 10-19mm
- Heavy-duty supports: 10-24mm

### Load Capacities
- Araña 1214: Not specified for interior use
- Araña Querétaro: 150kg total, 75kg per hole
- Connectors (1203): 200kg total, 100kg per hole

### Hole Specifications
- Standard hole: 8-10mm diameter
- Countersink hole: 10mm hole + 13mm sink
- Edge clip: Variable based on notch size

## Best Practices

### Design Tips
1. **Match glass thickness to hardware**
   - Glass 6-9mm → Use interior hardware (Araña 1214)
   - Glass 10-19mm → Use exterior hardware (Querétaro, connectors)

2. **Plan hole positioning**
   - Keep holes away from edges (minimum 50mm recommended)
   - Space evenly for balanced load distribution
   - Account for hardware offset in final positioning

3. **Use consistent hardware**
   - Consistent materials reduce corrosion issues
   - Group similar hardware for cost efficiency
   - Match finishes for aesthetic consistency

4. **Verify compatibility**
   - Check hardware code against specification sheets
   - Ensure all holes have appropriate hardware
   - Review load requirements before finalizing

### Quality Checks
- [ ] All main holes have hardware assigned (green badges visible)
- [ ] Hardware matches glass thickness
- [ ] Load capacity is sufficient for your application
- [ ] Holes are properly spaced (minimum 50mm from edges)
- [ ] All hole diameters match hardware requirements

## Troubleshooting

### Hardware dropdown is empty
- **Issue**: API failed to load herrajes
- **Solution**: 
  - Check internet connection
  - Refresh the page
  - Check browser console for errors

### Can't find expected hardware
- **Issue**: Hardware not in the catalog
- **Solution**:
  - Check hardware code spelling
  - Verify it's active in the system
  - Contact administrator to add new hardware

### Green badge doesn't appear
- **Issue**: Hardware not saved properly
- **Solution**:
  - Re-select hardware from dropdown
  - Save the design to confirm
  - Check browser console for JavaScript errors

### Wrong hardware assigned
- **Issue**: Assigned wrong hardware to a hole
- **Solution**:
  - Click hole to select it
  - Open Hardware dropdown
  - Select correct hardware
  - Confirm green badge updates

## Data Persistence

### Saving with Hardware
When you save a design:
1. All hole positions are saved
2. All hole dimensions are saved
3. **Hardware assignments are saved**
4. Design can be reopened with assignments intact

### Loading a Saved Design
When you load a previous design:
1. All holes are restored
2. All dimensions are restored
3. **All hardware assignments are restored**
4. Green badges appear for previously assigned hardware

## Integration with Manufacturing

### For Production Teams
- Hardware assignments guide hole drilling
- Each hole shows required hardware in design
- Compatibility information prevents errors
- Load specifications ensure safety

### For Installers
- Hardware assignments indicate connection method
- Installation sequence can follow hardware requirements
- All necessary hardware identified before on-site work

## API Information (For Developers)

### Hardware Load Endpoint
```
GET /api/herrajes?limit=100
```

### Response Format
```json
{
  "herrajes": [
    {
      "id": 1,
      "code": "1214000",
      "nombre": "Araña 1214 (4 patas)",
      "hole_size": 8,
      "min_thickness": 6,
      "max_thickness": 9,
      "material": "Acero inoxidable AISI 316",
      ...
    }
  ],
  "total": 8
}
```

### Design Save Format
When saving, hardware assignments are included:
```json
{
  "elements": {
    "holes": [
      {
        "id": "hole-123",
        "herrajes_herraje_id": 3,
        "center": {"x": 100, "y": 200},
        "radius": 5,
        ...
      }
    ]
  }
}
```

## Support

### Getting Help
1. Check this guide for common tasks
2. Review hardware documentation in the system
3. Contact your system administrator
4. Check browser console (F12) for error messages

### Reporting Issues
- Note the step where the issue occurs
- Check what hardware you were trying to assign
- Include browser type and version
- Provide screenshot if possible
