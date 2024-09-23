let moveMode = null;
let moveArrows, rotateCircles;
let dragStart = new THREE.Vector3();
let dragEnd = new THREE.Vector3();
let dragDelta = new THREE.Vector3();
let objectCenter = new THREE.Vector3();
let isVertexEditMode = false;
let vertexMarkers = [];
let originalMaterial;
let editModeMaterial;
let selectedVertex = null;
let vertexGroups = [];

function startExtrude() {
    const shapes = shapeGroup.children.filter(child => child instanceof THREE.Line);
    if (shapes.length !== 1) {
        alert("Please ensure only one shape is on the screen before extruding.");
        return;
    }

    const shape = shapes[0];
    if (!(shape instanceof THREE.Line)) {
        alert("The shape must be a closed polygon to extrude.");
        return;
    }

    const height = prompt("Enter extrusion height:", "100");
    if (height === null) return;
    const extrusionHeight = parseFloat(height);
    if (isNaN(extrusionHeight) || extrusionHeight <= 0) {
        alert("Please enter a valid positive number for the extrusion height.");
        return;
    }
    extrudeShape(extrusionHeight, shape);
}

function extrudeShape(height, shape) {
    const extrudeSettings = {
        steps: 1,
        depth: height,
        bevelEnabled: false,
    };

    const points = [];
    const positionAttribute = shape.geometry.getAttribute('position');
    for (let i = 0; i < positionAttribute.count; i++) {
        points.push(new THREE.Vector2(positionAttribute.getX(i), positionAttribute.getY(i)));
    }
    const shapeGeometry = new THREE.Shape(points);
    const geometry = new THREE.ExtrudeGeometry(shapeGeometry, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00, specular: 0x111111, shininess: 50 });
    extrudedShape = new THREE.Mesh(geometry, material);

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    extrudedShape.add(wireframe);

    scene.remove(shapeGroup);
    scene.add(extrudedShape);

    switchTo3DMode();
}

function switchTo3DMode() {
    is3DMode = true;
    const aspect = (window.innerWidth - 200) / window.innerHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 10000);

    const boundingBox = new THREE.Box3().setFromObject(extrudedShape);
    objectCenter = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 1.5;
    camera.position.set(objectCenter.x, objectCenter.y, cameraZ + objectCenter.z);
    camera.lookAt(objectCenter);

    homeViewPosition = camera.position.clone();
    homeViewTarget = objectCenter.clone();

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = maxDim / 2;
    controls.maxDistance = cameraZ * 2;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };
    controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
    };
    // controls.target.copy(objectCenter);
    controls.target.set(0, 0, 0);
    controls.update();

    // Update toolbar
    const toolbar = document.getElementById('toolbar');
    const homeViewBtn = document.getElementById('home-view-btn');
    const moveBtn = document.getElementById('move-btn');
    const vertexEditBtn = document.getElementById('vertex-edit-btn');

    // Move buttons to toolbar if they're not already there
    [homeViewBtn, moveBtn, vertexEditBtn].forEach(btn => {
        if (btn.parentNode !== toolbar) {
            toolbar.appendChild(btn);
        }
        btn.style.display = 'block';
        btn.style.marginBottom = '10px'; // Add some vertical spacing
    });

    // Hide other toolbar buttons
    document.querySelectorAll('#toolbar .tool-button:not(#home-view-btn):not(#move-btn):not(#vertex-edit-btn)').forEach(btn => btn.style.display = 'none');

    // Add creator text
    let creatorText = document.getElementById('creator-text');
    if (!creatorText) {
        creatorText = document.createElement('div');
        creatorText.id = 'creator-text';
        creatorText.textContent = 'Created by Raj Gandhi';
        creatorText.style.position = 'absolute';
        creatorText.style.bottom = '10px';
        creatorText.style.left = '10px';
        creatorText.style.fontSize = '12px';
        creatorText.style.color = '#666';
        toolbar.appendChild(creatorText);
    }

    document.getElementById('help-panel').style.display = 'none';

    updateStatusBar("Shape extruded. Use mouse to navigate in 3D.");
    updateNavigationInstructions();
}

