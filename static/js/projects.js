/**
 * Glass Optimizer - Projects Management
 * Handles project creation, editing, deletion, and hierarchical display
 */

class ProjectManager {
    constructor() {
        this.projects = [];
        this.designs = [];
        this.currentProject = null;
        this.currentDesigns = []; // Designs added to current project
        this.parentIdForNew = null; // Track parent ID when creating subproject

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProjects();
        this.loadDesigns();
    }

    setupEventListeners() {
        // New Project button
        document.getElementById('btn-new-project')?.addEventListener('click', () => {
            this.openProjectModal();
        });

        // Modal close buttons
        document.getElementById('modal-close')?.addEventListener('click', () => {
            this.closeProjectModal();
        });

        document.getElementById('design-picker-close')?.addEventListener('click', () => {
            this.closeDesignPicker();
        });

        // Cancel button
        document.getElementById('btn-cancel')?.addEventListener('click', () => {
            this.closeProjectModal();
        });

        // Add Design button
        document.getElementById('btn-add-design')?.addEventListener('click', () => {
            this.openDesignPicker();
        });

        // Form submit
        document.getElementById('project-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProject();
        });

        // Close modal when clicking outside
        document.getElementById('project-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'project-modal') {
                this.closeProjectModal();
            }
        });

        document.getElementById('design-picker-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'design-picker-modal') {
                this.closeDesignPicker();
            }
        });
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/projects?tree=true');
            const data = await response.json();
            this.projects = data.projects || [];
            this.renderProjectsTree();
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.showError('Failed to load projects');
        }
    }

    async loadDesigns() {
        try {
            const response = await fetch('/api/designs');
            const data = await response.json();
            this.designs = data.designs || [];
        } catch (error) {
            console.error('Failed to load designs:', error);
        }
    }

    renderProjectsTree() {
        const container = document.getElementById('projects-tree');

        if (!this.projects || this.projects.length === 0) {
            container.innerHTML = `
                <div class="no-projects">
                    <p>No projects yet. Click "New Project" to create your first project.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.projects.map(project =>
            this.renderProjectNode(project)
        ).join('');
    }

    renderProjectNode(project, depth = 0) {
        const hasChildren = project.children && project.children.length > 0;
        const indent = depth > 0 ? 'project-children' : '';

        return `
            <div class="project-node ${indent}">
                <div class="project-item" onclick="projectManager.openProject(${project.id}, event)">
                    <div class="project-header">
                        <div class="project-title">
                            ${this.escapeHtml(project.name)}
                        </div>
                        <div class="project-actions">
                            <button class="project-btn" onclick="event.stopPropagation(); projectManager.openSubprojectModal(${project.id})">
                                + Subproject
                            </button>
                            <button class="project-btn" onclick="event.stopPropagation(); projectManager.editProject(${project.id})">
                                Edit
                            </button>
                            <button class="project-btn delete" onclick="event.stopPropagation(); projectManager.deleteProject(${project.id})">
                                Delete
                            </button>
                        </div>
                    </div>
                    ${project.description ? `<div class="project-description">${this.escapeHtml(project.description)}</div>` : ''}
                    <div class="project-meta">
                        <div class="project-meta-item">
                            <strong>Designs:</strong> ${project.design_count || 0}
                        </div>
                        <div class="project-meta-item">
                            <strong>Optimizations:</strong> ${project.optimization_count || 0}
                        </div>
                        <div class="project-meta-item">
                            <strong>Created:</strong> ${this.formatDate(project.created_at)}
                        </div>
                    </div>
                </div>
                ${hasChildren ? project.children.map(child =>
                    this.renderProjectNode(child, depth + 1)
                ).join('') : ''}
            </div>
        `;
    }

    openProject(projectId, event) {
        // Navigate to project detail page
        window.location.href = `/projects/${projectId}`;
    }

    openProjectModal(parentId = null) {
        this.currentProject = null;
        this.currentDesigns = [];
        this.parentIdForNew = parentId;

        document.getElementById('modal-title').textContent = parentId
            ? 'New Subproject'
            : 'New Project';
        document.getElementById('project-id').value = '';
        document.getElementById('project-parent-id').value = parentId || '';
        document.getElementById('project-name').value = '';
        document.getElementById('project-description').value = '';

        this.renderDesignsList();
        this.showModal('project-modal');
    }

    openSubprojectModal(parentId) {
        this.openProjectModal(parentId);
    }

    async editProject(projectId) {
        try {
            const response = await fetch(`/api/projects/${projectId}`);
            const data = await response.json();
            this.currentProject = data.project;
            this.currentDesigns = data.project.designs_list || [];

            document.getElementById('modal-title').textContent = 'Edit Project';
            document.getElementById('project-id').value = projectId;
            document.getElementById('project-parent-id').value = data.project.parent_id || '';
            document.getElementById('project-name').value = data.project.name;
            document.getElementById('project-description').value = data.project.description || '';

            this.renderDesignsList();
            this.showModal('project-modal');
        } catch (error) {
            console.error('Failed to load project:', error);
            this.showError('Failed to load project');
        }
    }

    async deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete project');
            }

            toast.success('Project deleted successfully');
            this.loadProjects();
        } catch (error) {
            console.error('Failed to delete project:', error);
            toast.error('Failed to delete project');
        }
    }

    async saveProject() {
        const projectId = document.getElementById('project-id').value;
        const parentId = document.getElementById('project-parent-id').value;
        const name = document.getElementById('project-name').value.trim();
        const description = document.getElementById('project-description').value.trim();

        if (!name) {
            this.showError('Project name is required');
            return;
        }

        // Projects can be empty (like directories) - no design requirement

        const projectData = {
            name,
            description,
            designs_list: this.currentDesigns
        };

        if (parentId) {
            projectData.parent_id = parseInt(parentId);
        }

        try {
            const url = projectId ? `/api/projects/${projectId}` : '/api/projects';
            const method = projectId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Failed to save project');
            }

            toast.success(projectId ? 'Project updated successfully' : 'Project created successfully');
            this.closeProjectModal();
            this.loadProjects();
        } catch (error) {
            console.error('Failed to save project:', error);
            toast.error(error.message || 'Failed to save project');
        }
    }

    openDesignPicker() {
        const pickerList = document.getElementById('design-picker-list');

        if (this.designs.length === 0) {
            pickerList.innerHTML = `
                <div class="picker-loading">
                    No designs available. Create a design first using the Designer tool.
                </div>
            `;
        } else {
            pickerList.innerHTML = this.designs.map(design => `
                <div class="picker-item" onclick="projectManager.selectDesign(${design.id})">
                    <div class="picker-item-name">${this.escapeHtml(design.name || 'Unnamed Design')}</div>
                    <div class="picker-item-meta">
                        ${design.width}mm × ${design.height}mm × ${design.thickness}mm
                    </div>
                </div>
            `).join('');
        }

        this.showModal('design-picker-modal');
    }

    selectDesign(designId) {
        // Check if design already added
        if (this.currentDesigns.some(d => d.design_id === designId)) {
            toast.warning('Design already added to project');
            return;
        }

        const design = this.designs.find(d => d.id === designId);
        if (!design) {
            toast.error('Design not found');
            return;
        }

        this.currentDesigns.push({
            design_id: designId,
            design: design,
            quantity: 1,
            priority: 0,
            notes: '',
            unit_cost: 0,
            total_cost: 0,
            is_completed: false
        });

        this.renderDesignsList();
        this.closeDesignPicker();
    }

    removeDesign(index) {
        this.currentDesigns.splice(index, 1);
        this.renderDesignsList();
    }

    updateDesignQuantity(index, quantity) {
        const qty = parseInt(quantity);
        if (qty > 0) {
            this.currentDesigns[index].quantity = qty;
        }
    }

    renderDesignsList() {
        const container = document.getElementById('designs-list-container');

        if (this.currentDesigns.length === 0) {
            container.innerHTML = `
                <div class="designs-placeholder">
                    No designs added yet. Click "Add Design" to include designs in this project.
                </div>
            `;
            return;
        }

        container.innerHTML = this.currentDesigns.map((item, index) => {
            const design = item.design || {};
            return `
                <div class="design-list-item">
                    <div class="design-list-item-info">
                        <div class="design-list-item-name">
                            ${this.escapeHtml(design.name || 'Unnamed Design')}
                        </div>
                        <div class="design-list-item-meta">
                            ${design.width}mm × ${design.height}mm × ${design.thickness}mm
                        </div>
                    </div>
                    <div class="design-list-item-actions">
                        <div class="design-list-item-quantity">
                            <label>Qty:</label>
                            <input
                                type="number"
                                min="1"
                                value="${item.quantity}"
                                onchange="projectManager.updateDesignQuantity(${index}, this.value)"
                            >
                        </div>
                        <button
                            type="button"
                            class="btn-remove"
                            onclick="projectManager.removeDesign(${index})"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    showModal(modalId) {
        document.getElementById(modalId)?.classList.add('active');
    }

    closeProjectModal() {
        document.getElementById('project-modal')?.classList.remove('active');
        this.currentProject = null;
        this.currentDesigns = [];
        this.parentIdForNew = null;
    }

    closeDesignPicker() {
        document.getElementById('design-picker-modal')?.classList.remove('active');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    showError(message) {
        toast.error(message);
    }
}

// Initialize project manager when DOM is ready
let projectManager;
document.addEventListener('DOMContentLoaded', () => {
    projectManager = new ProjectManager();
});
