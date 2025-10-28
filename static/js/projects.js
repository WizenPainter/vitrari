/**
 * Vitrari - Projects Management
 * Handles project creation, editing, and organization
 */

// Utility function to wait for DOM element to be available
function waitForElement(id, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.getElementById(id);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.getElementById(id);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element #${id} not found within ${timeout}ms`));
    }, timeout);
  });
}

class ProjectManager {
  constructor() {
    this.projects = [];
    this.designs = [];
    this.currentProject = null;
    this.currentDesigns = []; // Designs added to current project
    this.parentIdForNew = null; // Track parent ID when creating subproject

    this.init();
  }

  async init() {
    this.setupEventListeners();

    // Check if projects-tree element exists on this page
    const projectsTreeExists =
      document.getElementById("projects-tree") !== null;

    if (projectsTreeExists) {
      // Wait for DOM elements to be ready before loading data
      try {
        await waitForElement("projects-tree");
        this.loadProjects();
        this.loadDesigns();
      } catch (error) {
        console.error("DOM element not ready:", error);
        // Fallback to setTimeout approach
        setTimeout(() => {
          this.loadProjects();
          this.loadDesigns();
        }, 100);
      }
    } else {
      console.log(
        "projects-tree element not found - skipping project data loading on this page",
      );
    }

    this.handleUrlParameters();
    this.setupDocumentClickHandler();
    this.setupLanguageChangeListener();
  }

  setupEventListeners() {
    // New Project button
    document
      .getElementById("btn-new-project")
      ?.addEventListener("click", () => {
        this.openProjectModal();
      });

    // Modal close buttons
    document.getElementById("modal-close")?.addEventListener("click", () => {
      this.closeProjectModal();
    });

    document
      .getElementById("design-picker-close")
      ?.addEventListener("click", () => {
        this.closeDesignPicker();
      });

    // Cancel button
    document.getElementById("btn-cancel")?.addEventListener("click", () => {
      this.closeProjectModal();
    });

    // Add Design button
    document.getElementById("btn-add-design")?.addEventListener("click", () => {
      this.openDesignPicker();
    });

    // Form submit
    document.getElementById("project-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveProject();
    });