function resetToHomeView() {
    if (!is3DMode) return;
    
    camera.position.copy(homeViewPosition);
    controls.target.copy(homeViewTarget);
    controls.update();
}

function toggleMoveMode() {
    isMoveMode = !isMoveMode;
    const moveBtn = document.getElementById('move-btn');
    if (isMoveMode) {
        moveBtn.classList.add('active');
        extrudedShape.material.transparent = true;
        extrudedShape.material.opacity = 0.5;
        extrudedShape.material.color.setHex(0x0000ff);
        controls.enabled = false;
        createMoveControls();
    } else {
        moveBtn.classList.remove('active');
        extrudedShape.material.transparent = false;
        extrudedShape.material.opacity = 1;
        extrudedShape.material.color.setHex(0x00ff00);
        resetOrbitControls();
        removeMoveControls();
    }
    updateNavigationInstructions();
}

function createMoveControls() {
    moveArrows = createArrows();
    rotateCircles = createRotationCircles();
    scene.add(moveArrows);
    scene.add(rotateCircles);
    updateMoveControls();
}

function removeMoveControls() {
    scene.remove(moveArrows);
    scene.remove(rotateCircles);
    moveArrows = null;
    rotateCircles = null;
}

function createArrows() {
    const arrowGroup = new THREE.Group();
    const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1)
    ];
    const colors = [0xff0000, 0x00ff00, 0x0000ff];

    directions.forEach((dir, index) => {
        const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(), 50, colors[index]);
        arrowGroup.add(arrow);
    });

    return arrowGroup;
}

function createRotationCircles() {
    const circleGroup = new THREE.Group();
    const axes = ['x', 'y', 'z'];
    const colors = [0xff0000, 0x00ff00, 0x0000ff];

    axes.forEach((axis, index) => {
        const geometry = new THREE.TorusGeometry(30, 0.5, 16, 100);
        const material = new THREE.MeshBasicMaterial({ color: colors[index] });
        const torus = new THREE.Mesh(geometry, material);
        if (axis === 'x') torus.rotation.y = Math.PI / 2;
        if (axis === 'z') torus.rotation.x = Math.PI / 2;
        circleGroup.add(torus);
    });

    return circleGroup;
}

function onKeyDown(event) {
    if (isMoveMode) {
        switch (event.key.toLowerCase()) {
            case 't':
                moveMode = 'translate';
                updateStatusBar('Translation mode active');
                break;
            case 'r':
                moveMode = 'rotate';
                updateStatusBar('Rotation mode active');
                break;
            case 'escape':
                cancelMove3D();
                break;
        }
    }
    if (event.key.toLowerCase() === 'escape') {
        cancelVertexEditMode();
    }
}

function onMouseDown3D(event) {
    if (isMoveMode && event.button === 0) {
        event.preventDefault();
        const intersects = getIntersects(event.clientX, event.clientY);
        if (intersects.length > 0) {
            dragStart.copy(intersects[0].point);
        }
    } else if (isVertexEditMode) {
        const intersects = getIntersects(event.clientX, event.clientY);
        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            if (intersectedObject.userData && intersectedObject.userData.groupIndex !== undefined) {
                const groupIndex = intersectedObject.userData.groupIndex;
                if (vertexGroups[groupIndex]) {
                    selectedVertex = { marker: intersectedObject, group: vertexGroups[groupIndex] };
                } else {
                    console.warn('No group found for the selected vertex');
                }
            } else {
                console.log('Clicked object is not a vertex marker');
            }
        }
    }
}

