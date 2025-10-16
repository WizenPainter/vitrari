# Glass Optimizer API Examples

This document provides practical examples of how to use the Glass Optimizer API for various workflows.

## Base URL

All API endpoints are relative to: `http://localhost:8080/api`

## Authentication

Currently no authentication required. Future versions may implement API keys or OAuth.

## Common Headers

```
Content-Type: application/json
Accept: application/json
```

## 1. Design Management Examples

### Create a Simple Window Design

```bash
curl -X POST http://localhost:8080/api/designs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard Office Window",
    "description": "1200x800mm office window pane",
    "width": 1200,
    "height": 800,
    "thickness": 6,
    "elements": {
      "shapes": [
        {
          "id": "main-shape",
          "type": "rectangle",
          "points": [
            {"x": 0, "y": 0},
            {"x": 1200, "y": 0},
            {"x": 1200, "y": 800},
            {"x": 0, "y": 800}
          ],
          "style": {
            "stroke_color": "#000000",
            "stroke_width": 2.0,
            "fill_color": "#E3F2FD",
            "fill_opacity": 0.8
          },
          "visible": true,
          "locked": false
        }
      ],
      "holes": [],
      "cuts": [],
      "notes": [
        {
          "id": "dimension-note",
          "type": "dimension",
          "position": {"x": 600, "y": -50},
          "text": "1200mm",
          "value": 1200,
          "unit": "mm",
          "visible": true
        }
      ]
    }
  }'
```

### Create a Glass Shelf with Mounting Holes

```bash
curl -X POST http://localhost:8080/api/designs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Glass Shelf with Mounting Holes",
    "description": "800x200mm shelf with 6mm mounting holes",
    "width": 800,
    "height": 200,
    "thickness": 8,
    "elements": {
      "shapes": [
        {
          "id": "shelf-shape",
          "type": "rectangle",
          "points": [
            {"x": 0, "y": 0},
            {"x": 800, "y": 0},
            {"x": 800, "y": 200},
            {"x": 0, "y": 200}
          ],
          "style": {
            "stroke_color": "#000000",
            "stroke_width": 1.0,
            "fill_color": "#F5F5F5",
            "fill_opacity": 0.9
          },
          "visible": true
        }
      ],
      "holes": [
        {
          "id": "hole-left",
          "type": "circular",
          "center": {"x": 50, "y": 100},
          "radius": 3,
          "tolerance": 0.2,
          "style": {
            "stroke_color": "#FF5722",
            "stroke_width": 1.0,
            "fill_color": "#FFFFFF"
          },
          "visible": true
        },
        {
          "id": "hole-right",
          "type": "circular",
          "center": {"x": 750, "y": 100},
          "radius": 3,
          "tolerance": 0.2,
          "style": {
            "stroke_color": "#FF5722",
            "stroke_width": 1.0,
            "fill_color": "#FFFFFF"
          },
          "visible": true
        }
      ],
      "cuts": [],
      "notes": [
        {
          "id": "hole-spec",
          "type": "text",
          "position": {"x": 400, "y": 50},
          "text": "⌀6mm mounting holes",
          "visible": true
        }
      ]
    }
  }'
```

### Get All Designs with Pagination

```bash
# Get first 10 designs
curl "http://localhost:8080/api/designs?limit=10&offset=0"

# Search for designs containing "window"
curl "http://localhost:8080/api/designs?search=window&limit=10"
```

### Validate a Design

```bash
curl -X POST http://localhost:8080/api/designs/1/validate
```

Response example:
```json
{
  "validation": {
    "is_valid": true,
    "errors": [],
    "warnings": [
      "Width exceeds 3000mm - may be difficult to manufacture"
    ]
  },
  "design_id": 1
}
```

### Clone a Design

```bash
curl -X POST http://localhost:8080/api/designs/1/clone \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Window - Modified"
  }'
```

## 2. Glass Sheet Management

### Create a Glass Sheet Type

