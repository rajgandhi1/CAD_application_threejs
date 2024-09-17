let scene, camera, renderer, raycaster, plane;
let currentTool = null;
let isDrawing = false;
let isPanning = false;
let startPoint, endPoint;
let shapeGroup, guideLine, tempShape;
let vertices = [];
let panStart = new THREE.Vector2();
let controls;
let is3DMode = false;
let homeViewPosition, homeViewTarget;
let axesHelper;
let isMoveMode = false;
let extrudedShape;
// Remove or comment out this line if it exists
// let dragOffset = new THREE.Vector3();
// Remove this line as it's already declared in 3d.js
// let isVertexEditMode = false;

function init() {
    if (typeof initScene === 'function') {
        initScene();
    } else {
        console.error('initScene is not defined. Check if scene.js is loaded correctly.');
    }
    
    // Wait for all scripts to load before setting up event listeners
    window.addEventListener('load', () => {
        if (typeof setupEventListeners === 'function') {
            setupEventListeners();
        } else {
            console.error('setupEventListeners is not defined. Check if tools.js is loaded correctly.');
        }
    });
    
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
}

// Call init directly
init();

// Make variables available globally
window.scene = scene;
window.camera = camera;
window.renderer = renderer;
window.raycaster = raycaster;
window.plane = plane;
window.currentTool = currentTool;
window.isDrawing = isDrawing;
window.isPanning = isPanning;
window.startPoint = startPoint;
window.endPoint = endPoint;
window.shapeGroup = shapeGroup;
window.guideLine = guideLine;
window.tempShape = tempShape;
window.vertices = vertices;
window.panStart = panStart;
window.controls = controls;
window.is3DMode = is3DMode;
window.homeViewPosition = homeViewPosition;
window.homeViewTarget = homeViewTarget;
window.axesHelper = axesHelper;
window.isMoveMode = isMoveMode;
window.extrudedShape = extrudedShape;
// Remove these lines if they exist
// window.dragPlane = dragPlane;
// window.dragOffset = dragOffset;
// This line is not needed as isVertexEditMode is already global from 3d.js
// window.isVertexEditMode = isVertexEditMode;