    // Close modal when clicking outside
    document.getElementById("project-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "project-modal") {
        this.closeProjectModal();
      }
    });

    document
      .getElementById("design-picker-modal")
      ?.addEventListener("click", (e) => {
        if (e.target.id === "design-picker-modal") {
          this.closeDesignPicker();
        }
      });
  }

  setupLanguageChangeListener() {
    // Listen for language button clicks to re-render content
    document.addEventListener("DOMContentLoaded", () => {
      const langButtons = document.querySelectorAll(".lang-btn");
      langButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          // Re-render projects tree after language change
          setTimeout(() => {
            this.renderProjectsTree();
            // Update modal content if open
            if (
              document
                .getElementById("project-modal")
                ?.classList.contains("active")
            ) {
              if (window.i18n) {
                window.i18n.updatePageLanguage();
              }
            }
          }, 100);
        });
      });
    });
  }

  async loadProjects() {
    try {
      const response = await fetch("/api/projects?tree=true");
      const data = await response.json();
      this.projects = data.projects || [];
      await this.renderProjectsTree();
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error(
        window.i18n
          ? window.i18n.t("failedToLoadProjects")
          : "Failed to load projects",
      );
    }
  }

  async loadDesigns() {
    try {
      const response = await fetch("/api/designs");
      const data = await response.json();
      this.designs = data.designs || [];
    } catch (error) {
      console.error("Failed to load designs:", error);
    }
  }

  async renderProjectsTree() {
    let container = document.getElementById("projects-tree");

    // If the container doesn't exist, this page doesn't need the projects tree
    if (!container) {
      console.log(
        "projects-tree element not found - skipping tree render on this page",
      );
      return;
    }

    if (!this.projects || this.projects.length === 0) {
      container.innerHTML = `
                <div class="no-projects">
                    <p data-i18n="noProjectsYet">No projects yet. Click "New Project" to create your first project.</p>
                </div>
            `;
      // Update translations for the newly added content
      if (window.i18n) {
        window.i18n.updatePageLanguage();
      }
      return;
    }

    container.innerHTML = this.projects
      .map((project) => this.renderProjectNode(project))
      .join("");

    // Update translations for the newly rendered content
    if (window.i18n) {
      window.i18n.updatePageLanguage();
    }
  }

  renderProjectNode(project, depth = 0) {
    const hasChildren = project.children && project.children.length > 0;
    const indent = depth > 0 ? "project-children" : "";

    return `
            <div class="project-node ${indent}">
                <div class="project-item" onclick="projectManager.openProject(${project.id}, event)">
                    <div class="project-header">
                        <div class="project-title">
                            ${this.escapeHtml(project.name)}
                        </div>
                        <div class="project-actions">
                            <div class="project-dropdown">
                                <button class="project-menu-btn" onclick="event.stopPropagation(); projectManager.toggleProjectMenu(${project.id})" aria-label="Project options">
                                    <span class="menu-dots">⋯</span>
                                </button>
                                <div class="project-menu" id="project-menu-${project.id}">
                                    <button class="menu-item" onclick="event.stopPropagation(); projectManager.openSubprojectModal(${project.id}); projectManager.closeAllMenus();">
                                        <span>+ Subproject</span>
                                    </button>
                                    <button class="menu-item" onclick="event.stopPropagation(); projectManager.editProject(${project.id}); projectManager.closeAllMenus();">
                                        <span data-i18n="edit">Edit</span>
                                    </button>
                                    <button class="menu-item delete" onclick="event.stopPropagation(); projectManager.deleteProject(${project.id}); projectManager.closeAllMenus();">
                                        <span data-i18n="delete">Delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${project.description ? `<div class="project-description">${this.escapeHtml(project.description)}</div>` : ""}
                    <div class="project-meta">
                        <div class="project-meta-item">
                            <strong data-i18n="designs">Designs:</strong> ${project.design_count || 0}
                        </div>
                        <div class="project-meta-item">
                            <strong data-i18n="optimizations">Optimizations:</strong> ${project.optimization_count || 0}
                        </div>
                        <div class="project-meta-item">
                            <strong data-i18n="created">Created:</strong> ${this.formatDate(project.created_at)}
                        </div>
                    </div>
                </div>
                ${
                  hasChildren
                    ? project.children
                        .map((child) =>
                          this.renderProjectNode(child, depth + 1),
                        )
                        .join("")
                    : ""
                }
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

    document.getElementById("modal-title").textContent = parentId
      ? window.i18n
        ? window.i18n.t("newSubproject")
        : "New Subproject"
      : window.i18n
        ? window.i18n.t("newProject")
        : "New Project";
    document.getElementById("project-id").value = "";
    document.getElementById("project-parent-id").value = parentId || "";
    document.getElementById("project-name").value = "";
    document.getElementById("project-description").value = "";

    this.renderDesignsList();
    this.showModal("project-modal");
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

      document.getElementById("modal-title").textContent = window.i18n
        ? window.i18n.t("editProject")
        : "Edit Project";
      document.getElementById("project-id").value = projectId;
      document.getElementById("project-parent-id").value =
        data.project.parent_id || "";
      document.getElementById("project-name").value = data.project.name;
      document.getElementById("project-description").value =
        data.project.description || "";

      this.renderDesignsList();
      this.showModal("project-modal");
    } catch (error) {
      console.error("Failed to load project:", error);
      toast.error(
        window.i18n
          ? window.i18n.t("failedToLoadProject")
          : "Failed to load project",
      );
    }
  }

  async deleteProject(projectId) {
    if (
      !confirm(
        window.i18n
          ? window.i18n.t("confirmDeleteProject")
          : "Are you sure you want to delete this project? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      toast.success(
        window.i18n
          ? window.i18n.t("projectDeletedSuccess")
          : "Project deleted successfully",
      );
      this.loadProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error(
        window.i18n
          ? window.i18n.t("failedToDeleteProject")
          : "Failed to delete project",
      );
    }
  }

  async saveProject() {
    const projectId = document.getElementById("project-id").value;
    const parentId = document.getElementById("project-parent-id").value;
    const name = document.getElementById("project-name").value.trim();
    const description = document
      .getElementById("project-description")
      .value.trim();

    if (!name) {
      toast.error(
        window.i18n
          ? window.i18n.t("projectNameRequired")
          : "Project name is required",
      );
      return;
    }

    // Projects can be empty (like directories) - no design requirement

    const projectData = {
      name,
      description,
      designs_list: this.currentDesigns,
    };

    if (parentId) {
      projectData.parent_id = parseInt(parentId);
    }

    try {
      const url = projectId ? `/api/projects/${projectId}` : "/api/projects";
      const method = projectId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to save project");
      }

      toast.success(
        projectId
          ? window.i18n
            ? window.i18n.t("projectUpdatedSuccess")
            : "Project updated successfully"
          : window.i18n
            ? window.i18n.t("projectCreatedSuccess")
            : "Project created successfully",
      );
      this.closeProjectModal();
      this.loadProjects();
    } catch (error) {
      console.error("Failed to save project:", error);
      toast.error(
        error.message ||
          (window.i18n
            ? window.i18n.t("failedToSaveProject")
            : "Failed to save project"),
      );
    }
  }

  openDesignPicker() {
    const pickerList = document.getElementById("design-picker-list");

    if (this.designs.length === 0) {
      pickerList.innerHTML = `
                <div class="picker-loading" data-i18n="noDesignsAvailable">
                    No designs available. Create a design first using the Designer tool.
                </div>
            `;
      // Update translations for the newly added content
      if (window.i18n) {
        window.i18n.updatePageLanguage();
      }
    } else {
      pickerList.innerHTML = this.designs
        .map(
          (design) => `
                <div class="picker-item" onclick="projectManager.selectDesign(${design.id})">
                    <div class="picker-item-name">${this.escapeHtml(design.name || "Unnamed Design")}</div>
                    <div class="picker-item-meta">
                        ${design.width}mm × ${design.height}mm × ${design.thickness}mm
                    </div>
                </div>
            `,
        )
        .join("");
    }

    this.showModal("design-picker-modal");
  }

  selectDesign(designId) {
    // Check if design already added
    if (this.currentDesigns.some((d) => d.design_id === designId)) {
      toast.warning("Design already added to project");
      return;
    }

    const design = this.designs.find((d) => d.id === designId);
    if (!design) {
      toast.error(
        window.i18n ? window.i18n.t("designNotFound") : "Design not found",
      );
      return;
    }

    this.currentDesigns.push({
      design_id: designId,
      design: design,
      quantity: 1,
      priority: 0,
      notes: "",
      unit_cost: 0,
      total_cost: 0,
      is_completed: false,
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
    const container = document.getElementById("designs-list-container");

    if (this.currentDesigns.length === 0) {
      container.innerHTML = `
                <div class="designs-placeholder">
                    No designs added yet. Click "Add Design" to include designs in this project.
                </div>
            `;
      return;
    }

    container.innerHTML = this.currentDesigns
      .map((item, index) => {
        const design = item.design || {};
        return `
                <div class="design-list-item">
                    <div class="design-list-item-info">
                        <div class="design-list-item-name">
                            ${this.escapeHtml(design.name || "Unnamed Design")}
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
                            <span data-i18n="remove">Remove</span>
                        </button>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  showModal(modalId) {
    document.getElementById(modalId)?.classList.add("active");
  }

  closeProjectModal() {
    document.getElementById("project-modal")?.classList.remove("active");
    this.currentProject = null;
    this.currentDesigns = [];
    this.parentIdForNew = null;
  }

  closeDesignPicker() {
    document.getElementById("design-picker-modal")?.classList.remove("active");
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);

    // Handle subproject creation
    const subprojectParentId = urlParams.get("subproject");
    if (subprojectParentId) {
      // Wait for projects to load first
      const checkProjectsLoaded = () => {
        if (this.projects && this.projects.length >= 0) {
          this.openSubprojectModal(parseInt(subprojectParentId));
          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        } else {
          setTimeout(checkProjectsLoaded, 100);
        }
      };
      setTimeout(checkProjectsLoaded, 100);
    }

    // Handle project editing
    const editProjectId = urlParams.get("edit");
    if (editProjectId) {
      // Wait for projects to load first
      const checkProjectsLoaded = () => {
        if (this.projects && this.projects.length >= 0) {
          this.editProject(parseInt(editProjectId));
          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        } else {
          setTimeout(checkProjectsLoaded, 100);
        }
      };
      setTimeout(checkProjectsLoaded, 100);
    }

    // Handle add design to project
    const addDesignProjectId = urlParams.get("add-design");
    if (addDesignProjectId) {
      // Wait for projects to load first
      const checkProjectsLoaded = () => {
        if (this.projects && this.projects.length >= 0) {
          this.editProject(parseInt(addDesignProjectId));
          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
          // Open design picker after a short delay to ensure modal is open
          setTimeout(() => {
            this.openDesignPicker();
          }, 300);
        } else {
          setTimeout(checkProjectsLoaded, 100);
        }
      };
      setTimeout(checkProjectsLoaded, 100);
    }
  }

  toggleProjectMenu(projectId) {
    const menu = document.getElementById(`project-menu-${projectId}`);
    if (menu) {
      // Close all other menus first
      this.closeAllMenus();
      menu.classList.toggle("active");
    }
  }

  closeAllMenus() {
    document.querySelectorAll(".project-menu.active").forEach((menu) => {
      menu.classList.remove("active");
    });
  }

  setupDocumentClickHandler() {
    document.addEventListener("click", (e) => {
      // Close menus when clicking outside
      if (!e.target.closest(".project-dropdown")) {
        this.closeAllMenus();
      }
    });
  }

  showError(message) {
    toast.error(message);
  }
}

// Initialize project manager when DOM is ready
let projectManager;

function initProjectManager() {
  // Only initialize ProjectManager on pages that have the projects-tree element
  const projectsTreeExists = document.getElementById("projects-tree") !== null;

  if (!projectsTreeExists) {
    console.log(
      "ProjectManager not initialized - projects-tree element not found on this page",
    );
    return;
  }

  try {
    projectManager = new ProjectManager();
    console.log("ProjectManager initialized successfully");
  } catch (error) {
    console.error("Failed to initialize ProjectManager:", error);
    // Retry after a short delay
    setTimeout(() => {
      console.log("Retrying ProjectManager initialization...");
      initProjectManager();
    }, 500);
  }
}

// Try DOM ready first, fallback to window load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProjectManager);
  // Fallback in case DOMContentLoaded doesn't fire properly
  window.addEventListener("load", () => {
    // Only try fallback if we should have a ProjectManager on this page
    const projectsTreeExists =
      document.getElementById("projects-tree") !== null;
    if (!projectManager && projectsTreeExists) {
      console.warn(
        "ProjectManager not initialized via DOMContentLoaded, using window.load fallback",
      );
      initProjectManager();
    }
  });
} else {
  // DOM is already ready
  initProjectManager();
}
