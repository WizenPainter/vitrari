/**
 * Vitrari - Orders Management
 * Handles order creation, editing, and management functionality
 */

// Helper function for i18n fallback
function t(key, fallback) {
  if (window.i18n && window.i18n.t) {
    return window.i18n.t(key);
  }
  return fallback || key;
}

// Helper function for toast fallback
function showToast(message, type = "info") {
  if (window.toast) {
    window.toast.show(message, type);
  } else {
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(message);
  }
}

class OrdersManager {
  constructor() {
    this.orders = [];
    this.designs = [];
    this.currentOrder = null;
    this.selectedDesigns = new Set();

    console.log("OrdersManager: Starting initialization");
    this.init();
  }

  init() {
    console.log("OrdersManager: Binding events and loading data");
    try {
      this.bindEvents();
      this.loadOrders();
      this.loadDesigns();
      console.log("OrdersManager: Initialization complete");
    } catch (error) {
      console.error("OrdersManager: Initialization failed", error);
    }
  }

  bindEvents() {
    console.log("OrdersManager: Binding events");

    // Main buttons
    const newOrderBtn = document.getElementById("new-order-btn");
    if (newOrderBtn) {
      newOrderBtn.addEventListener("click", () => {
        console.log("New order button clicked");
        this.showOrderModal();
      });
    } else {
      console.warn("OrdersManager: new-order-btn not found");
    }

    // Modal events
    const modalCloseButtons = document.querySelectorAll(
      '.modal-close, [data-dismiss="modal"]',
    );
    console.log(
      `OrdersManager: Found ${modalCloseButtons.length} modal close buttons`,
    );
    modalCloseButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        console.log("Modal close button clicked");
        this.closeModal(e.target.closest(".modal"));
      });
    });

    // Form events
    const saveOrderBtn = document.getElementById("save-order-btn");
    if (saveOrderBtn) {
      saveOrderBtn.addEventListener("click", () => {
        console.log("Save order button clicked");
        this.saveOrder();
      });
    } else {
      console.warn("OrdersManager: save-order-btn not found");
    }

    const addDesignBtn = document.getElementById("add-design-btn");
    if (addDesignBtn) {
      addDesignBtn.addEventListener("click", () => {
        console.log("Add design button clicked");
        this.showDesignSelectionModal();
      });
    } else {
      console.warn("OrdersManager: add-design-btn not found");
    }

    // Add selected designs button
    document
      .getElementById("add-selected-designs-btn")
      ?.addEventListener("click", () => {
        this.addSelectedDesigns();
      });

    // Design search
    document
      .getElementById("design-search-input")
      ?.addEventListener("input", (e) => {
        this.searchDesigns(e.target.value);
      });

    // Close modals on outside click
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        this.closeModal(e.target);
      }
    });

    // Form validation
    document.getElementById("order-title")?.addEventListener("input", () => {
      this.validateForm();
    });

    // Print button event delegation (since button is in modal)
    document.addEventListener("click", (e) => {
      if (e.target.closest("#print-order-btn")) {
        console.log("print");
        e.preventDefault();
      }
    });
  }

  async loadOrders() {
    try {
      this.showLoading(true);

      const response = await fetch("/api/orders");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.orders = data.orders || [];

      this.renderOrders();
      this.showLoading(false);
    } catch (error) {
      console.error("Error loading orders:", error);
      this.showError(t("failedToLoadOrders", "Error al cargar los pedidos"));
      this.showLoading(false);
    }
  }

  async loadDesigns() {
    try {
      const response = await fetch("/api/designs");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.designs = data.designs || [];
    } catch (error) {
      console.error("Error loading designs:", error);
      this.designs = [];
    }
  }

  renderOrders() {
    const ordersGrid = document.getElementById("orders-grid");
    const emptyState = document.getElementById("orders-empty");

    if (!ordersGrid) return;

    if (this.orders.length === 0) {
      ordersGrid.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    ordersGrid.style.display = "grid";
    emptyState.style.display = "none";

    ordersGrid.innerHTML = this.orders
      .map((order) => this.renderOrderCard(order))
      .join("");

    // Bind card events
    this.bindOrderCardEvents();
  }

  renderOrderCard(order) {
    const completionRate = this.calculateCompletionRate(order);
    const statusClass = `status-${order.status}`;
    const statusText = this.getStatusText(order.status);

    return `
      <div class="order-card" data-order-id="${order.id}">
        <div class="order-header">
          <div>
            <h3 class="order-title">${this.escapeHtml(order.title)}</h3>
            ${order.subtitle ? `<p class="order-subtitle">${this.escapeHtml(order.subtitle)}</p>` : ""}
          </div>
          <span class="order-status ${statusClass}">${statusText}</span>
        </div>

        <div class="order-meta">
          <span>${window.i18n.t("totalItems")}: ${order.items_list?.length || 0}</span>
          <span>${window.i18n.t("totalQuantity")}: ${this.getTotalQuantity(order)}</span>
        </div>

        <div class="order-stats">

          <div class="stat-item">
            <span class="stat-value">${completionRate}%</span>
            <span class="stat-label">${window.i18n.t("completionRate")}</span>
          </div>
        </div>

        <div class="order-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${completionRate}%"></div>
          </div>
          <div class="progress-text">
            ${this.getCompletedItemsCount(order)} de ${order.items_list?.length || 0} completados
          </div>
        </div>

        ${
          order.due_date
            ? `
          <div class="order-meta">
            <span>${window.i18n.t("dueDate")}: ${this.formatDate(order.due_date)}</span>
          </div>
        `
            : ""
        }

        <div class="order-actions">
          <button class="btn btn-outline view-order" data-order-id="${order.id}">
            <svg width="16" height="16" fill="currentColor">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Ver
          </button>
          <button class="btn btn-outline edit-order" data-order-id="${order.id}">
            <svg width="16" height="16" fill="currentColor">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L4.707 14.707a.5.5 0 0 1-.708 0L1 11.707a.5.5 0 0 1 0-.708L12.146.146z"/>
            </svg>
            ${window.i18n.t("edit")}
          </button>
          <button class="btn btn-outline delete-order" data-order-id="${order.id}">
            <svg width="16" height="16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
            ${window.i18n.t("delete")}
          </button>
        </div>
      </div>
    `;
  }

  bindOrderCardEvents() {
    // View order
    document.querySelectorAll(".view-order").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const orderId = parseInt(
          e.target.closest("[data-order-id]").dataset.orderId,
        );
        this.viewOrder(orderId);
      });
    });

    // Edit order
    document.querySelectorAll(".edit-order").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const orderId = parseInt(
          e.target.closest("[data-order-id]").dataset.orderId,
        );
        this.editOrder(orderId);
      });
    });

    // Delete order
    document.querySelectorAll(".delete-order").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const orderId = parseInt(
          e.target.closest("[data-order-id]").dataset.orderId,
        );
        this.deleteOrder(orderId);
      });
    });
  }

  showOrderModal(order = null) {
    this.currentOrder = order;
    const modal = document.getElementById("order-modal");
    const title = document.getElementById("order-modal-title");

    if (!modal) {
      console.error("OrdersManager: order-modal not found");
      return;
    }

    if (!title) {
      console.warn("OrdersManager: order-modal-title not found");
    }

    if (order) {
      if (title) title.textContent = "Editar Pedido";
      this.populateOrderForm(order);
    } else {
      if (title) title.textContent = t("newOrder", "Nuevo Pedido");
      this.clearOrderForm();
    }

    this.showModal(modal);
    this.validateForm();
  }

  populateOrderForm(order) {
    const elements = {
      "order-id": order.id || "",
      "order-title": order.title || "",
      "order-subtitle": order.subtitle || "",
      "order-description": order.description || "",
      "order-status": order.status || "pendiente",
      "order-notes": order.notes || "",
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.value = value;
      } else {
        console.warn(`OrdersManager: ${id} element not found`);
      }
    });

    if (order.due_date) {
      const dueDateElement = document.getElementById("order-due-date");
      if (dueDateElement) {
        const date = new Date(order.due_date);
        dueDateElement.value = date.toISOString().slice(0, 16);
      }
    }

    this.renderOrderItems(order.items_list || []);
    this.updateOrderSummary();
  }

  clearOrderForm() {
    const form = document.getElementById("order-form");
    const orderId = document.getElementById("order-id");

    if (form) {
      form.reset();
    } else {
      console.warn("OrdersManager: order-form not found");
    }

    if (orderId) {
      orderId.value = "";
    } else {
      console.warn("OrdersManager: order-id not found");
    }

    this.renderOrderItems([]);
    this.updateOrderSummary();
  }

  renderOrderItems(items) {
    const itemsList = document.getElementById("order-items-list");
    const noItemsMessage = document.getElementById("no-items-message");

    if (!itemsList) return;

    if (items.length === 0) {
      itemsList.style.display = "none";
      noItemsMessage.style.display = "block";
      return;
    }

    itemsList.style.display = "block";
    noItemsMessage.style.display = "none";

    itemsList.innerHTML = items
      .map((item, index) => this.renderOrderItem(item, index))
      .join("");

    // Bind item events
    this.bindOrderItemEvents();
  }

  renderOrderItem(item, index) {
    const design = this.designs.find((d) => d.id === item.design_id);
    const designName = design ? design.name : `Diseño #${item.design_id}`;
    const dimensions = design ? `${design.width}x${design.height}mm` : "";

    return `
      <div class="order-item" data-index="${index}" data-design-id="${item.design_id}">
        <div class="item-design">
          <div class="design-info">
            <div class="design-name">${this.escapeHtml(designName)}</div>
            ${dimensions ? `<div class="design-dimensions">${dimensions}</div>` : ""}
          </div>
        </div>

        <div class="item-quantity">
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" data-field="quantity">
        </div>

        <div class="item-priority">
          <select class="priority-select" data-field="priority">
            <option value="1" ${item.priority === 1 ? "selected" : ""}>1</option>
            <option value="2" ${item.priority === 2 ? "selected" : ""}>2</option>
            <option value="3" ${item.priority === 3 ? "selected" : ""}>3</option>
            <option value="4" ${item.priority === 4 ? "selected" : ""}>4</option>
            <option value="5" ${item.priority === 5 ? "selected" : ""}>5</option>
          </select>
        </div>

        <div class="item-actions">
          <button type="button" class="btn-icon delete" data-action="remove">
            <svg width="16" height="16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  bindOrderItemEvents() {
    // Item value changes
    document
      .querySelectorAll(".order-item input, .order-item select")
      .forEach((input) => {
        input.addEventListener("change", () => {
          this.updateOrderSummary();
        });
      });

    // Remove item
    document
      .querySelectorAll('.order-item [data-action="remove"]')
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const item = e.target.closest(".order-item");
          item.remove();
          this.updateOrderSummary();
          this.validateForm();
        });
      });
  }

  showDesignSelectionModal() {
    const modal = document.getElementById("design-selection-modal");
    if (!modal) {
      console.error("OrdersManager: design-selection-modal not found");
      return;
    }
    this.renderDesignsList();
    this.showModal(modal);
  }

  renderDesignsList(searchTerm = "") {
    const designsList = document.getElementById("designs-list");
    const loadingState = document.getElementById("designs-loading");

    if (!designsList) return;

    if (this.designs.length === 0) {
      loadingState.style.display = "flex";
      return;
    }

    loadingState.style.display = "none";

    let filteredDesigns = this.designs;
    if (searchTerm) {
      filteredDesigns = this.designs.filter(
        (design) =>
          design.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          design.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    designsList.innerHTML = filteredDesigns
      .map((design) => this.renderDesignItem(design))
      .join("");

    // Bind design selection events
    this.bindDesignSelectionEvents();
  }

  renderDesignItem(design) {
    const isSelected = this.selectedDesigns.has(design.id);

    return `
      <div class="design-item ${isSelected ? "selected" : ""}" data-design-id="${design.id}">
        <div class="design-details">
          <h4>${this.escapeHtml(design.name)}</h4>
          <p>${this.escapeHtml(design.description || "")}</p>
        </div>
        <div class="design-dimensions-badge">
          ${design.width}×${design.height}×${design.thickness}mm
        </div>
      </div>
    `;
  }

  bindDesignSelectionEvents() {
    document.querySelectorAll(".design-item").forEach((item) => {
      item.addEventListener("click", () => {
        const designId = parseInt(item.dataset.designId);

        if (this.selectedDesigns.has(designId)) {
          this.selectedDesigns.delete(designId);
          item.classList.remove("selected");
        } else {
          this.selectedDesigns.add(designId);
          item.classList.add("selected");
        }
      });

      item.addEventListener("dblclick", () => {
        const designId = parseInt(item.dataset.designId);
        this.addDesignToOrder(designId);
        this.closeModal(document.getElementById("design-selection-modal"));
      });
    });
  }

  addSelectedDesigns() {
    const selectedDesignIds = Array.from(this.selectedDesigns);

    if (selectedDesignIds.length === 0) {
      this.showError("Por favor selecciona al menos un diseño");
      return;
    }

    selectedDesignIds.forEach((designId) => {
      this.addDesignToOrder(designId);
    });

    this.closeModal(document.getElementById("design-selection-modal"));
  }

  addDesignToOrder(designId) {
    const design = this.designs.find((d) => d.id === designId);
    if (!design) return;

    // Check if design is already in the order
    const existingItems = this.getCurrentOrderItems();
    const existingItem = existingItems.find(
      (item) => item.design_id === designId,
    );

    if (existingItem) {
      // Skip if design already exists instead of showing error
      return;
    }

    // Add new item
    const newItem = {
      design_id: designId,
      quantity: 1,
      priority: 3,
      notes: "",
    };

    existingItems.push(newItem);
    this.renderOrderItems(existingItems);
    this.updateOrderSummary();
    this.validateForm();
  }

  getCurrentOrderItems() {
    const items = [];
    document.querySelectorAll(".order-item").forEach((itemEl, index) => {
      const designId = parseInt(itemEl.dataset.designId);

      if (designId) {
        items.push({
          design_id: designId,
          quantity:
            parseInt(itemEl.querySelector('[data-field="quantity"]').value) ||
            1,
          priority:
            parseInt(itemEl.querySelector('[data-field="priority"]').value) ||
            3,
          notes: "",
        });
      }
    });

    return items;
  }

  getDesignIdFromOrderItem(itemEl) {
    // Try to find design ID from the design name or other context
    const designName = itemEl.querySelector(".design-name")?.textContent;
    if (designName) {
      const design = this.designs.find((d) => d.name === designName.trim());
      return design ? design.id : 0;
    }
    return 0;
  }

  updateOrderSummary() {
    const items = this.getCurrentOrderItems();
    const totalItems = items.length;
    const totalQuantity = items.reduce(
      (sum, item) => sum + parseInt(item.quantity || 0),
      0,
    );

    const totalItemsElement = document.getElementById("summary-total-items");
    const totalQuantityElement = document.getElementById(
      "summary-total-quantity",
    );

    if (totalItemsElement) {
      totalItemsElement.textContent = totalItems;
    } else {
      console.warn("OrdersManager: summary-total-items not found");
    }

    if (totalQuantityElement) {
      totalQuantityElement.textContent = totalQuantity;
    } else {
      console.warn("OrdersManager: summary-total-quantity not found");
    }
  }

  validateForm() {
    const title = document.getElementById("order-title").value.trim();
    const items = this.getCurrentOrderItems();
    const saveBtn = document.getElementById("save-order-btn");

    const isValid = title.length > 0 && items.length > 0;

    if (saveBtn) {
      saveBtn.disabled = !isValid;
    }

    return isValid;
  }

  async saveOrder() {
    if (!this.validateForm()) {
      this.showError(window.i18n.t("orderTitleRequired"));
      return;
    }

    try {
      const formData = this.getOrderFormData();
      const isEdit = this.currentOrder && this.currentOrder.id;

      const url = isEdit
        ? `/api/orders/${this.currentOrder.id}`
        : "/api/orders";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      this.closeModal(document.getElementById("order-modal"));
      this.showSuccess(
        isEdit
          ? window.i18n.t("orderUpdatedSuccess")
          : window.i18n.t("orderCreatedSuccess"),
      );
      this.loadOrders();
    } catch (error) {
      console.error("Error saving order:", error);
      this.showError(window.i18n.t("failedToCreateOrder"));
    }
  }

  getOrderFormData() {
    const items = this.getCurrentOrderItems();

    const formData = {
      title: document.getElementById("order-title").value.trim(),
      subtitle: document.getElementById("order-subtitle").value.trim(),
      description: document.getElementById("order-description").value.trim(),
      status: document.getElementById("order-status").value,
      notes: document.getElementById("order-notes").value.trim(),
      items_list: items,
    };

    const dueDateInput = document.getElementById("order-due-date").value;
    if (dueDateInput) {
      formData.due_date = new Date(dueDateInput).toISOString();
    }

    return formData;
  }

  async deleteOrder(orderId) {
    if (!confirm(window.i18n.t("confirmDeleteOrder"))) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.showSuccess(window.i18n.t("orderDeletedSuccess"));
      this.loadOrders();
    } catch (error) {
      console.error("Error deleting order:", error);
      this.showError(window.i18n.t("failedToDeleteOrder"));
    }
  }

  async viewOrder(orderId) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById("order-details-modal");
    const title = document.getElementById("order-details-title");
    const content = document.getElementById("order-details-content");

    title.textContent = order.title;
    content.innerHTML = this.renderOrderDetails(order);

    // Store current order for print functionality
    this.currentPrintOrder = order;

    // Add print button to modal footer if it doesn't exist
    this.addPrintButtonToModal(modal);

    this.showModal(modal);
  }

  renderOrderDetails(order) {
    const completionRate = this.calculateCompletionRate(order);
    const statusText = this.getStatusText(order.status);

    return `
      <div class="order-details">
        <div class="detail-section">
          <h3>Información General</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Título:</label>
              <span>${this.escapeHtml(order.title)}</span>
            </div>
            ${
              order.subtitle
                ? `
              <div class="detail-item">
                <label>Subtítulo:</label>
                <span>${this.escapeHtml(order.subtitle)}</span>
              </div>
            `
                : ""
            }
            <div class="detail-item">
              <label>Estado:</label>
              <span class="order-status status-${order.status}">${statusText}</span>
            </div>

            <div class="detail-item">
              <label>Progreso:</label>
              <span>${completionRate}%</span>
            </div>
            ${
              order.due_date
                ? `
              <div class="detail-item">
                <label>Fecha de Entrega:</label>
                <span>${this.formatDate(order.due_date)}</span>
              </div>
            `
                : ""
            }
          </div>
          ${
            order.description
              ? `
            <div class="detail-item full-width">
              <label>Descripción:</label>
              <p>${this.escapeHtml(order.description)}</p>
            </div>
          `
              : ""
          }
        </div>

        <div class="detail-section">
          <h3>Items del Pedido</h3>
          <div class="order-items-details">
            ${order.items_list?.map((item) => this.renderOrderItemDetails(item)).join("") || "<p>No hay items en este pedido</p>"}
          </div>
        </div>

        ${
          order.notes
            ? `
          <div class="detail-section">
            <h3>Notas</h3>
            <p>${this.escapeHtml(order.notes)}</p>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  renderOrderItemDetails(item) {
    const design = this.designs.find((d) => d.id === item.design_id);
    const designName = design ? design.name : `Diseño #${item.design_id}`;

    return `
      <div class="order-item-detail">
        <div class="item-header">
          <h4>${this.escapeHtml(designName)}</h4>
        </div>
        <div class="item-info">
          <span>Cantidad: ${item.quantity}</span>
          <span>Prioridad: ${item.priority}</span>
        </div>
        ${
          design
            ? `
          <div class="design-info">
            <span>Dimensiones: ${design.width}×${design.height}×${design.thickness}mm</span>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  editOrder(orderId) {
    const order = this.orders.find((o) => o.id === orderId);
    if (order) {
      this.showOrderModal(order);
    }
  }

  searchDesigns(searchTerm) {
    this.renderDesignsList(searchTerm.toLowerCase());
  }

  // Utility methods
  showModal(modal) {
    if (modal) {
      console.log("OrdersManager: Showing modal", modal.id);
      modal.classList.add("show");
      document.body.style.overflow = "hidden";
    } else {
      console.warn("OrdersManager: Cannot show modal - modal is null");
    }
  }

  closeModal(modal) {
    if (modal) {
      console.log("OrdersManager: Closing modal", modal.id);
      modal.classList.remove("show");
      document.body.style.overflow = "";

      // Clear selected designs when closing design selection modal
      if (modal.id === "design-selection-modal") {
        this.selectedDesigns.clear();
        const searchInput = document.getElementById("design-search-input");
        if (searchInput) {
          searchInput.value = "";
        }
      }
    } else {
      console.warn("OrdersManager: Cannot close modal - modal is null");
    }
  }

  showLoading(show) {
    const loadingEl = document.getElementById("orders-loading");
    const gridEl = document.getElementById("orders-grid");
    const emptyEl = document.getElementById("orders-empty");

    if (show) {
      if (loadingEl) loadingEl.style.display = "flex";
      if (gridEl) gridEl.style.display = "none";
      if (emptyEl) emptyEl.style.display = "none";
    } else {
      if (loadingEl) loadingEl.style.display = "none";
    }
  }

  showSuccess(message) {
    showToast(message, "success");
  }

  showError(message) {
    showToast(message, "error");
  }

  calculateCompletionRate(order) {
    if (!order.items_list || order.items_list.length === 0) {
      return 0;
    }

    const completedItems = order.items_list.filter(
      (item) => item.is_completed,
    ).length;
    return Math.round((completedItems / order.items_list.length) * 100);
  }

  getCompletedItemsCount(order) {
    if (!order.items_list) return 0;
    return order.items_list.filter((item) => item.is_completed).length;
  }

  getTotalQuantity(order) {
    if (!order.items_list) return 0;
    return order.items_list.reduce((sum, item) => sum + item.quantity, 0);
  }

  getStatusText(status) {
    const statusMap = {
      pendiente: "Pendiente",
      en_proceso: "En Proceso",
      completado: "Completado",
      cancelado: "Cancelado",
      pausado: "Pausado",
    };
    return statusMap[status] || status;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  addPrintButtonToModal(modal) {
    const modalFooter = modal.querySelector(".modal-footer");
    if (!modalFooter) return;

    // Check if print button already exists
    if (document.getElementById("print-order-btn")) return;

    // Create print button
    const printButton = document.createElement("button");
    printButton.type = "button";
    printButton.id = "print-order-btn";
    printButton.className = "btn btn-primary";
    printButton.style.marginRight = "1rem";

    // Create icon
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("width", "16");
    icon.setAttribute("height", "16");
    icon.setAttribute("fill", "currentColor");
    icon.style.marginRight = "0.5rem";

    const path1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path1.setAttribute(
      "d",
      "M2 7a1 1 0 011-1h10a1 1 0 011 1v4a1 1 0 01-1 1H3a1 1 0 01-1-1V7z",
    );
    const path2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path2.setAttribute("d", "M4 3a1 1 0 011-1h6a1 1 0 011 1v3H4V3z");
    const path3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path3.setAttribute("d", "M4 9h8v4H4V9z");

    icon.appendChild(path1);
    icon.appendChild(path2);
    icon.appendChild(path3);

    // Create text span
    const textSpan = document.createElement("span");
    textSpan.textContent = "Imprimir";

    // Assemble button
    printButton.appendChild(icon);
    printButton.appendChild(textSpan);

    // Add click handler
    printButton.addEventListener("click", () => {
      console.log("print");
    });

    // Insert button at the beginning of modal footer
    modalFooter.insertBefore(printButton, modalFooter.firstChild);
  }
}