function onMouseMove3D(event) {
    if (isMoveMode && moveMode && event.buttons === 1) {
        event.preventDefault();
        const intersects = getIntersects(event.clientX, event.clientY);
        if (intersects.length > 0) {
            dragEnd.copy(intersects[0].point);
            dragDelta.subVectors(dragEnd, dragStart);
            switch (moveMode) {
                case 'translate':
                    translateObject(dragDelta);
                    break;
                case 'rotate':
                    rotateObject(dragDelta);
                    break;
            }
            dragStart.copy(dragEnd);
        }
    } else if (isVertexEditMode && selectedVertex && event.buttons === 1) {
        event.preventDefault();

        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1
        );

        raycaster.setFromCamera(mouse, camera);

        const planeNormal = camera.getWorldDirection(new THREE.Vector3());
        const plane = new THREE.Plane(planeNormal, 0);
        const intersectionPoint = new THREE.Vector3();

        if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
            const worldMatrix = extrudedShape.matrixWorld;
            const inverseMatrix = new THREE.Matrix4().copy(worldMatrix).invert();
            
            const localIntersectionPoint = intersectionPoint.applyMatrix4(inverseMatrix);
            const localMarkerPosition = selectedVertex.marker.position.clone().applyMatrix4(inverseMatrix);
            
            const delta = new THREE.Vector3().subVectors(localIntersectionPoint, localMarkerPosition);
            
            moveVertex(delta);
        }
    }
}

function groupUniqueVertices(geometry) {
    const positionAttribute = geometry.attributes.position;
    const uniqueVertices = [];
    const vertexGroups = [];

    for (let i = 0; i < positionAttribute.count; i++) {
        const vertex = new THREE.Vector3(
            positionAttribute.getX(i),
            positionAttribute.getY(i),
            positionAttribute.getZ(i)
        );

        let found = false;

        for (let j = 0; j < uniqueVertices.length; j++) {
            if (vertex.distanceTo(uniqueVertices[j]) < 0.01) {
                vertexGroups[j].push(i);
                found = true;
                break;
            }
        }

        if (!found) {
            uniqueVertices.push(vertex);
            vertexGroups.push([i]);
        }
    }

    return vertexGroups;
}

function moveGroupedVertex(group, delta) {
    const positionAttribute = extrudedShape.geometry.attributes.position;

    // Move all vertices in the group by the same delta
    group.forEach(index => {
        positionAttribute.setXYZ(
            index,
            positionAttribute.getX(index) + delta.x,
            positionAttribute.getY(index) + delta.y,
            positionAttribute.getZ(index) + delta.z
        );
    });

    // Mark the geometry as needing an update
    positionAttribute.needsUpdate = true;
}

function moveVertex(delta) {
    if (!selectedVertex || !extrudedShape) {
        console.warn('No vertex selected or extrudedShape not found.');
        return;
    }

    const vertexGroup = selectedVertex.group;
    const positionAttribute = extrudedShape.geometry.attributes.position;

    // Move the entire group of vertices
    moveGroupedVertex(vertexGroup, delta);

    // Update the geometry
    extrudedShape.geometry.computeBoundingSphere();
    extrudedShape.geometry.computeBoundingBox();
    extrudedShape.geometry.attributes.position.needsUpdate = true;

    // Update vertex markers
    updateVertexMarkers();
}

function updateMoveControls() {
    if (!extrudedShape) return;

    // Calculate the center of the object
    const boundingBox = new THREE.Box3().setFromObject(extrudedShape);
    objectCenter = boundingBox.getCenter(new THREE.Vector3());

    if (moveArrows) {
        moveArrows.position.copy(objectCenter);
    }
    if (rotateCircles) {
        rotateCircles.position.copy(objectCenter);
    }
}

function translateObject(delta) {
    // Only apply translation on the X and Y axes (ground plane)
    extrudedShape.position.x += delta.x;
    extrudedShape.position.y += delta.y;
    // Z position remains unchanged
    updateMoveControls();
    updateVertexMarkers();
}