```bash
curl -X POST http://localhost:8080/api/sheets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Tempered Glass 6mm",
    "width": 3000,
    "height": 2000,
    "thickness": 6,
    "price_per_sqm": 85.50,
    "in_stock": 25,
    "material": "tempered",
    "supplier": "Premium Glass Corp",
    "grade": "A+",
    "specs": {
      "tempered": true,
      "laminated": false,
      "low_e": false,
      "tinted": false,
      "weight_per_sqm": 15.0,
      "max_dimension": 3000,
      "min_thickness": 4,
      "max_thickness": 19,
      "edge_work": ["polished", "beveled", "tempered"],
      "drilling": true,
      "max_hole_size": 150,
      "min_hole_distance": 50,
      "lead_time": 5,
      "notes": "High-strength safety glass"
    }
  }'
```

### Get Sheet Information

```bash
curl http://localhost:8080/api/sheets/1
```

Response example:
```json
{
  "sheet": {
    "id": 1,
    "name": "Premium Tempered Glass 6mm",
    "width": 3000,
    "height": 2000,
    "thickness": 6,
    "price_per_sqm": 85.50,
    "in_stock": 25,
    "material": "tempered",
    "supplier": "Premium Glass Corp",
    "grade": "A+",
    "specs": {
      "tempered": true,
      "weight_per_sqm": 15.0,
      "drilling": true,
      "max_hole_size": 150
    },
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## 3. Optimization Examples

### Run Basic Optimization

```bash
curl -X POST http://localhost:8080/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Windows Optimization",
    "sheet_id": 1,
    "algorithm": "blf",
    "designs": [
      {
        "design_id": 1,
        "quantity": 4,
        "priority": 1
      },
      {
        "design_id": 2,
        "quantity": 2,
        "priority": 2
      }
    ],
    "options": {
      "allow_rotation": true,
      "allow_flipping": false,
      "minimum_gap": 3.0,
      "edge_margin": 10.0,
      "time_limit": 300
    }
  }'
```

### Run Advanced Genetic Algorithm Optimization

```bash
curl -X POST http://localhost:8080/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Complex Layout Optimization",
    "sheet_id": 1,
    "algorithm": "genetic",
    "designs": [
      {"design_id": 1, "quantity": 6, "priority": 1},
      {"design_id": 2, "quantity": 4, "priority": 1},
      {"design_id": 3, "quantity": 2, "priority": 2}
    ],
    "options": {
      "allow_rotation": true,
      "allow_flipping": true,
      "minimum_gap": 2.0,
      "edge_margin": 5.0,
      "max_iterations": 1000,
      "population_size": 50,
      "mutation_rate": 0.1,
      "crossover_rate": 0.8,
      "time_limit": 600,
      "quality_target": 0.85
    }
  }'
```

Response example:
```json
{
  "optimization": {
    "id": 1,
    "name": "Office Windows Optimization",
    "sheet_id": 1,
    "algorithm": "blf",
    "waste_percentage": 15.2,
    "total_area": 6000000,
    "used_area": 5088000,
    "execution_time": 2.341,
    "layout": {
      "sheet_width": 3000,
      "sheet_height": 2000,
      "pieces": [
        {
          "id": "piece-001",
          "design_id": 1,
          "design_name": "Office Window",
          "x": 10,
          "y": 10,
          "width": 1200,
          "height": 800,
          "rotation": 0
        }
      ],
      "statistics": {
        "total_pieces": 6,
        "placed_pieces": 5,
        "unplaced_pieces": 1,
        "utilization_rate": 84.8,
        "waste_rate": 15.2,
        "cutting_length": 12400,
        "cutting_time": 62.5
      }
    },
    "created_at": "2024-01-15T14:25:00Z"
  }
}
```

### Get Optimization Results

```bash
curl http://localhost:8080/api/optimizations/1
```

### Export Optimization Results

```bash
# Export as SVG
curl "http://localhost:8080/api/optimizations/1/export?format=svg" \
  -H "Accept: image/svg+xml" \
  -o optimization_layout.svg

# Export as cutting list
curl "http://localhost:8080/api/optimizations/1/export?format=cutting_list" \
  -H "Accept: text/plain" \
  -o cutting_instructions.txt

