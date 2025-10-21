# Project Management Feature - Implementation Guide

## Overview
I've implemented the foundation for a hierarchical project management system that allows users to organize designs and optimizations into projects and subprojects (like directories and subdirectories).

## What's Been Completed

### 1. Database Schema ✅
**File**: `internal/storage/schema.sql`

- **Projects Table**: Now supports hierarchical structure with:
  - `parent_id`: References parent project (NULL for root projects)
  - `path`: Hierarchical path like `/project1/subproject1`
  - Indexes for efficient querying

- **Designs Table**: Added `project_id` to link designs to projects

- **Optimizations Table**: Added `project_id` to link optimizations to projects

### 2. Database Initialization ✅
**File**: `internal/storage/init.go`

- Automatic database setup with embedded SQL schema
- Foreign key constraints enabled
- Cascade deletes for maintaining data integrity

### 3. Updated Models ✅

**Project Model** (`internal/models/project.go`):
- Added `ParentID`, `Path`, `Children` fields
- Added `DesignCount` and `OptCount` for tracking
- Helper methods:
  - `IsRoot()`: Check if root project
  - `GetDepth()`: Get hierarchy depth
  - `GetParentPath()`: Get parent's path
  - `BuildPath()`: Construct hierarchical paths

**Design Model** (`internal/models/design.go`):
- Added `ProjectID` field to link to projects

**Optimization Model** (`internal/models/glass.go`):
- Added `ProjectID` field to link to projects

## What Needs To Be Done

### 1. Update Storage Layer
Update `internal/storage/sqlite.go` to:
- Add hierarchical project methods (`GetProjectTree`, `GetSubprojects`, etc.)
- Update CreateDesign/CreateOptimization to accept project_id
- Add methods to get designs/optimizations by project

### 2. Create Project Handlers
Create `internal/handlers/projects.go` with endpoints:
```go
POST   /api/projects              - Create project
GET    /api/projects              - List all projects (tree structure)
GET    /api/projects/:id          - Get project details
PUT    /api/projects/:id          - Update project
DELETE /api/projects/:id          - Delete project
GET    /api/projects/:id/designs  - Get designs in project
GET    /api/projects/:id/optimizations - Get optimizations in project
POST   /api/projects/:id/subprojects - Create subproject
```

### 3. Create UI Components

**Projects Management Page** (`templates/projects.html`):
```html
- Tree view of projects and subprojects
- Breadcrumb navigation
- New project/subproject buttons
- Drag-and-drop to move items between projects
- Context menu for rename/delete
```

**Project Selector Component** (for designer and optimizer):
```javascript
// Dropdown to select project when saving
<select id="project-selector">
  <option value="">No Project</option>
  <option value="1">Project 1</option>
  <option value="2">  └─ Subproject 1</option>
  <option value="3">Project 2</option>
</select>
```

### 4. Update Main Application
Update `main.go` to:
- Initialize database with new schema
- Add project routes
- Update existing routes to support project filtering

## Example Usage

### Creating a Project Hierarchy
```javascript
// Create root project
POST /api/projects
{
  "name": "Office Renovation",
  "description": "All glass work for office",
  "parent_id": null
}

// Create subproject
POST /api/projects
{
  "name": "Meeting Rooms",
  "description": "Glass partitions for meeting rooms",
  "parent_id": 1
}
```

### Saving a Design to a Project
```javascript
POST /api/designs
{
  "name": "Conference Room Glass",
  "width": 2000,
  "height": 1500,
  "thickness": 10,
  "project_id": 2,  // Save to "Meeting Rooms" subproject
  "elements": {...}
}
```

### Getting Project Tree
```javascript
GET /api/projects?tree=true

Response:
{
  "projects": [
    {
      "id": 1,
      "name": "Office Renovation",
      "path": "/Office Renovation",
      "design_count": 5,
      "optimization_count": 2,
      "children": [
        {
          "id": 2,
          "name": "Meeting Rooms",
          "path": "/Office Renovation/Meeting Rooms",
          "design_count": 3,
          "optimization_count": 1,
          "children": []
        }
      ]
    }
  ]
}
```

## Integration Points

### Designer Page
When saving a design, add project selector:
```javascript
designer.saveDesign = function() {
  const projectId = document.getElementById('project-selector').value;
  const designData = {
    ...this.getDesignData(),
    project_id: projectId || null
  };

  // Save to backend
  fetch('/api/designs', {
    method: 'POST',
    body: JSON.stringify(designData)
  });
}
```

### Dashboard
Show projects in tree view with stats:
```html
<div class="projects-tree">
  <div class="project-node">
    <span class="project-name">Office Renovation</span>
    <span class="project-stats">5 designs, 2 optimizations</span>
    <div class="project-children">
      <div class="project-node">
        <span class="project-name">Meeting Rooms</span>
        <span class="project-stats">3 designs, 1 optimization</span>
      </div>
    </div>
  </div>
</div>
```

## Database Migrations

If you have existing data, you'll need to run migrations:
```sql
-- Add columns to existing tables
ALTER TABLE designs ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE optimizations ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_designs_project_id ON designs(project_id);
CREATE INDEX idx_optimizations_project_id ON optimizations(project_id);
```

## Next Steps

1. **Initialize the database** with the new schema
2. **Implement storage methods** for hierarchical queries
3. **Create project handlers** with full CRUD operations
4. **Build the UI** for project management
5. **Update designer/optimizer** to include project selection
6. **Test the complete flow** end-to-end

## Notes

- Projects use **cascading deletes**: Deleting a project deletes all its subprojects
- Designs and optimizations use **SET NULL**: Deleting a project doesn't delete the items, just unlinks them
- The `path` field enables efficient hierarchical queries
- Support unlimited nesting depth

This foundation provides a solid base for organizing your glass designs and optimizations in a professional, scalable way!
