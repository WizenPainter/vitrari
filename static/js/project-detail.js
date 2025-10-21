/**
 * Glass Optimizer - Project Detail Page
 * Displays project details, subprojects, designs, and optimizations
 */

class ProjectDetailManager {
    constructor() {
        this.projectId = null;
        this.project = null;
        this.subprojects = [];
        this.designs = [];
        this.optimizations = [];
        this.currentTab = 'subprojects';

        this.init();
    }

    init() {
        // Get project ID from URL
        const pathParts = window.location.pathname.split('/');
        this.projectId = pathParts[pathParts.length - 1];

        if (!this.projectId || isNaN(this.projectId)) {
            this.showError('Invalid project ID');
            return;
        }

        this.setupEventListeners();
        this.loadProject();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.project-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Action buttons
        document.getElementById('btn-edit-project')?.addEventListener('click', () => {
            window.location.href = `/?edit=${this.projectId}`;
        });

        document.getElementById('btn-add-subproject')?.addEventListener('click', () => {
            window.location.href = `/?subproject=${this.projectId}`;
        });

        document.getElementById('btn-add-design-to-project')?.addEventListener('click', () => {
            window.location.href = `/?add-design=${this.projectId}`;
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.project-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update content sections
        document.querySelectorAll('.project-content-section').forEach(section => {
            section.classList.toggle('active', section.id === `section-${tabName}`);
        });
    }

    async loadProject() {
        try {
            const response = await fetch(`/api/projects/${this.projectId}`);
            if (!response.ok) {
                throw new Error('Project not found');
            }

            const data = await response.json();
            this.project = data.project;

            this.renderProjectHeader();
            this.buildBreadcrumb();

            await Promise.all([
                this.loadSubprojects(),
                this.loadDesigns(),
                this.loadOptimizations()
            ]);
        } catch (error) {
            console.error('Failed to load project:', error);
            this.showError('Failed to load project details');
        }
    }

    async loadSubprojects() {
        try {
            // Get children from the project data
            this.subprojects = this.project.children || [];
            this.renderSubprojects();
        } catch (error) {
            console.error('Failed to load subprojects:', error);
            document.getElementById('subprojects-list').innerHTML =
                '<div class="error-message">Failed to load subprojects</div>';
        }
    }

    async loadDesigns() {
        try {
            const response = await fetch(`/api/projects/${this.projectId}/designs`);
            if (!response.ok) {
                throw new Error('Failed to load designs');
            }

            const data = await response.json();
            this.designs = data.designs || [];
            this.renderDesigns();
        } catch (error) {
            console.error('Failed to load designs:', error);
            document.getElementById('designs-list').innerHTML =
                '<div class="error-message">Failed to load designs</div>';
        }
    }

    async loadOptimizations() {
        try {
            const response = await fetch(`/api/projects/${this.projectId}/optimizations`);
            if (!response.ok) {
                throw new Error('Failed to load optimizations');
            }

            const data = await response.json();
            this.optimizations = data.optimizations || [];
            this.renderOptimizations();
        } catch (error) {
            console.error('Failed to load optimizations:', error);
            document.getElementById('optimizations-list').innerHTML =
                '<div class="error-message">Failed to load optimizations</div>';
        }
    }

    renderProjectHeader() {
        document.getElementById('project-name').textContent = this.project.name;

        const descElement = document.getElementById('project-description');
        if (this.project.description) {
            descElement.textContent = this.project.description;
            descElement.style.display = 'block';
        } else {
            descElement.style.display = 'none';
        }
    }

    buildBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        const path = this.project.path || '/';
        const parts = path.split('/').filter(p => p);

        let html = '<a href="/">Dashboard</a>';

        // Build path from project hierarchy
        if (parts.length > 0) {
            html += '<span class="breadcrumb-separator">/</span>';
            html += `<span class="breadcrumb-current">${this.escapeHtml(this.project.name)}</span>`;
        }

        breadcrumb.innerHTML = html;
    }

    renderSubprojects() {
        const container = document.getElementById('subprojects-list');

        if (this.subprojects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No subprojects yet</p>
                    <button class="btn btn-primary" onclick="window.location.href='/?subproject=${this.projectId}'">
                        Create Subproject
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.subprojects.map(sub => `
            <div class="content-card" onclick="window.location.href='/projects/${sub.id}'">
                <div class="content-card-header">
                    <h4>${this.escapeHtml(sub.name)}</h4>
                </div>
                ${sub.description ? `<p class="content-card-description">${this.escapeHtml(sub.description)}</p>` : ''}
                <div class="content-card-meta">
                    <span>Designs: ${sub.design_count || 0}</span>
                    <span>Optimizations: ${sub.optimization_count || 0}</span>
                </div>
            </div>
        `).join('');
    }

    renderDesigns() {
        const container = document.getElementById('designs-list');

        if (this.designs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No designs in this project</p>
                    <button class="btn btn-primary" onclick="window.location.href='/designer'">
                        Create Design
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.designs.map(design => `
            <div class="content-card">
                <div class="content-card-header">
                    <h4>${this.escapeHtml(design.name || 'Unnamed Design')}</h4>
                </div>
                <div class="content-card-meta">
                    <span>${design.width}mm × ${design.height}mm</span>
                    <span>Thickness: ${design.thickness}mm</span>
                </div>
                <div class="content-card-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.location.href='/designer?design=${design.id}'">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-outline btn-danger" onclick="projectDetailManager.deleteDesign(${design.id})">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    async deleteDesign(designId) {
        if (!confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/designs/${designId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete design');
            }

            // Reload designs after successful deletion
            await this.loadDesigns();
            toast.success('Design deleted successfully');
        } catch (error) {
            console.error('Failed to delete design:', error);
            toast.error('Failed to delete design');
        }
    }

    renderOptimizations() {
        const container = document.getElementById('optimizations-list');

        if (this.optimizations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No optimizations in this project</p>
                    <button class="btn btn-primary" onclick="window.location.href='/optimizer'">
                        Create Optimization
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.optimizations.map(opt => `
            <div class="content-card">
                <div class="content-card-header">
                    <h4>${this.escapeHtml(opt.name)}</h4>
                </div>
                <div class="content-card-meta">
                    <span>Waste: ${opt.waste_percentage.toFixed(1)}%</span>
                    <span>Used: ${opt.used_area.toFixed(1)}m²</span>
                </div>
                <div class="content-card-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.location.href='/optimizer?opt=${opt.id}'">
                        View
                    </button>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        toast.error(message);
    }
}

// Initialize when page loads
let projectDetailManager;
document.addEventListener('DOMContentLoaded', () => {
    projectDetailManager = new ProjectDetailManager();
});
