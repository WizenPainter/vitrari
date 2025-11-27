/**
 * Herrajes (Hardware) Manager for Glass Designer
 * Manages hardware selection and automatic hole/avellanado generation
 */

class HerrrajesManager {
  constructor(designer) {
    this.designer = designer;
    this.herrajes = [];
    this.selectedHerrajes = [];
    this.herrajeHolesMap = {}; // Maps herraje ID to hole IDs it created
    
    this.initializeUI();
    this.loadHerrajes();
    this.setupEventListeners();
  }

  /**
   * Initialize UI elements
   */
  initializeUI() {
    // Try right sidebar first (preferred location)
    let toggleBtn = document.getElementById('herrajes-toggle-right');
    let content = document.getElementById('herrajes-content-right');
    
    // Fall back to left sidebar if right doesn't exist
    if (!toggleBtn) {
      toggleBtn = document.getElementById('herrajes-toggle');
      content = document.getElementById('herrajes-content');
    }
    
    if (toggleBtn && content) {
      toggleBtn.addEventListener('click', () => {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? '▲' : '▼';
      });
    }
  }

  /**
   * Load herrajes from API
   */
  async loadHerrajes() {
    try {
      const response = await fetch('/api/herrajes?limit=100');
      if (!response.ok) {
        throw new Error(`Failed to load herrajes: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.herrajes = data.herrajes || [];
      
      // Render initial list
      this.renderHerrajes();
    } catch (error) {
      console.error('Error loading herrajes:', error);
      this.showMessage('Failed to load hardware catalog', 'error');
    }
  }

  /**
   * Render herrajes list based on filters
   */
  renderHerrajes() {
    // Try right sidebar first (preferred location)
    let searchInput = document.getElementById('herrajes-search-right');
    let categoryFilter = document.getElementById('herrajes-category-filter-right');
    let list = document.getElementById('herrajes-list-right');
    
    // Fall back to left sidebar
    if (!list) {
      searchInput = document.getElementById('herrajes-search');
      categoryFilter = document.getElementById('herrajes-category-filter');
      list = document.getElementById('herrajes-list');
    }
    
    if (!list) return;

    let filtered = this.herrajes;

    // Filter by category
    if (categoryFilter && categoryFilter.value) {
      filtered = filtered.filter(h => h.category === categoryFilter.value);
    }

    // Filter by search
    if (searchInput && searchInput.value) {
      const query = searchInput.value.toLowerCase();
      filtered = filtered.filter(h => 
        h.code.toLowerCase().includes(query) ||
        h.name.toLowerCase().includes(query) ||
        (h.description && h.description.toLowerCase().includes(query))
      );
    }

    // Clear list
    list.innerHTML = '';

    if (filtered.length === 0) {
      list.innerHTML = '<p style="color: #64748b; font-size: 0.875rem; text-align: center; padding: 1rem;">No hardware found</p>';
      return;
    }

    // Render each herraje
    filtered.forEach(herraje => {
      const item = this.createHerrrajeCard(herraje);
      list.appendChild(item);
    });
  }

  /**
   * Create a hardware item card
   */
  createHerrrajeCard(herraje) {
    const div = document.createElement('div');
    const isSelected = this.selectedHerrajes.some(h => h.id === herraje.id);
    
    div.className = `herraje-card ${isSelected ? 'selected' : ''}`;
    div.style.cssText = `
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      border: 2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'};
      border-radius: 4px;
      cursor: pointer;
      background: ${isSelected ? '#eff6ff' : '#f8fafc'};
      transition: all 0.2s;
    `;

    // Check glass compatibility
    const glassThickness = this.designer.glass.thickness;
    const isCompatible = glassThickness >= herraje.min_thickness && 
                        glassThickness <= herraje.max_thickness;
    const compatibilityClass = isCompatible ? '' : 'incompatible';

    const compatibilityWarning = !isCompatible 
      ? `<div style="color: #dc2626; font-size: 0.75rem; margin-top: 0.25rem;">⚠ Glass thickness ${glassThickness}mm not compatible (${herraje.min_thickness}-${herraje.max_thickness}mm)</div>`
      : '';

    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <strong style="font-size: 0.95rem;">${herraje.code}</strong>
          <div style="font-size: 0.85rem; color: #475569;">${herraje.name}</div>
          <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;">
            Hole: ${herraje.hole_size}mm${herraje.countersink_size ? ` | Countersink: ${herraje.countersink_size}mm` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <span style="display: inline-block; background: #e0e7ff; color: #4f46e5; padding: 0.25rem 0.5rem; border-radius: 3px; font-size: 0.75rem;">
            ${herraje.positions} position${herraje.positions !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      ${compatibilityWarning}
    `;

    div.addEventListener('click', () => this.toggleHerraje(herraje));
    return div;
  }

  /**
   * Toggle herraje selection
   */
  toggleHerraje(herraje) {
    const index = this.selectedHerrajes.findIndex(h => h.id === herraje.id);
    
    if (index >= 0) {
      // Remove herraje and its holes
      this.removeHerraje(herraje.id);
    } else {
      // Add herraje
      this.addHerraje(herraje);
    }

    // Re-render list
    this.renderHerrajes();
    this.designer.render();
  }

  /**
   * Add herraje and generate holes
   */
  addHerraje(herraje) {
    // Check compatibility
    const glassThickness = this.designer.glass.thickness;
    if (glassThickness < herraje.min_thickness || glassThickness > herraje.max_thickness) {
      this.showMessage(
        `Glass thickness ${glassThickness}mm not compatible with this hardware (${herraje.min_thickness}-${herraje.max_thickness}mm)`,
        'warning'
      );
      return;
    }

    // Add to selection
    this.selectedHerrajes.push(herraje);

    // Generate holes
    this.generateHoles(herraje);

    this.showMessage(`Added: ${herraje.name}`, 'success');
  }

  /**
   * Remove herraje and its holes
   */
  removeHerraje(herrajeId) {
    this.selectedHerrajes = this.selectedHerrajes.filter(h => h.id !== herrajeId);

    // Remove associated holes
    if (this.herrajeHolesMap[herrajeId]) {
      const holeIndices = this.herrajeHolesMap[herrajeId];
      // Remove in reverse order to maintain indices
      holeIndices.sort((a, b) => b - a).forEach(idx => {
        this.designer.holes.splice(idx, 1);
      });
      delete this.herrajeHolesMap[herrajeId];
    }

    const herraje = this.herrajes.find(h => h.id === herrajeId);
    if (herraje) {
      this.showMessage(`Removed: ${herraje.name}`, 'info');
    }
  }

  /**
   * Generate holes for herraje based on glass dimensions
   */
  generateHoles(herraje) {
    const glassWidth = this.designer.glass.width;
    const glassHeight = this.designer.glass.height;
    const positions = this.calculateHolePositions(herraje, glassWidth, glassHeight);

    const holeIndices = [];

    positions.forEach((pos, index) => {
      // Create main hole
      const hole = {
        x: pos.x,
        y: pos.y,
        diameter: herraje.hole_size,
        shape: 'circle',
        type: 'hole',
        herrajeId: herraje.id,
        herrajeCode: herraje.code,
        tolerance: 0.5,
        locked: true, // Prevent manual editing
      };

      const holeIndex = this.designer.holes.length;
      this.designer.holes.push(hole);
      holeIndices.push(holeIndex);

      // Create countersink if needed
      if (herraje.countersink_size && herraje.countersink_size > 0) {
        const countersink = {
          x: pos.x,
          y: pos.y,
          diameter: herraje.countersink_size,
          shape: 'circle',
          type: 'avellanado',
          herrajeId: herraje.id,
          herrajeCode: herraje.code,
          counterSinkType: herraje.countersink_type || 'cone', // cone, flat, etc.
          counterSinkAngle: 90, // Standard cone angle
          tolerance: 0.5,
          locked: true,
        };

        const countersinkIndex = this.designer.holes.length;
        this.designer.holes.push(countersink);
        holeIndices.push(countersinkIndex);
      }
    });

    // Store mapping
    this.herrajeHolesMap[herraje.id] = holeIndices;
  }

  /**
   * Calculate hole positions based on pattern
   */
  calculateHolePositions(herraje, glassWidth, glassHeight) {
    const positions = [];
    const pattern = herraje.hole_pattern || 'single';
    const margin = 30; // Minimum distance from edges in mm

    switch (pattern) {
      case 'single':
        // Single hole at center
        positions.push({
          x: glassWidth / 2,
          y: glassHeight / 2,
        });
        break;

      case 'pair':
        // Two holes vertically aligned
        const spacing = Math.max(60, glassHeight / 4);
        positions.push({
          x: glassWidth / 2,
          y: Math.max(margin, spacing),
        });
        positions.push({
          x: glassWidth / 2,
          y: Math.min(glassHeight - margin, glassHeight - spacing),
        });
        break;

      case 'linear':
        // Holes in a horizontal line
        const centerY = glassHeight / 2;
        const spacing1 = glassWidth / (herraje.positions + 1);
        for (let i = 1; i <= herraje.positions; i++) {
          positions.push({
            x: i * spacing1,
            y: centerY,
          });
        }
        break;

      case 'grid':
        // Grid pattern
        const spacingX = (glassWidth - 2 * margin) / (Math.ceil(Math.sqrt(herraje.positions)) + 1);
        const spacingY = (glassHeight - 2 * margin) / (Math.ceil(Math.sqrt(herraje.positions)) + 1);
        let count = 0;
        for (let i = 1; i <= Math.ceil(Math.sqrt(herraje.positions)) && count < herraje.positions; i++) {
          for (let j = 1; j <= Math.ceil(Math.sqrt(herraje.positions)) && count < herraje.positions; j++) {
            positions.push({
              x: margin + i * spacingX,
              y: margin + j * spacingY,
            });
            count++;
          }
        }
        break;

      case 'custom':
        // Custom pattern - user will place manually
        // Just create placeholder at center
        positions.push({
          x: glassWidth / 2,
          y: glassHeight / 2,
        });
        break;

      default:
        positions.push({
          x: glassWidth / 2,
          y: glassHeight / 2,
        });
    }

    return positions;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Try right sidebar first (preferred location)
    let searchInput = document.getElementById('herrajes-search-right');
    let categoryFilter = document.getElementById('herrajes-category-filter-right');
    let clearBtn = document.getElementById('btn-clear-herrajes-right');

    // Fall back to left sidebar
    if (!searchInput) {
      searchInput = document.getElementById('herrajes-search');
      categoryFilter = document.getElementById('herrajes-category-filter');
      clearBtn = document.getElementById('btn-clear-herrajes');
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderHerrajes());
    }

    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => this.renderHerrajes());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAllHerrajes());
    }
  }

  /**
   * Clear all selected herrajes
   */
  clearAllHerrajes() {
    if (this.selectedHerrajes.length === 0) {
      this.showMessage('No hardware selected', 'info');
      return;
    }

    if (confirm(`Remove all ${this.selectedHerrajes.length} hardware items?`)) {
      const herrajeIds = [...this.selectedHerrajes.map(h => h.id)];
      herrajeIds.forEach(id => this.removeHerraje(id));
      this.selectedHerrajes = [];
      this.renderHerrajes();
      this.designer.render();
      this.showMessage('All hardware removed', 'success');
    }
  }

  /**
   * Show temporary message
   */
  showMessage(text, type = 'info') {
    // Create message element
    const msg = document.createElement('div');
    const colors = {
      success: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
      error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
      warning: { bg: '#fef3c7', border: '#eab308', text: '#92400e' },
      info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    };
    const color = colors[type] || colors.info;

    msg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem;
      background: ${color.bg};
      border-left: 4px solid ${color.border};
      color: ${color.text};
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 300px;
      animation: slideIn 0.3s ease;
    `;

    msg.textContent = text;
    document.body.appendChild(msg);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      msg.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => msg.remove(), 300);
    }, 3000);
  }

  /**
   * Export herrajes data
   */
  getHerrajesData() {
    return {
      herrajes: this.selectedHerrajes.map(h => ({
        id: h.id,
        code: h.code,
        name: h.name,
        holesCount: this.herrajeHolesMap[h.id]?.length || 0,
      })),
    };
  }
}

// Add slide animations to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  .herraje-card {
    transition: all 0.2s ease;
  }

  .herraje-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .herraje-card.selected {
    background: #eff6ff;
    border-color: #3b82f6;
  }
`;
document.head.appendChild(style);