# Export as JSON
curl "http://localhost:8080/api/optimizations/1/export?format=json" \
  -o optimization_data.json
```

### Compare Multiple Optimizations

```bash
curl -X POST http://localhost:8080/api/optimizations/compare \
  -H "Content-Type: application/json" \
  -d '{
    "optimization_ids": [1, 2, 3]
  }'
```

Response example:
```json
{
  "optimizations": [
    {
      "id": 1,
      "name": "BLF Optimization",
      "algorithm": "blf",
      "utilization_rate": 82.5,
      "execution_time": 2.1
    },
    {
      "id": 2,
      "name": "Genetic Optimization",
      "algorithm": "genetic",
      "utilization_rate": 89.3,
      "execution_time": 45.2
    }
  ],
  "best_by_utilization": {
    "id": 2,
    "name": "Genetic Optimization",
    "rate": 89.3
  },
  "fastest_algorithm": {
    "id": 1,
    "name": "BLF Optimization",
    "execution_time": 2.1
  }
}
```

## 4. Project Management

### Create a Project

```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Renovation Project",
    "description": "Glass panels and windows for 5th floor renovation",
    "designs_list": [
      {
        "design_id": 1,
        "quantity": 8,
        "priority": 1,
        "unit_cost": 125.00,
        "notes": "Standard office windows"
      },
      {
        "design_id": 2,
        "quantity": 4,
        "priority": 2,
        "unit_cost": 85.00,
        "notes": "Glass shelving"
      },
      {
        "design_id": 3,
        "quantity": 2,
        "priority": 1,
        "unit_cost": 350.00,
        "notes": "Conference room panels"
      }
    ]
  }'
```

### Get Project Details

```bash
curl http://localhost:8080/api/projects/1
```

Response example:
```json
{
  "project": {
    "id": 1,
    "name": "Office Renovation Project",
    "description": "Glass panels and windows for 5th floor renovation",
    "designs_list": [
      {
        "design_id": 1,
        "quantity": 8,
        "priority": 1,
        "unit_cost": 125.00,
        "total_cost": 1000.00,
        "is_completed": false
      }
    ],
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-15T09:00:00Z"
  }
}
```

## 5. Template Usage

### Get Available Templates

```bash
curl http://localhost:8080/api/designs/templates
```

Response example:
```json
{
  "templates": [
    {
      "name": "Standard Window",
      "description": "Basic rectangular window pane",
      "width": 1200,
      "height": 800,
      "thickness": 6,
      "category": "windows"
    },
    {
      "name": "Door Panel",
      "description": "Standard door glass panel",
      "width": 600,
      "height": 1800,
      "thickness": 10,
      "category": "doors"
    }
  ]
}
```

### Create Design from Template

```bash
curl -X POST http://localhost:8080/api/designs/templates/Standard%20Window/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conference Room Window",
    "description": "Large window for conference room"
  }'
```

## 6. Error Handling Examples

### Validation Error Response

```json
{
  "error": "Validation failed",
  "code": "INVALID_VALUE",
  "details": [
    {
      "field": "width",
      "message": "width must be greater than 0",
      "value": "0"
    },
    {
      "field": "name",
      "message": "name is required"
    }
  ]
}
```

### Not Found Error Response

```json
{
  "error": "design not found",
  "code": "DESIGN_NOT_FOUND"
}
```

### Optimization Error Response

```json
{
  "error": "Optimization failed",
  "code": "OPTIMIZATION_FAILED",
  "details": "Insufficient space on sheet for all pieces"
}
```

## 7. Batch Operations

### Create Multiple Designs

```bash
# Create design 1
curl -X POST http://localhost:8080/api/designs \
  -H "Content-Type: application/json" \
  -d '{"name": "Window A", "width": 1200, "height": 800, "thickness": 6, "elements": {"shapes":[],"holes":[],"cuts":[],"notes":[]}}'

# Create design 2  
curl -X POST http://localhost:8080/api/designs \
  -H "Content-Type: application/json" \
  -d '{"name": "Window B", "width": 1000, "height": 600, "thickness": 6, "elements": {"shapes":[],"holes":[],"cuts":[],"notes":[]}}'
