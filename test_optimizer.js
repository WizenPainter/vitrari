/**
 * Test script for the Glass Optimizer interface
 * Run this in the browser console on the optimizer page to test functionality
 */

// Test data for pieces
const testPieces = [
    { width: 1000, height: 200, quantity: 10, name: "Window Frame" },
    { width: 500, height: 300, quantity: 5, name: "Side Panel" },
    { width: 800, height: 600, quantity: 3, name: "Main Glass" },
    { width: 150, height: 150, quantity: 8, name: "Small Square" }
];

// Test function to add pieces programmatically
function testAddPieces() {
    console.log("Testing piece addition...");

    testPieces.forEach((piece, index) => {
        // Simulate user input
        document.getElementById('piece-width').value = piece.width;
        document.getElementById('piece-height').value = piece.height;
        document.getElementById('piece-quantity').value = piece.quantity;
        document.getElementById('piece-name').value = piece.name;

        // Add the piece
        setTimeout(() => {
            addPiece();
            console.log(`Added piece ${index + 1}: ${piece.name}`);
        }, index * 500);
    });
}

// Test optimization with added pieces
function testOptimization() {
    console.log("Testing optimization...");

    // Select first sheet
    const firstSheet = document.querySelector('input[name="sheet"]');
    if (firstSheet) {
        firstSheet.checked = true;
    }

    // Run optimization
    setTimeout(() => {
        runOptimization();
        console.log("Optimization started");
    }, 2000);
}

// Test clearing all pieces
function testClearAll() {
    console.log("Testing clear all...");
    clearAllPieces();
}

// Test design toggle functionality
function testDesignToggle() {
    console.log("Testing design toggle...");
    toggleDesignSelection();

    setTimeout(() => {
        toggleDesignSelection();
    }, 2000);
}

// Test form validation
function testValidation() {
    console.log("Testing form validation...");

    // Test empty values
    document.getElementById('piece-width').value = '';
    document.getElementById('piece-height').value = '';
    addPiece(); // Should show error

    // Test negative values
    document.getElementById('piece-width').value = '-100';
    document.getElementById('piece-height').value = '200';
    addPiece(); // Should show error

    // Test valid values
    document.getElementById('piece-width').value = '100';
    document.getElementById('piece-height').value = '200';
    addPiece(); // Should work
}

// Test keyboard interactions
function testKeyboardInteractions() {
    console.log("Testing keyboard interactions...");

    const widthInput = document.getElementById('piece-width');
    widthInput.value = '300';
    document.getElementById('piece-height').value = '400';

    // Simulate Enter key press
    const enterEvent = new KeyboardEvent('keypress', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13
    });

    widthInput.dispatchEvent(enterEvent);
}

// Test responsive behavior
function testResponsiveBehavior() {
    console.log("Testing responsive behavior...");

    // Simulate mobile viewport
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        console.log("Viewport meta tag found:", viewport.content);
    }

    // Check if mobile classes are applied correctly
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        console.log("Sidebar classes:", sidebar.className);
    }
}

// Test internationalization
function testI18n() {
    console.log("Testing internationalization...");

    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach((btn, index) => {
        setTimeout(() => {
            btn.click();
            console.log(`Switched to language: ${btn.dataset.lang}`);
        }, index * 1000);
    });
}

// Test piece area calculations
function testAreaCalculations() {
    console.log("Testing area calculations...");

    // Add a piece and check if area is calculated correctly
    document.getElementById('piece-width').value = '1000';
    document.getElementById('piece-height').value = '2000';
    document.getElementById('piece-quantity').value = '2';
    addPiece();

    // Expected area: 1000 * 2000 * 2 = 4,000,000 mm² = 4 m²
    setTimeout(() => {
        const totalArea = document.getElementById('total-area');
        if (totalArea) {
            console.log("Calculated total area:", totalArea.textContent);
            const expectedArea = (1000 * 2000 * 2) / 1000000;
            console.log("Expected area:", expectedArea + " m²");
        }
    }, 500);
}

// Test optimization with different algorithms
function testDifferentAlgorithms() {
    console.log("Testing different algorithms...");

    const algorithmSelect = document.getElementById('algorithm-select');
    const algorithms = ['bottom-left', 'genetic', 'greedy'];

    algorithms.forEach((algorithm, index) => {
        setTimeout(() => {
            algorithmSelect.value = algorithm;
            console.log(`Selected algorithm: ${algorithm}`);

            // Run optimization with this algorithm
            setTimeout(() => {
                runOptimization();
            }, 500);
        }, index * 3000);
    });
}

// Run all tests
function runAllTests() {
    console.log("=== Starting Glass Optimizer Tests ===");

    // Test sequence
    setTimeout(() => testValidation(), 1000);
    setTimeout(() => testAddPieces(), 3000);
    setTimeout(() => testAreaCalculations(), 8000);
    setTimeout(() => testOptimization(), 10000);
    setTimeout(() => testDifferentAlgorithms(), 15000);
    setTimeout(() => testDesignToggle(), 25000);
    setTimeout(() => testKeyboardInteractions(), 28000);
    setTimeout(() => testI18n(), 30000);
    setTimeout(() => testResponsiveBehavior(), 35000);
    setTimeout(() => testClearAll(), 37000);

    console.log("=== All tests scheduled ===");
}

// Individual test functions for manual testing
window.testGlassOptimizer = {
    addPieces: testAddPieces,
    optimize: testOptimization,
    clearAll: testClearAll,
    toggleDesigns: testDesignToggle,
    validation: testValidation,
    keyboard: testKeyboardInteractions,
    responsive: testResponsiveBehavior,
    i18n: testI18n,
    areaCalc: testAreaCalculations,
    algorithms: testDifferentAlgorithms,
    runAll: runAllTests
};

console.log("Glass Optimizer test functions loaded!");
console.log("Available tests:", Object.keys(window.testGlassOptimizer));
console.log("Run testGlassOptimizer.runAll() to run all tests");
console.log("Or run individual tests like testGlassOptimizer.addPieces()");
