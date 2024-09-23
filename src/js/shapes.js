function isWithinGridBounds(point) {
    const gridSize = 1000;  // This should match the size in addGrid() function
    const halfGrid = gridSize / 2;
    if (Math.abs(point.x) > halfGrid || Math.abs(point.y) > halfGrid) {
        alert("Cannot draw outside the grid");
        return false;
    }
    return true;
}

function startDrawing(point) {
    if (!isWithinGridBounds(point)) {
        return;
    }
    isDrawing = true;
    startPoint = point;
    updateStatusBar(`Starting ${currentTool}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`);
    if (currentTool === 'polygon') {
        vertices = [point];
        addVertexMarker(point);
    }
    updateShapeGuide(point);
}

function endDrawing(point) {
    if (!startPoint) return;
    endPoint = point;
    drawShape();
    resetDrawing();
    updateStatusBar(`${currentTool} completed`);
}

function updateShapeGuide(currentPoint) {
    currentPoint = clampToGrid(currentPoint);
    guideLine.geometry.dispose();
    switch (currentTool) {
        case 'rectangle':
        case 'square':
            const points = createRectanglePoints(startPoint, currentPoint, currentTool === 'square');
            guideLine.geometry = new THREE.BufferGeometry().setFromPoints(points);
            break;
        case 'circle':
            guideLine.geometry = createCircleGeometry(startPoint, currentPoint);
            break;
        case 'polygon':
            const polygonPoints = [...vertices, currentPoint];
            guideLine.geometry = new THREE.BufferGeometry().setFromPoints(polygonPoints);
            break;
    }
    guideLine.visible = true;
}

function drawShape() {
    let shape;
    switch (currentTool) {
        case 'rectangle':
        case 'square':
            shape = createRectangle(startPoint, endPoint, currentTool === 'square');
            break;
        case 'circle':
            shape = createCircle(startPoint, endPoint);
            break;
        case 'polygon':
            finishPolygon();
            return;
    }
    if (shape) shapeGroup.add(shape);
}

function createRectanglePoints(start, end, isSquare) {
    end = clampToGrid(end);
    if (isSquare) {
        const size = Math.min(
            Math.abs(end.x - start.x),
            Math.abs(end.y - start.y),
            1000 - Math.abs(start.x),
            1000 - Math.abs(start.y)
        );
        end = new THREE.Vector3(
            start.x + Math.sign(end.x - start.x) * size,
            start.y + Math.sign(end.y - start.y) * size,
            0
        );
    }
    return [
        start,
        new THREE.Vector3(end.x, start.y, 0),
        end,
        new THREE.Vector3(start.x, end.y, 0),
        start
    ];
}

function createRectangle(start, end, isSquare) {
    const points = createRectanglePoints(start, end, isSquare);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const rectangle = new THREE.Line(geometry, material);
    addVertexMarkers(rectangle, points);
    return rectangle;
}

function createCircleGeometry(center, point) {
    point = clampToGrid(point);
    const radius = Math.min(
        center.distanceTo(point),
        500 - Math.abs(center.x),
        500 - Math.abs(center.y)
    );
    const curve = new THREE.EllipseCurve(
        center.x, center.y,
        radius, radius,
        0, 2 * Math.PI,
        false,
        0
    );
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
}

function createCircle(center, point) {
    const geometry = createCircleGeometry(center, point);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const circle = new THREE.Line(geometry, material);
    addVertexMarkers(circle, [center]);
    return circle;
}

function addVertexMarkers(shape, points) {
    points.forEach(point => {
        const markerGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(point);
        shape.add(marker);
    });
}

function resetDrawing() {
    isDrawing = false;
    guideLine.geometry.dispose();
    guideLine.geometry = new THREE.BufferGeometry();
    guideLine.visible = false;
}

function clearShapes() {
    while (shapeGroup.children.length > 0) {
        shapeGroup.remove(shapeGroup.children[0]);
    }
    updateStatusBar('All shapes cleared');
    engagePolygonTool();
}

function disengagePolygonTool() {
    currentTool = null;
    document.getElementById('polygonBtn').classList.remove('active');
    updateHelpPanel('');
}

function engagePolygonTool() {
    currentTool = 'polygon';
    document.getElementById('polygonBtn').classList.add('active');
    updateHelpPanel(helpTexts['polygon']);
}

function addVertexMarker(point) {
    const markerGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(point);
    shapeGroup.add(marker);
}

function addPolygonPoint(point) {
    if (!isWithinGridBounds(point)) {
        return;
    }
    if (isCloseToFirstPoint(point) && vertices.length > 2) {
        finishPolygon();
    } else {
        vertices.push(point);
        addVertexMarker(point);
        updateShapeGuide(point);
        updateStatusBar(`Added point: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`);
    }
}

function isCloseToFirstPoint(point) {
    if (vertices.length === 0) return false;
    const firstPoint = vertices[0];
    const distance = point.distanceTo(firstPoint);
    return distance < 0.1; // Adjust this threshold as needed
}

function finishPolygon() {
    if (vertices.length < 3) {
        updateStatusBar('A polygon must have at least 3 points');
        return;
    }

    vertices.push(vertices[0]); // Close the polygon
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const polygon = new THREE.Line(geometry, material);
    shapeGroup.add(polygon);
    resetDrawing();
    updateStatusBar('Polygon completed');
    disengagePolygonTool();
    if (typeof showExtrudeButtons === 'function') {
        showExtrudeButtons();
    } else {
        console.error('showExtrudeButtons is not defined. Check if 3d.js is loaded correctly.');
    }
}

// Make functions available globally
window.startDrawing = startDrawing;
window.addPolygonPoint = addPolygonPoint;
window.updateShapeGuide = updateShapeGuide;
window.finishPolygon = finishPolygon;
window.resetDrawing = resetDrawing;
window.clearShapes = clearShapes;
window.disengagePolygonTool = disengagePolygonTool;
window.engagePolygonTool = engagePolygonTool;
window.isWithinGridBounds = isWithinGridBounds;

function clampToGrid(point) {
    const gridSize = 1000;
    const halfGrid = gridSize / 2;
    return new THREE.Vector3(
        Math.max(-halfGrid, Math.min(halfGrid, point.x)),
        Math.max(-halfGrid, Math.min(halfGrid, point.y)),
        0
    );
}

// Make sure to add clampToGrid to the global exports
window.clampToGrid = clampToGrid;