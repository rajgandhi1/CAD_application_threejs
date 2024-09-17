const helpTexts = {
    rectangle: "Click and drag to draw a rectangle",
    circle: "Click to set the center, then drag to set the radius",
    square: "Click and drag to draw a square",
    polygon: "Click to add points, right-click to finish the polygon",
    completed: "Shape completed. Click 'Extrude' to create a 3D shape or 'Clear' to start over."
};

function updateStatusBar(message) {
    document.getElementById('status-bar').textContent = message;
}

function updateHelpPanel(message) {
    const helpPanel = document.getElementById('help-panel');
    if (message) {
        helpPanel.style.display = 'block';
        document.getElementById('help-text').textContent = message;
    } else {
        helpPanel.style.display = 'none';
    }
}

// Make functions available globally
window.updateStatusBar = updateStatusBar;
window.updateHelpPanel = updateHelpPanel;
window.helpTexts = helpTexts;