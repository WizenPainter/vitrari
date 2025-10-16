/**
 * Glass Optimizer - Internationalization (i18n)
 * Handles multi-language support
 */

const translations = {
    en: {
        // Navigation
        dashboard: 'Dashboard',
        designer: 'Designer',
        optimizer: 'Optimizer',

        // Tools
        tools: 'Tools',
        select: 'Select',
        circleHole: 'Circle Hole',
        rectangleHole: 'Rectangle Hole',
        edgeClip: 'Edge Clip',

        // Glass Properties
        glassProperties: 'Glass Properties',
        width: 'Width',
        height: 'Height',
        thickness: 'Thickness',

        // Holes List
        holesList: 'Holes List',
        noHoles: 'No holes yet. Click on canvas to add.',
        edgeClipLabel: 'Edge Clip',
        circleHoleLabel: 'Circle Hole',
        rectangleHoleLabel: 'Rectangle Hole',
        xPosition: 'X Position',
        yPosition: 'Y Position',
        diameter: 'Diameter',
        depth: 'Depth',

        // Buttons
        saveDesign: 'Save Design',
        loadDesign: 'Load Design',
        printDesign: 'Print Design',
        clearAll: 'Clear All',

        // Instructions
        instructions: 'Instructions:',
        instruction1: 'Select a tool from the left sidebar',
        instruction2: 'Click and drag on the canvas to create holes',
        instruction3: 'Use the Select tool to move existing holes',
        instruction4: 'Edit hole properties in the sidebar when selected',
        instruction5: 'Press Delete key to remove selected hole',
        instruction6: 'Save your design to a JSON file for later use',

        // Print template
        glassDesignSpec: 'Glass Design Specification',
        generated: 'Generated',
        totalHolesClips: 'Total Holes/Clips',
        holeSpecifications: 'Hole Specifications',
        circleHoles: 'Circle Holes',
        rectangleHoles: 'Rectangle Holes',
        edgeClips: 'Edge Clips',
        quantity: 'Quantity',
        size: 'Size',
        noHolesClipsInDesign: 'No holes or clips in design',

        // Confirmation messages
        clearAllConfirm: 'Clear all holes? This cannot be undone.',
        errorLoadingDesign: 'Error loading design file'
    },
    es: {
        // Navegación
        dashboard: 'Panel',
        designer: 'Diseñador',
        optimizer: 'Optimizador',

        // Herramientas
        tools: 'Herramientas',
        select: 'Seleccionar',
        circleHole: 'Agujero Circular',
        rectangleHole: 'Agujero Rectangular',
        edgeClip: 'Clip de Borde',

        // Propiedades del Vidrio
        glassProperties: 'Propiedades del Vidrio',
        width: 'Ancho',
        height: 'Alto',
        thickness: 'Espesor',

        // Lista de Agujeros
        holesList: 'Lista de Agujeros',
        noHoles: 'Sin agujeros aún. Haz clic en el lienzo para agregar.',
        edgeClipLabel: 'Clip de Borde',
        circleHoleLabel: 'Agujero Circular',
        rectangleHoleLabel: 'Agujero Rectangular',
        xPosition: 'Posición X',
        yPosition: 'Posición Y',
        diameter: 'Diámetro',
        depth: 'Profundidad',

        // Botones
        saveDesign: 'Guardar Diseño',
        loadDesign: 'Cargar Diseño',
        printDesign: 'Imprimir Diseño',
        clearAll: 'Limpiar Todo',

        // Instrucciones
        instructions: 'Instrucciones:',
        instruction1: 'Selecciona una herramienta de la barra lateral izquierda',
        instruction2: 'Haz clic y arrastra en el lienzo para crear agujeros',
        instruction3: 'Usa la herramienta Seleccionar para mover agujeros existentes',
        instruction4: 'Edita las propiedades del agujero en la barra lateral cuando esté seleccionado',
        instruction5: 'Presiona la tecla Suprimir para eliminar el agujero seleccionado',
        instruction6: 'Guarda tu diseño en un archivo JSON para usarlo más tarde',

        // Plantilla de impresión
        glassDesignSpec: 'Especificación de Diseño de Vidrio',
        generated: 'Generado',
        totalHolesClips: 'Total de Agujeros/Clips',
        holeSpecifications: 'Especificaciones de Agujeros',
        circleHoles: 'Agujeros Circulares',
        rectangleHoles: 'Agujeros Rectangulares',
        edgeClips: 'Clips de Borde',
        quantity: 'Cantidad',
        size: 'Tamaño',
        noHolesClipsInDesign: 'Sin agujeros o clips en el diseño',

        // Mensajes de confirmación
        clearAllConfirm: '¿Limpiar todos los agujeros? Esto no se puede deshacer.',
        errorLoadingDesign: 'Error al cargar el archivo de diseño'
    }
};

// Current language (default to Spanish)
let currentLang = localStorage.getItem('glass-optimizer-lang') || 'es';

// Initialize i18n
function initI18n() {
    // Set active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
        btn.addEventListener('click', () => {
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
    localStorage.setItem('glass-optimizer-lang', lang);

    // Update button states
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
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
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
}

// Get translated text
function t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initI18n);

// Export for use in other scripts
window.i18n = {
    t,
    setLanguage,
    getCurrentLang: () => currentLang,
    updatePageLanguage
};
