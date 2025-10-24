/**
 * Glass Optimizer - Internationalization (i18n)
 * Handles multi-language support
 */

const translations = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    designer: "Designer",
    optimizer: "Optimizer",

    // Tools
    tools: "Tools",
    select: "Select",
    taladro: "Drill Hole",
    circleHole: "Circle Hole",
    rectangleHole: "Rectangle Hole",
    avellanado: "Countersink",
    edgeClip: "Edge Clip",

    // Glass Properties
    glassProperties: "Glass Properties",
    width: "Width",
    height: "Height",
    thickness: "Thickness",

    // Holes List
    holesList: "Holes List",
    noHoles: "No holes yet. Click on canvas to add.",
    taladroLabel: "Drill Hole",
    edgeClipLabel: "Edge Clip",
    circleHoleLabel: "Circle Hole",
    rectangleHoleLabel: "Rectangle Hole",
    avellanadoLabel: "Countersink",
    xPosition: "X Position",
    yPosition: "Y Position",
    diameter: "Diameter",
    counterDiameter: "Countersink Diameter",
    holeDiameter: "Hole Diameter",
    depth: "Depth",

    // Buttons
    save: "Save",
    saveAs: "Save As",
    saveDesign: "Save Design",
    loadDesign: "Load Design",
    printDesign: "Print Design",
    clearAll: "Clear All",

    // Instructions
    instructions: "Instructions:",
    instruction1: "Select a tool from the left sidebar",
    instruction2: "Click and drag on the canvas to create holes",
    instruction3: "Use the Select tool to move existing holes",
    instruction4: "Edit hole properties in the sidebar when selected",
    instruction5: "Press Delete key to remove selected hole",
    instruction6: "Save your design to a JSON file for later use",

    // Print template
    glassDesignSpec: "Glass Design Specification",
    generated: "Generated",
    totalHolesClips: "Total Holes/Clips",
    holeSpecifications: "Hole Specifications",
    worksList: "Work List",
    circleHoles: "Circle Holes",
    rectangleHoles: "Rectangle Holes",
    drillHoles: "Drill Holes",
    countersinkHoles: "Countersink Holes",
    edgeClips: "Edge Clips",
    quantity: "Quantity",
    size: "Size",
    noHolesClipsInDesign: "No holes or clips in design",

    // Confirmation messages
    clearAllConfirm: "Clear all holes? This cannot be undone.",
    errorLoadingDesign: "Error loading design file",

    // Dashboard
    welcomeTitle: "Welcome to Glass Optimizer",
    welcomeDescription:
      "Design custom glass pieces and optimize cutting patterns for maximum efficiency",
    glassDesigner: "Glass Designer",
    designerDescription:
      "Create custom glass designs with precise measurements",
    startDesigning: "Start Designing",
    sheetOptimizer: "Sheet Optimizer",
    optimizerDescription: "Optimize cutting patterns to minimize waste",
    optimizeLayout: "Optimize Layout",
    totalDesigns: "Total Designs",
    optimizationsRun: "Optimizations Run",
    activeProjects: "Active Projects",
    projects: "Projects",
    newProject: "New Project",
    loadingProjects: "Loading projects...",
    projectName: "Project Name",
    projectNamePlaceholder: "Enter project name",
    description: "Description",
    projectDescriptionPlaceholder: "Enter project description (optional)",
    designs: "Designs",
    optional: "(Optional)",
    noDesignsAdded:
      'No designs added. Projects can be empty (like folders). Click "Add Design" if you want to include designs.',
    addDesign: "Add Design",
    cancel: "Cancel",
    saveProject: "Save Project",
    selectDesign: "Select Design",
    loadingDesigns: "Loading designs...",

    // Optimizer
    selectDesigns: "Select Designs",
    glassSheet: "Glass Sheet",
    loadingSheets: "Loading sheets...",
    algorithm: "Algorithm",
    bottomLeftFill: "Bottom-Left Fill",
    geneticAlgorithm: "Genetic Algorithm",
    greedyAlgorithm: "Greedy Algorithm",
    runOptimization: "Run Optimization",
    results: "Results",
    utilization: "Utilization",
    waste: "Waste",
    piecesPlaced: "Pieces Placed",
    visualizationPlaceholder: "Visualization will appear here",
    optimizerInstructions:
      'Select designs and click "Run Optimization" to begin',

    // Project Management
    noProjectsYet:
      'No projects yet. Click "New Project" to create your first project.',
    edit: "Edit",
    delete: "Delete",
    newSubproject: "New Subproject",
    editProject: "Edit Project",
    confirmDeleteProject:
      "Are you sure you want to delete this project? This action cannot be undone.",
    projectDeletedSuccess: "Project deleted successfully",
    failedToDeleteProject: "Failed to delete project",
    failedToLoadProjects: "Failed to load projects",
    failedToLoadProject: "Failed to load project",
    projectNameRequired: "Project name is required",
    failedToSaveProject: "Failed to save project",
    noDesignsAvailable:
      "No designs available. Create a design first using the Designer tool.",
    designNotFound: "Design not found",
    remove: "Remove",
    optimizations: "Optimizations",
    created: "Created",
    projectCreatedSuccess: "Project created successfully",
    projectUpdatedSuccess: "Project updated successfully",
    loading: "Loading...",
    addSubproject: "+ Subproject",
  },
  es: {
    // Navegación
    dashboard: "Panel",
    designer: "Diseñador",
    optimizer: "Optimizador",

    // Herramientas
    tools: "Herramientas",
    select: "Seleccionar",
    taladro: "Taladro",
    circleHole: "Resaque Circular",
    rectangleHole: "Resaque Rectangular",
    avellanado: "Avellanado",
    edgeClip: "Clip de Borde",

    // Propiedades del Vidrio
    glassProperties: "Propiedades del Vidrio",
    width: "Ancho",
    height: "Alto",
    thickness: "Espesor",

    // Lista de Resaques
    holesList: "Lista de Resaques",
    noHoles: "Sin resaques aún. Haz clic en el lienzo para agregar.",
    taladroLabel: "Taladro",
    edgeClipLabel: "Clip de Borde",
    circleHoleLabel: "Resaque Circular",
    rectangleHoleLabel: "Resaque Rectangular",
    avellanadoLabel: "Avellanado",
    xPosition: "Posición X",
    yPosition: "Posición Y",
    diameter: "Diámetro",
    counterDiameter: "Diámetro de Avellanado",
    holeDiameter: "Diámetro de Taladro",
    depth: "Profundidad",

    // Botones
    save: "Guardar",
    saveAs: "Guardar como",
    saveDesign: "Guardar Diseño",
    loadDesign: "Cargar Diseño",
    printDesign: "Imprimir Diseño",
    clearAll: "Limpiar Todo",

    // Instrucciones
    instructions: "Instrucciones:",
    instruction1: "Selecciona una herramienta de la barra lateral izquierda",
    instruction2: "Haz clic y arrastra en el lienzo para crear resaques",
    instruction3:
      "Usa la herramienta Seleccionar para mover resaques existentes",
    instruction4:
      "Edita las propiedades del resaque en la barra lateral cuando esté seleccionado",
    instruction5:
      "Presiona la tecla Suprimir para eliminar el resaque seleccionado",
    instruction6: "Guarda tu diseño en un archivo JSON para usarlo más tarde",

    // Plantilla de impresión
    glassDesignSpec: "Especificación de Diseño de Vidrio",
    generated: "Generado",
    totalHolesClips: "Total de Resaques/Clips",
    holeSpecifications: "Especificaciones de Resaques",
    worksList: "Lista de trabajos",
    circleHoles: "Resaques Circulares",
    rectangleHoles: "Resaques Rectangulares",
    drillHoles: "Taladros",
    countersinkHoles: "Avellanados",
    edgeClips: "Clips de Borde",
    quantity: "Cantidad",
    size: "Tamaño",
    noHolesClipsInDesign: "Sin resaques o clips en el diseño",

    // Mensajes de confirmación
    clearAllConfirm: "¿Limpiar todos los resaques? Esto no se puede deshacer.",
    errorLoadingDesign: "Error al cargar el archivo de diseño",

    // Panel de Control
    welcomeTitle: "Bienvenido a Glass Optimizer",
    welcomeDescription:
      "Diseña piezas de vidrio personalizadas y optimiza patrones de corte para máxima eficiencia",
    glassDesigner: "Diseñador de Vidrio",
    designerDescription:
      "Crea diseños de vidrio personalizados con medidas precisas",
    startDesigning: "Comenzar Diseño",
    sheetOptimizer: "Optimizador de Planchas",
    optimizerDescription:
      "Optimiza patrones de corte para minimizar desperdicio",
    optimizeLayout: "Optimizar Disposición",
    totalDesigns: "Total de Diseños",
    optimizationsRun: "Optimizaciones Ejecutadas",
    activeProjects: "Proyectos Activos",
    projects: "Proyectos",
    newProject: "Nuevo Proyecto",
    loadingProjects: "Cargando proyectos...",
    projectName: "Nombre del Proyecto",
    projectNamePlaceholder: "Ingrese el nombre del proyecto",
    description: "Descripción",
    projectDescriptionPlaceholder:
      "Ingrese la descripción del proyecto (opcional)",
    designs: "Diseños",
    optional: "(Opcional)",
    noDesignsAdded:
      'No se han agregado diseños. Los proyectos pueden estar vacíos (como carpetas). Haz clic en "Agregar Diseño" si deseas incluir diseños.',
    addDesign: "Agregar Diseño",
    cancel: "Cancelar",
    saveProject: "Guardar Proyecto",
    selectDesign: "Seleccionar Diseño",
    loadingDesigns: "Cargando diseños...",

    // Optimizador
    selectDesigns: "Seleccionar Diseños",
    glassSheet: "Plancha de Vidrio",
    loadingSheets: "Cargando planchas...",
    algorithm: "Algoritmo",
    bottomLeftFill: "Llenado Inferior-Izquierda",
    geneticAlgorithm: "Algoritmo Genético",
    greedyAlgorithm: "Algoritmo Voraz",
    runOptimization: "Ejecutar Optimización",
    results: "Resultados",
    utilization: "Utilización",
    waste: "Desperdicio",
    piecesPlaced: "Piezas Colocadas",
    visualizationPlaceholder: "La visualización aparecerá aquí",
    optimizerInstructions:
      'Selecciona diseños y haz clic en "Ejecutar Optimización" para comenzar',

    // Gestión de Proyectos
    noProjectsYet:
      'No hay proyectos aún. Haz clic en "Nuevo Proyecto" para crear tu primer proyecto.',
    edit: "Editar",
    delete: "Eliminar",
    newSubproject: "Nuevo Subproyecto",
    editProject: "Editar Proyecto",
    confirmDeleteProject:
      "¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.",
    projectDeletedSuccess: "Proyecto eliminado exitosamente",
    failedToDeleteProject: "Error al eliminar el proyecto",
    failedToLoadProjects: "Error al cargar los proyectos",
    failedToLoadProject: "Error al cargar el proyecto",
    projectNameRequired: "El nombre del proyecto es requerido",
    failedToSaveProject: "Error al guardar el proyecto",
    noDesignsAvailable:
      "No hay diseños disponibles. Primero crea un diseño usando la herramienta Diseñador.",
    designNotFound: "Diseño no encontrado",
    remove: "Eliminar",
    optimizations: "Optimizaciones",
    created: "Creado",
    projectCreatedSuccess: "Proyecto creado exitosamente",
    projectUpdatedSuccess: "Proyecto actualizado exitosamente",
    loading: "Cargando...",
    addSubproject: "+ Subproyecto",
  },
};

// Current language (default to Spanish)
let currentLang = localStorage.getItem("glass-optimizer-lang") || "es";

// Initialize i18n
function initI18n() {
  // Set active language button
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
    });
  });

  // Apply translations
  updatePageLanguage();
}

// Set language
function setLanguage(lang) {
  if (!translations[lang]) return;

  currentLang = lang;
  localStorage.setItem("glass-optimizer-lang", lang);

  // Update button states
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  // Update all translations
  updatePageLanguage();

  // Trigger re-render of holes list if designer exists
  if (window.designer) {
    window.designer.renderHolesList();
  }
}

// Update all text on page
function updatePageLanguage() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (translations[currentLang][key]) {
      element.textContent = translations[currentLang][key];
    }
  });

  // Update placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (translations[currentLang][key]) {
      element.placeholder = translations[currentLang][key];
    }
  });
}

// Get translated text
function t(key) {
  return translations[currentLang][key] || translations["en"][key] || key;
}

// Initialize on load
document.addEventListener("DOMContentLoaded", initI18n);

// Export for use in other scripts
window.i18n = {
  t,
  setLanguage,
  getCurrentLang: () => currentLang,
  updatePageLanguage,
};
