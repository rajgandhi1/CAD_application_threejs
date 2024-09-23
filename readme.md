# 3D Shape Editor

## Overview
This project is a web-based 3D shape editor that allows users to create, extrude, and manipulate 3D shapes. It provides features such as vertex editing, object translation, and rotation in a 3D space.

## Features
- 2D shape drawing
- 3D shape extrusion
- Vertex editing
- Object translation and rotation
- Grid-based movement restrictions

## Technologies Used
- HTML5
- CSS3
- JavaScript
- Three.js for 3D rendering

## Demo
[Demo](https://rajgandhi1.github.io/CAD_application_threejs/)

## Setup and Running the Project

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A local web server (e.g., Python's `http.server`, Node.js `http-server`, or any other of your choice)

### Steps to Run
1. Clone this repository or download the project files.
2. Navigate to the project root directory in your terminal.
3. Start a local web server. For example, if you have Python installed:
   - For Python 3.x: `python -m http.server 8000`
   - For Python 2.x: `python -m SimpleHTTPServer 8000`
4. Open your web browser and go to `http://localhost:8000`

### Usage
1. Use the drawing tools to create a 2D shape.
2. Click the "Extrude" button to create a 3D shape.
3. Use the toolbar buttons to switch between different modes:
   - Home View: Reset the camera to the initial position
   - Move: Toggle translation and rotation mode
   - Edit Vertices: Enter vertex editing mode
4. In Move mode:
   - Press 'T' for translation
   - Press 'R' for rotation
5. In Edit Vertices mode, click and drag vertices to modify the shape.
6. Use mouse controls for camera navigation:
   - Left click + drag: Rotate view
   - Right click + drag: Pan view
   - Scroll wheel: Zoom in/out

## Created By
Raj Gandhi

## License
MIT License

Copyright (c) 2023 Raj Gandhi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