```

### Bulk Optimization Workflow

```bash
# 1. Create glass sheet
SHEET_RESPONSE=$(curl -s -X POST http://localhost:8080/api/sheets \
  -H "Content-Type: application/json" \
  -d '{"name": "Standard Sheet", "width": 3000, "height": 2000, "thickness": 6, "price_per_sqm": 45.50, "in_stock": 10}')

SHEET_ID=$(echo $SHEET_RESPONSE | jq -r '.sheet.id')

# 2. Run optimization with multiple algorithms
curl -X POST http://localhost:8080/api/optimize \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"BLF Test\",
    \"sheet_id\": $SHEET_ID,
    \"algorithm\": \"blf\",
    \"designs\": [{\"design_id\": 1, \"quantity\": 3, \"priority\": 1}]
  }"

curl -X POST http://localhost:8080/api/optimize \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Genetic Test\",
    \"sheet_id\": $SHEET_ID,
    \"algorithm\": \"genetic\",
    \"designs\": [{\"design_id\": 1, \"quantity\": 3, \"priority\": 1}]
  }"
```

## 8. Health Check and Monitoring

### Application Health

```bash
curl http://localhost:8080/api/health
```

Response example:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T15:30:00Z",
  "version": "1.0.0",
  "database": "connected"
}
```

## 9. JavaScript/Frontend Integration Examples

### Fetch Designs with JavaScript

```javascript
async function fetchDesigns(page = 0, limit = 10) {
  try {
    const response = await fetch(
      `http://localhost:8080/api/designs?limit=${limit}&offset=${page * limit}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch designs:', error);
    throw error;
  }
}
```

### Create Design with JavaScript

```javascript
async function createDesign(designData) {
  try {
    const response = await fetch('http://localhost:8080/api/designs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(designData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to create design:', error);
    throw error;
  }
}
```

### Run Optimization with Progress Tracking

```javascript
async function runOptimization(optimizationRequest) {
  try {
    const response = await fetch('http://localhost:8080/api/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(optimizationRequest)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error);
    }
    
    // Poll for completion if needed
    return result.optimization;
  } catch (error) {
    console.error('Optimization failed:', error);
    throw error;
  }
}
```

## 10. Testing the API

### Basic Workflow Test

```bash
#!/bin/bash
set -e

echo "=== Glass Optimizer API Test ==="

# Test health check
echo "1. Testing health check..."
curl -f http://localhost:8080/api/health

# Create a design
echo "2. Creating a design..."
DESIGN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/designs \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Window", "width": 1200, "height": 800, "thickness": 6, "elements": {"shapes":[], "holes":[], "cuts":[], "notes":[]}}')

DESIGN_ID=$(echo $DESIGN_RESPONSE | jq -r '.design.id')
echo "Created design with ID: $DESIGN_ID"

# Create a glass sheet
echo "3. Creating a glass sheet..."
SHEET_RESPONSE=$(curl -s -X POST http://localhost:8080/api/sheets \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Sheet", "width": 3000, "height": 2000, "thickness": 6, "price_per_sqm": 50.0, "in_stock": 5}')

SHEET_ID=$(echo $SHEET_RESPONSE | jq -r '.sheet.id')
echo "Created sheet with ID: $SHEET_ID"

# Run optimization
echo "4. Running optimization..."
OPT_RESPONSE=$(curl -s -X POST http://localhost:8080/api/optimize \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test Optimization\", \"sheet_id\": $SHEET_ID, \"algorithm\": \"blf\", \"designs\": [{\"design_id\": $DESIGN_ID, \"quantity\": 2, \"priority\": 1}]}")

OPT_ID=$(echo $OPT_RESPONSE | jq -r '.optimization.id')
echo "Created optimization with ID: $OPT_ID"

# Get optimization results
echo "5. Getting optimization results..."
curl -s http://localhost:8080/api/optimizations/$OPT_ID | jq '.optimization.layout.statistics'

echo "=== All tests passed! ==="
```

This comprehensive guide provides examples for all major API functionality, making it easy to integrate the Glass Optimizer backend into any frontend application or use it programmatically.