function rotateObject(delta) {
    // Create a rotation quaternion
    const rotationX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), delta.y * 0.01);
    const rotationY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), delta.x * 0.01);
    const rotation = new THREE.Quaternion().multiplyQuaternions(rotationY, rotationX);

    // Apply rotation around the object's center
    extrudedShape.position.sub(objectCenter);
    extrudedShape.position.applyQuaternion(rotation);
    extrudedShape.position.add(objectCenter);
    extrudedShape.quaternion.premultiply(rotation);

    updateMoveControls();
    updateVertexMarkers();
}

function resetOrbitControls() {
    controls.enabled = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.update();
}

function cancelMove3D() {
    if (isMoveMode) {
        toggleMoveMode();
    }
    moveMode = null;
    resetOrbitControls();
    updateStatusBar('3D move cancelled');
    updateNavigationInstructions();
}

function updateNavigationInstructions() {
    const navInstructions = document.getElementById('navigation-instructions');
    let instructions = `
        <p>Pan: Right mouse button + drag</p>
        <p>Zoom: Mouse wheel</p>
        <p>Rotate: Left mouse button + drag</p>
        <p>Press ESC to cancel</p>
    `;
    navInstructions.innerHTML = instructions;

    // Update the move mode instructions
    const moveModeInstructions = document.getElementById('move-mode-instructions');
    if (isMoveMode) {
        moveModeInstructions.innerHTML = `
            <p>Press 'T' for translate mode</p>
            <p>Press 'R' for rotate mode</p>
        `;
        moveModeInstructions.style.display = 'block';
    } else {
        moveModeInstructions.style.display = 'none';
    }

    if (isVertexEditMode) {
        navInstructions.innerHTML += `
            <p>Vertex Edit Mode Active</p>
        `;
    }
}

function move3DObject(newPosition) {
    const movementSpeed = 0.1;
    if (isWithinGridBounds(newPosition)) {
        extrudedShape.position.lerp(newPosition, movementSpeed);
        updateGeometryAndMarkers();
    } else {
        alert('Cannot move object outside the grid'); // Error popup added
        updateStatusBar('Cannot move object outside the grid');
    }
}

function isWithinGridBounds(position) {
    const gridSize = 1000;  // This should match the size in addGrid() function
    const halfGrid = gridSize / 2;
    return Math.abs(position.x) <= halfGrid && 
           Math.abs(position.y) <= halfGrid &&
           position.z >= 0 && position.z <= gridSize;  // Assuming the grid goes from 0 to gridSize in Z direction
}

function getIntersects(x, y, targetPlane) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
        ((x - rect.left) / rect.width) * 2 - 1,
        -((y - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);
    
    if (isVertexEditMode) {
        // Check intersections with vertex markers
        return raycaster.intersectObjects(vertexMarkers);
    } else if (targetPlane) {
        const intersectPoint = new THREE.Vector3();
        const hasIntersection = raycaster.ray.intersectPlane(targetPlane, intersectPoint);
        return hasIntersection ? [{ point: intersectPoint }] : [];
    } else {
        // Create a plane at the object's current height
        const objectPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -extrudedShape.position.z);
        const intersectPoint = new THREE.Vector3();
        const hasIntersection = raycaster.ray.intersectPlane(objectPlane, intersectPoint);
        return hasIntersection ? [{ point: intersectPoint }] : [];
    }
}

function toggleVertexEditMode() {
    
    isVertexEditMode = !isVertexEditMode;
    const vertexEditBtn = document.getElementById('vertex-edit-btn');
    
    if (isVertexEditMode) {
        vertexEditBtn.classList.add('active');
        showVertices();
        enterEditMode();
        controls.enabled = false; // Disable orbital controls
    } else {
        vertexEditBtn.classList.remove('active');
        hideVertices();
        exitEditMode();
        resetOrbitControls(); // Re-enable orbital controls
    }
    
    updateNavigationInstructions();
}

function enterEditMode() {
    if (!extrudedShape) return;
    originalMaterial = extrudedShape.material;
    editModeMaterial = new THREE.MeshBasicMaterial({
        color: 0x4682B4, // Changed from 0x00ff00 to Steel Blue
        transparent: true,
        opacity: 0.5
    });
    extrudedShape.material = editModeMaterial;
}

