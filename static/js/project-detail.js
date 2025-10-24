/**
 * Vitrari - Project Detail Page
 * Displays project details, subprojects, designs, and optimizations
 */

class ProjectDetailManager {
  constructor() {
    this.projectId = null;
    this.project = null;
    this.subprojects = [];
    this.designs = [];
    this.optimizations = [];
    this.currentTab = "subprojects";

    this.init();
  }

  init() {
    // Get project ID from URL
    const pathParts = window.location.pathname.split("/");
    this.projectId = pathParts[pathParts.length - 1];

    if (!this.projectId || isNaN(this.projectId)) {
      this.showError("Invalid project ID");
      return;
    }

    this.setupEventListeners();
    this.loadProject();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".project-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Action buttons
    document
      .getElementById("btn-edit-project")
      ?.addEventListener("click", () => {
        window.location.href = `/?edit=${this.projectId}`;
      });

    const subprojectBtn = document.getElementById("btn-add-subproject");
    if (subprojectBtn) {
      // Remove any existing onclick attribute
      subprojectBtn.removeAttribute("onclick");
      // Clear any existing event listeners
      subprojectBtn.replaceWith(subprojectBtn.cloneNode(true));
      // Get the new element and add our event listener
      const newSubprojectBtn = document.getElementById("btn-add-subproject");
      newSubprojectBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.openSubprojectModal();
      });
    }

    document
      .getElementById("btn-add-design-to-project")
      ?.addEventListener("click", () => {
        window.location.href = `/?add-design=${this.projectId}`;
      });

    // Subproject modal event listeners
    document
      .getElementById("subproject-modal-close")
      ?.addEventListener("click", () => {
        this.closeSubprojectModal();
      });

    document
      .getElementById("btn-cancel-subproject")
      ?.addEventListener("click", () => {
        this.closeSubprojectModal();
      });

    document
      .getElementById("subproject-form")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        this.createSubproject();
      });

    // Close modal when clicking outside
    document
      .getElementById("subproject-modal")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "subproject-modal") {
          this.closeSubprojectModal();
        }
      });

    // Move design modal event listeners
    document
      .getElementById("move-design-modal-close")
      ?.addEventListener("click", () => {
        this.closeMoveDesignModal();
      });

    document
      .getElementById("btn-cancel-move-design")
      ?.addEventListener("click", () => {
        this.closeMoveDesignModal();
      });

    document
      .getElementById("btn-confirm-move-design")
      ?.addEventListener("click", () => {
        this.confirmMoveDesign();
      });

    // Close modal when clicking outside
    document
      .getElementById("move-design-modal")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "move-design-modal") {
          this.closeMoveDesignModal();
        }
      });
  }

  switchTab(tabName) {
    this.currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll(".project-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    // Update content sections
    document.querySelectorAll(".project-content-section").forEach((section) => {
      section.classList.toggle("active", section.id === `section-${tabName}`);
    });
  }

  async loadProject() {
    try {
      const response = await fetch(`/api/projects/${this.projectId}`);
      if (!response.ok) {
        throw new Error("Project not found");
      }

      const data = await response.json();
      this.project = data.project;

      this.renderProjectHeader();
      await this.buildBreadcrumb();

      await Promise.all([
        this.loadSubprojects(),
        this.loadDesigns(),
        this.loadOptimizations(),
      ]);
    } catch (error) {
      console.error("Failed to load project:", error);
      this.showError("Failed to load project details");
    }
  }

  async loadSubprojects() {
    try {
      // Get children from the project data
      this.subprojects = this.project.children || [];
      this.renderSubprojects();
    } catch (error) {
      console.error("Failed to load subprojects:", error);
      document.getElementById("subprojects-list").innerHTML =
        '<div class="error-message">Failed to load subprojects</div>';
    }
  }

  async loadDesigns() {
    try {
      const response = await fetch(`/api/projects/${this.projectId}/designs`);
      if (!response.ok) {
        throw new Error("Failed to load designs");
      }

      const data = await response.json();
      this.designs = data.designs || [];
      this.renderDesigns();
    } catch (error) {
      console.error("Failed to load designs:", error);
      document.getElementById("designs-list").innerHTML =
        '<div class="error-message">Failed to load designs</div>';
    }
  }

  async loadOptimizations() {
    try {
      const response = await fetch(
        `/api/projects/${this.projectId}/optimizations`,
      );
      if (!response.ok) {
        throw new Error("Failed to load optimizations");
      }

      const data = await response.json();
      this.optimizations = data.optimizations || [];
      this.renderOptimizations();
    } catch (error) {
      console.error("Failed to load optimizations:", error);
      document.getElementById("optimizations-list").innerHTML =
        '<div class="error-message">Failed to load optimizations</div>';
    }
  }

  renderProjectHeader() {
    document.getElementById("project-name").textContent = this.project.name;

    const descElement = document.getElementById("project-description");
    if (this.project.description) {
      descElement.textContent = this.project.description;
      descElement.style.display = "block";
    } else {
      descElement.style.display = "none";
    }

    // Add back button if this is a subproject
    this.renderBackButton();
  }

  renderBackButton() {
    const actionsDiv = document.querySelector(".project-detail-actions");

    // Remove existing back button if any
    const existingBackBtn = actionsDiv.querySelector(".btn-back");
    if (existingBackBtn) {
      existingBackBtn.remove();
    }

    // Add back button if this project has a parent
    if (this.project.parent_id) {
      const backButton = document.createElement("button");
      backButton.className = "btn btn-outline btn-back";
      backButton.innerHTML = "← Back to Parent";
      backButton.onclick = () => {
        window.location.href = `/projects/${this.project.parent_id}`;
      };

      // Insert as first button
      actionsDiv.insertBefore(backButton, actionsDiv.firstChild);
    }
  }

  async buildBreadcrumb() {
    const breadcrumb = document.getElementById("breadcrumb");
    let html = '<a href="/">Dashboard</a>';

    try {
      // Build breadcrumb from project hierarchy
      const hierarchy = await this.getProjectHierarchy(this.project);

      for (let i = 0; i < hierarchy.length; i++) {
        const project = hierarchy[i];
        html += '<span class="breadcrumb-separator">/</span>';

        if (i === hierarchy.length - 1) {
          // Current project (not clickable)
          html += `<span class="breadcrumb-current">${this.escapeHtml(project.name)}</span>`;
        } else {
          // Parent projects (clickable)
          html += `<a href="/projects/${project.id}" class="breadcrumb-link">${this.escapeHtml(project.name)}</a>`;
        }
      }
    } catch (error) {
      console.error("Failed to build breadcrumb:", error);
      // Fallback to simple breadcrumb
      html += '<span class="breadcrumb-separator">/</span>';
      html += `<span class="breadcrumb-current">${this.escapeHtml(this.project.name)}</span>`;
    }

    breadcrumb.innerHTML = html;
  }

  async getProjectHierarchy(project) {
    const hierarchy = [];
    let current = project;

    // Build hierarchy from current project up to root
    while (current) {
      hierarchy.unshift(current); // Add to beginning of array

      if (current.parent_id) {
        try {
          const response = await fetch(`/api/projects/${current.parent_id}`);
          if (response.ok) {
            const data = await response.json();
            current = data.project;
          } else {
            break;
          }
        } catch (error) {
          console.error("Failed to fetch parent project:", error);
          break;
        }
      } else {
        break;
      }
    }

    return hierarchy;
  }

  renderSubprojects() {
    const container = document.getElementById("subprojects-list");

    if (this.subprojects.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <p>No subprojects yet</p>
                    <button class="btn btn-primary" onclick="projectDetailManager.openSubprojectModal()">
                        Create Subproject
                    </button>
                </div>
            `;
      return;
    }

    container.innerHTML = this.subprojects
      .map(
        (sub) => `
            <div class="content-card" onclick="window.location.href='/projects/${sub.id}'">
                <div class="content-card-header">
                    <h4>${this.escapeHtml(sub.name)}</h4>
                </div>
                ${sub.description ? `<p class="content-card-description">${this.escapeHtml(sub.description)}</p>` : ""}
                <div class="content-card-meta">
                    <span>Designs: ${sub.design_count || 0}</span>
                    <span>Optimizations: ${sub.optimization_count || 0}</span>
                </div>
            </div>
        `,
      )
      .join("");
  }

  renderDesigns() {
    const container = document.getElementById("designs-list");

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

    container.innerHTML = this.designs
      .map(
        (design) => `
            <div class="content-card">
                <div class="content-card-header">
                    <h4>${this.escapeHtml(design.name || "Unnamed Design")}</h4>
                </div>
                <div class="content-card-meta">
                    <span>${design.width}mm × ${design.height}mm</span>
                    <span>Thickness: ${design.thickness}mm</span>
                </div>
                <div class="content-card-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.location.href='/designer?design=${design.id}'">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="projectDetailManager.openMoveDesignModal(${design.id}, '${this.escapeHtml(design.name || "Unnamed Design")}')">
                        Move
                    </button>
                    <button class="btn btn-sm btn-outline btn-danger" onclick="projectDetailManager.deleteDesign(${design.id})">
                        Delete
                    </button>
                </div>
            </div>
        `,
      )
      .join("");
  }

  async deleteDesign(designId) {
    if (
      !confirm(
        "Are you sure you want to delete this design? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/designs/${designId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete design");
      }

      // Reload designs after successful deletion
      await this.loadDesigns();
      toast.success("Design deleted successfully");
    } catch (error) {
      console.error("Failed to delete design:", error);
      toast.error("Failed to delete design");
    }
  }

  renderOptimizations() {
    const container = document.getElementById("optimizations-list");

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

    container.innerHTML = this.optimizations
      .map(
        (opt) => `
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
        `,
      )
      .join("");
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  openSubprojectModal() {
    const modal = document.getElementById("subproject-modal");
    if (!modal) {
      console.error("Subproject modal not found!");
      return;
    }

    document.getElementById("subproject-parent-id").value = this.projectId;
    document.getElementById("subproject-name").value = "";
    document.getElementById("subproject-description").value = "";
    this.showModal("subproject-modal");
  }

  closeSubprojectModal() {
    document.getElementById("subproject-modal")?.classList.remove("active");
  }

  async createSubproject() {
    const name = document.getElementById("subproject-name").value.trim();
    const description = document
      .getElementById("subproject-description")
      .value.trim();

    if (!name) {
      toast.error("Subproject name is required");
      return;
    }

    const projectData = {
      name,
      description,
      parent_id: parseInt(this.projectId),
      designs_list: [],
    };

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create subproject");
      }

      toast.success("Subproject created successfully");
      this.closeSubprojectModal();

      // Reload the project to update the subprojects list
      await this.loadProject();
    } catch (error) {
      console.error("Failed to create subproject:", error);
      toast.error(error.message || "Failed to create subproject");
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
    } else {
      console.error("Modal not found:", modalId);
    }
  }

  openMoveDesignModal(designId, designName) {
    this.selectedDesignId = designId;
    this.selectedProjectId = null;

    document.getElementById("design-name-to-move").textContent = designName;
    document.getElementById("btn-confirm-move-design").disabled = true;

    this.loadProjectsForMove();
    this.showModal("move-design-modal");
  }

  closeMoveDesignModal() {
    document.getElementById("move-design-modal")?.classList.remove("active");
    this.selectedDesignId = null;
    this.selectedProjectId = null;
  }

  async loadProjectsForMove() {
    const container = document.getElementById("project-tree-container");

    try {
      const response = await fetch("/api/projects?tree=true");
      const data = await response.json();
      const projects = data.projects || [];

      if (projects.length === 0) {
        container.innerHTML =
          '<div class="empty-message">No other projects available</div>';
        return;
      }

      container.innerHTML = this.renderProjectTree(projects);

      // Add click handlers to selectable items
      container.querySelectorAll(".project-item.selectable").forEach((item) => {
        item.addEventListener("click", () => {
          const projectId = parseInt(item.dataset.projectId);
          this.selectProjectForMove(projectId);
        });
      });
    } catch (error) {
      console.error("Failed to load projects:", error);
      container.innerHTML =
        '<div class="error-message">Failed to load projects</div>';
    }
  }

  renderProjectTree(projects, depth = 0) {
    return projects
      .map((project) => {
        const isCurrentProject = project.id === parseInt(this.projectId);
        const indent = depth > 0 ? `style="margin-left: ${depth * 20}px;"` : "";

        let html = `
        <div class="project-tree-item" ${indent}>
          <div class="project-item ${isCurrentProject ? "disabled" : "selectable"}" data-project-id="${project.id}">
            <span class="project-name">${this.escapeHtml(project.name)}</span>
            ${isCurrentProject ? '<span class="current-project-label">(current)</span>' : ""}
          </div>
        </div>
      `;

        // Add children if they exist
        if (project.children && project.children.length > 0) {
          html += this.renderProjectTree(project.children, depth + 1);
        }

        return html;
      })
      .join("");
  }

  selectProjectForMove(projectId) {
    // Remove previous selection
    document.querySelectorAll(".project-item.selected").forEach((item) => {
      item.classList.remove("selected");
    });

    // Add selection to clicked item
    const clickedElement = document.querySelector(
      `[data-project-id="${projectId}"]`,
    );
    if (clickedElement) {
      clickedElement.classList.add("selected");
    }

    this.selectedProjectId = projectId;
    document.getElementById("btn-confirm-move-design").disabled = false;
  }

  async confirmMoveDesign() {
    if (!this.selectedDesignId || !this.selectedProjectId) {
      toast.error("Please select a destination project");
      return;
    }

    try {
      const response = await fetch(
        `/api/designs/${this.selectedDesignId}/move`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id: this.selectedProjectId,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to move design");
      }

      toast.success("Design moved successfully");
      this.closeMoveDesignModal();

      // Reload designs to update the current project's design list
      await this.loadDesigns();
    } catch (error) {
      console.error("Failed to move design:", error);
      toast.error(error.message || "Failed to move design");
    }
  }

  showError(message) {
    toast.error(message);
  }
}

// Initialize when page loads
let projectDetailManager;
document.addEventListener("DOMContentLoaded", () => {
  projectDetailManager = new ProjectDetailManager();
});
