let selectedArrow = null;

function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    document.getElementById('canvas').addEventListener('mousedown', (event) => {
        if (is3DMode) {
            onMouseDown3D(event);
        } else {
            onMouseDown(event);
        }
    });
    document.getElementById('canvas').addEventListener('mousemove', (event) => {
        if (is3DMode) {
            onMouseMove3D(event);
        } else {
            onMouseMove(event);
        }
    });
    document.getElementById('canvas').addEventListener('mouseup', () => {
        if (is3DMode) {
            onMouseUp3D();
        } else {
            onMouseUp();
        }
    });
    document.getElementById('canvas').addEventListener('contextmenu', onRightClick);
    document.getElementById('canvas').addEventListener('wheel', onWheel);
    document.addEventListener('keydown', onKeyDown);

    document.getElementById('drawBtn').addEventListener('click', toggleShapeButtons);

    document.querySelectorAll('#shape-buttons .tool-button').forEach(button => {
        button.addEventListener('click', () => {
            engageTool(button.id.replace('Btn', ''));
        });
    });

    document.getElementById('clearBtn').addEventListener('click', clearShapes);
    document.getElementById('extrudeBtn').addEventListener('click', startExtrude);
    document.getElementById('home-view-btn').addEventListener('click', resetToHomeView);
    document.getElementById('move-btn').addEventListener('click', toggleMoveMode);
    document.getElementById('vertex-edit-btn').addEventListener('click', toggleVertexEditMode);
}

function toggleShapeButtons() {
    const shapeButtons = document.getElementById('shape-buttons');
    shapeButtons.style.display = shapeButtons.style.display === 'none' ? 'block' : 'none';
}

function engageTool(toolName) {
    currentTool = toolName;
    document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${toolName}Btn`).classList.add('active');
    updateHelpPanel(helpTexts[toolName]);
    resetDrawing();
}

function onWindowResize() {
    // Implementation from scene.js
    const width = window.innerWidth - 200;
    const height = window.innerHeight;

    if (camera instanceof THREE.OrthographicCamera) {
        camera.left = width / -2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = height / -2;
        camera.updateProjectionMatrix();
    } else if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }

    renderer.setSize(width, height);
}

function getIntersectionPoint(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    const intersects = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersects);
    return intersects;
}

function onMouseDown(event) {
    if (is3DMode) {
        if (isMoveMode && event.button === 0) {
            event.preventDefault();
            // No need to check for intersections or set up drag planes
            // The move will be handled entirely in onMouseMove
        }
    } else if (currentTool && event.button === 0) { // Left mouse button
        const point = getIntersectionPoint(event);
        if (!isWithinGridBounds(point)) {
            updateStatusBar("Cannot start drawing outside the grid");
            return;
        }
        if (currentTool === 'polygon') {
            if (!isDrawing) {
                startDrawing(point);
            } else {
                addPolygonPoint(point);
            }
        } else {
            if (!isDrawing) {
                startDrawing(point);
            } else {
                endDrawing(point);
            }
        }
    }
}

function onMouseMove(event) {
    if (is3DMode && isMoveMode) {
        event.preventDefault();
        const intersects = getIntersects(event.clientX, event.clientY, new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
        if (intersects && intersects.length > 0) {
            const newPosition = new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, extrudedShape.position.z);
            move3DObject(newPosition);
        }
    } else if (!is3DMode && isDrawing) {
        const point = getIntersectionPoint(event);
        updateShapeGuide(point);
    }
}

function onMouseUp(event) {
    if (is3DMode && isMoveMode) {
        // No need to reset anything here
    }
}

function onRightClick(event) {
    event.preventDefault();
    if (currentTool === 'polygon' && vertices.length > 2) {
        finishPolygon();
    }
}

function onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY;
    const zoomSpeed = 0.1;
    
    if (delta > 0) {
        camera.zoom *= (1 - zoomSpeed);
    } else {
        camera.zoom *= (1 + zoomSpeed);
    }

    camera.zoom = Math.max(0.1, Math.min(camera.zoom, 10));
    camera.updateProjectionMatrix();
    updateStatusBar(`Zoom level: ${camera.zoom.toFixed(2)}x`);
}

function onKeyDown(event) {
    if (event.key === 'Escape') {
        if (is3DMode) {
            if (typeof window.cancelMove3D === 'function') {
                window.cancelMove3D();
            }
            if (typeof window.cancelVertexEditMode === 'function') {
                window.cancelVertexEditMode();
            }
        } else {
            resetDrawing();
            currentTool = null;
            updateStatusBar('Command cancelled');
            updateHelpPanel('');
        }
    } else if (is3DMode && isMoveMode) {
        // Pass the event to the 3D.js onKeyDown function
        if (typeof window.onKeyDown === 'function') {
            window.onKeyDown(event);
        }
    }
}

// Add these functions near the top of the file
function onMouseMove3D(event) {
    if (isMoveMode) {
        event.preventDefault();
        if (typeof window.onMouseMove3D === 'function') {
            window.onMouseMove3D(event);
        }
    }
}

function onMouseDown3D(event) {
    if (isMoveMode && event.button === 0) {
        event.preventDefault();
        if (typeof window.onMouseDown3D === 'function') {
            window.onMouseDown3D(event);
        }
    }
}

function onMouseUp3D() {
    // You can add any necessary logic here
}

// Make these functions available globally
window.onMouseMove3D = onMouseMove3D;
window.onMouseDown3D = onMouseDown3D;
window.onMouseUp3D = onMouseUp3D;

// Make setupEventListeners available globally
window.setupEventListeners = setupEventListeners;
window.getIntersectionPoint = getIntersectionPoint;

// Make sure to export the updated function
window.onKeyDown = onKeyDown;