function exitEditMode() {
    if (!extrudedShape || !originalMaterial) return;
    extrudedShape.material = originalMaterial;
}

function showVertices() {
    if (!extrudedShape) return;

    const geometry = extrudedShape.geometry;
    vertexGroups = groupUniqueVertices(geometry);

    const positionAttribute = geometry.getAttribute('position');

    // Create markers for each unique vertex
    vertexGroups.forEach((group, groupIndex) => {
        const vertexIndex = group[0]; // Use the first vertex in the group as representative
        const vertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, vertexIndex);
        vertex.applyMatrix4(extrudedShape.matrixWorld);
        const marker = createVertexMarker(vertex, groupIndex);
        vertexMarkers.push(marker);
        scene.add(marker);
    });

    console.log(`Number of unique vertices: ${vertexGroups.length}`);
    
    // Update markers immediately after creation
    updateVertexMarkers();
}

function createVertexMarker(position, groupIndex) {
    const geometry = new THREE.SphereGeometry(2, 32, 32); // Increased size from 0.5 to 2
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(position);

    // Attach the group index to the marker
    marker.userData = { groupIndex: groupIndex };

    return marker;
}

function hideVertices() {
    vertexMarkers.forEach(marker => {
        scene.remove(marker); // Remove from scene
    });
    vertexMarkers = [];
}

function updateVertexMarkers() {
    if (!isVertexEditMode || !extrudedShape) return;

    const positionAttribute = extrudedShape.geometry.attributes.position;
    const worldMatrix = extrudedShape.matrixWorld;

    vertexGroups.forEach((group, groupIndex) => {
        const vertexIndex = group[0]; // Use the first vertex in the group as representative
        const vertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, vertexIndex);
        
        // Apply the object's world transform to the vertex position
        vertex.applyMatrix4(worldMatrix);
        
        const marker = vertexMarkers[groupIndex];
        if (marker) {
            marker.position.copy(vertex);
            
            // Scale the marker based on the camera distance
            const distance = camera.position.distanceTo(vertex);
            const scale = Math.max(distance / 500, 0.1); // Adjusted scaling factor and added minimum scale
            marker.scale.set(scale, scale, scale);
        }

    });
}

// Call this function after any transformation of the extrudedShape
function updateGeometryAndMarkers() {
    if (!extrudedShape) return;

    // Update the geometry
    extrudedShape.geometry.computeBoundingSphere();
    extrudedShape.geometry.computeBoundingBox();

    // Update the world matrix of the extruded shape
    extrudedShape.updateMatrixWorld(true);

    // Update vertex markers
    updateVertexMarkers();
}

function cancelVertexEditMode() {
    if (isVertexEditMode) {
        toggleVertexEditMode();
        updateStatusBar('Vertex edit mode cancelled');
        resetOrbitControls(); // Ensure orbital controls are reset when cancelling
    }
}

// Make functions and variables available globally
window.startExtrude = startExtrude;
window.resetToHomeView = resetToHomeView;
window.toggleMoveMode = toggleMoveMode;
window.getIntersects = getIntersects;
window.cancelMove3D = cancelMove3D;
window.isWithinGridBounds = isWithinGridBounds;
window.move3DObject = move3DObject;
window.onKeyDown = onKeyDown;
window.onMouseDown3D = onMouseDown3D;
window.onMouseMove3D = onMouseMove3D;
window.toggleVertexEditMode = toggleVertexEditMode;
window.cancelVertexEditMode = cancelVertexEditMode;

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (isVertexEditMode) updateVertexMarkers();
    renderer.render(scene, camera);
}

// Add this function to show 3D mode buttons before extrusion
function showExtrudeButtons() {
    document.getElementById('extrudeBtn').style.display = 'block';
}

// Make showExtrudeButtons available globally
window.showExtrudeButtons = showExtrudeButtons;