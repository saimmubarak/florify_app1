import React, { useState, useRef, useEffect, useCallback } from 'react';

const BlueprintEditor = ({ blueprintData, onBlueprintUpdate, mode = 'edit' }) => {
  const svgRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize] = useState(10); // 10mm grid

  // Convert mm to SVG units (1mm = 1 SVG unit for simplicity)
  const mmToSvg = (mm) => mm;
  const svgToMm = (svg) => svg;

  // Snap to grid function
  const snapToGridValue = (value) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Get mouse position relative to SVG
  const getMousePosition = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = blueprintData.page.width_mm / rect.width;
    const scaleY = blueprintData.page.height_mm / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    return {
      x: snapToGridValue(x),
      y: snapToGridValue(y)
    };
  };

  // Handle mouse down
  const handleMouseDown = (e) => {
    const pos = getMousePosition(e);
    
    if (selectedTool === 'select') {
      // Check if clicking on existing shape
      const clickedShape = findShapeAtPosition(pos);
      if (clickedShape) {
        setSelectedShape(clickedShape);
        setDragStart(pos);
        setIsDragging(true);
      } else {
        setSelectedShape(null);
      }
    } else if (selectedTool === 'polyline' || selectedTool === 'polygon') {
      if (!isDrawing) {
        setCurrentPath([pos]);
        setIsDrawing(true);
      } else {
        setCurrentPath(prev => [...prev, pos]);
      }
    } else if (selectedTool === 'property-line') {
      if (!isDrawing) {
        setCurrentPath([pos]);
        setIsDrawing(true);
      } else {
        // Complete the line
        const newShape = {
          id: `property-line-${Date.now()}`,
          type: 'polyline',
          role: 'property-line',
          points: [...currentPath, pos],
          style: { stroke: '#95a5a6', strokeWidth: 1, strokeDasharray: '3,3' }
        };
        
        onBlueprintUpdate([...blueprintData.shapes, newShape]);
        setCurrentPath([]);
        setIsDrawing(false);
      }
    } else if (selectedTool === 'pathway') {
      if (!isDrawing) {
        setCurrentPath([pos]);
        setIsDrawing(true);
      } else {
        setCurrentPath(prev => [...prev, pos]);
      }
    }
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    const pos = getMousePosition(e);
    
    if (isDragging && selectedShape && dragStart) {
      // Calculate offset and move shape
      const offsetX = pos.x - dragStart.x;
      const offsetY = pos.y - dragStart.y;
      
      const updatedShapes = blueprintData.shapes.map(shape => {
        if (shape.id === selectedShape.id) {
          return {
            ...shape,
            points: shape.points.map(point => [
              point[0] + offsetX,
              point[1] + offsetY
            ])
          };
        }
        return shape;
      });
      
      onBlueprintUpdate(updatedShapes);
      setDragStart(pos);
    }
  };

  // Handle mouse up
  const handleMouseUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
    }
  };

  // Handle double click to finish drawing
  const handleDoubleClick = (e) => {
    if (isDrawing && (selectedTool === 'polyline' || selectedTool === 'polygon' || selectedTool === 'pathway')) {
      if (currentPath.length >= 2) {
        const newShape = {
          id: `${selectedTool}-${Date.now()}`,
          type: selectedTool === 'polygon' ? 'polygon' : 'polyline',
          role: selectedTool === 'pathway' ? 'pathway' : 'driveway',
          points: selectedTool === 'polygon' ? [...currentPath, currentPath[0]] : currentPath,
          style: selectedTool === 'pathway' ? 
            { stroke: '#7f8c8d', strokeWidth: 2 } : 
            { stroke: '#34495e', strokeWidth: 3 }
        };
        
        onBlueprintUpdate([...blueprintData.shapes, newShape]);
        setCurrentPath([]);
        setIsDrawing(false);
      }
    }
  };

  // Find shape at position
  const findShapeAtPosition = (pos) => {
    return blueprintData.shapes.find(shape => {
      if (shape.type === 'polygon') {
        return isPointInPolygon(pos, shape.points);
      } else if (shape.type === 'polyline') {
        return isPointNearPolyline(pos, shape.points, 5); // 5mm tolerance
      }
      return false;
    });
  };

  // Point in polygon test
  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i][1] > point.y) !== (polygon[j][1] > point.y)) &&
          (point.x < (polygon[j][0] - polygon[i][0]) * (point.y - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0])) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Point near polyline test
  const isPointNearPolyline = (point, polyline, tolerance) => {
    for (let i = 0; i < polyline.length - 1; i++) {
      const dist = distanceToLineSegment(point, polyline[i], polyline[i + 1]);
      if (dist <= tolerance) return true;
    }
    return false;
  };

  // Distance to line segment
  const distanceToLineSegment = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart[0];
    const B = point.y - lineStart[1];
    const C = lineEnd[0] - lineStart[0];
    const D = lineEnd[1] - lineStart[1];

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart[0];
      yy = lineStart[1];
    } else if (param > 1) {
      xx = lineEnd[0];
      yy = lineEnd[1];
    } else {
      xx = lineStart[0] + param * C;
      yy = lineStart[1] + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Delete selected shape
  const deleteSelectedShape = () => {
    if (selectedShape) {
      const updatedShapes = blueprintData.shapes.filter(shape => shape.id !== selectedShape.id);
      onBlueprintUpdate(updatedShapes);
      setSelectedShape(null);
    }
  };

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedShape) {
        deleteSelectedShape();
      } else if (e.key === 'Escape') {
        setSelectedShape(null);
        setIsDrawing(false);
        setCurrentPath([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedShape]);

  // Render grid
  const renderGrid = () => {
    if (!snapToGrid) return null;
    
    const lines = [];
    const { width_mm, height_mm } = blueprintData.page;
    
    // Vertical lines
    for (let x = 0; x <= width_mm; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height_mm}
          stroke="#e0e0e0"
          strokeWidth="0.5"
          opacity="0.5"
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= height_mm; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width_mm}
          y2={y}
          stroke="#e0e0e0"
          strokeWidth="0.5"
          opacity="0.5"
        />
      );
    }
    
    return lines;
  };

  // Render shapes
  const renderShapes = () => {
    return blueprintData.shapes.map(shape => {
      const isSelected = selectedShape && selectedShape.id === shape.id;
      const style = {
        ...shape.style,
        strokeWidth: isSelected ? (shape.style.strokeWidth || 2) + 1 : shape.style.strokeWidth || 2,
        stroke: isSelected ? '#e74c3c' : shape.style.stroke || '#000'
      };

      if (shape.type === 'polygon') {
        return (
          <polygon
            key={shape.id}
            points={shape.points.map(([x, y]) => `${x},${y}`).join(' ')}
            fill={shape.style.fill || 'none'}
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            strokeDasharray={shape.style.strokeDasharray}
            onClick={() => setSelectedShape(shape)}
            style={{ cursor: 'pointer' }}
          />
        );
      } else if (shape.type === 'polyline') {
        return (
          <polyline
            key={shape.id}
            points={shape.points.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke={style.stroke}
            strokeWidth={style.strokeWidth}
            strokeDasharray={shape.style.strokeDasharray}
            onClick={() => setSelectedShape(shape)}
            style={{ cursor: 'pointer' }}
          />
        );
      }
      return null;
    });
  };

  // Render current drawing path
  const renderCurrentPath = () => {
    if (!isDrawing || currentPath.length === 0) return null;
    
    const points = currentPath.map(([x, y]) => `${x},${y}`).join(' ');
    
    if (selectedTool === 'polygon') {
      return (
        <polygon
          points={points}
          fill="none"
          stroke="#e74c3c"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      );
    } else {
      return (
        <polyline
          points={points}
          fill="none"
          stroke="#e74c3c"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
      );
    }
  };

  // Render openings for house fronts
  const renderOpenings = () => {
    return blueprintData.shapes
      .filter(shape => shape.role === 'houseFront' && shape.openings)
      .map(shape => 
        shape.openings.map((opening, index) => (
          <line
            key={`${shape.id}-opening-${index}`}
            x1={opening.start[0]}
            y1={opening.start[1]}
            x2={opening.end[0]}
            y2={opening.end[1]}
            stroke={opening.type === 'door' ? '#f39c12' : '#3498db'}
            strokeWidth="3"
            style={{ cursor: 'pointer' }}
          />
        ))
      );
  };

  const tools = [
    { id: 'select', name: 'Select', icon: '↖' },
    { id: 'polyline', name: 'Polyline', icon: '📏' },
    { id: 'polygon', name: 'Polygon', icon: '⬟' },
    { id: 'property-line', name: 'Property Line', icon: '📐' },
    { id: 'pathway', name: 'Pathway', icon: '🛤️' }
  ];

  return (
    <div className="blueprint-editor">
      <div className="editor-toolbar">
        <div className="tool-group">
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`tool-btn ${selectedTool === tool.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedTool(tool.id);
                setIsDrawing(false);
                setCurrentPath([]);
                setSelectedShape(null);
              }}
              title={tool.name}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-name">{tool.name}</span>
            </button>
          ))}
        </div>
        
        <div className="tool-group">
          <label className="tool-option">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
            />
            Snap to Grid
          </label>
        </div>
        
        {selectedShape && (
          <div className="tool-group">
            <button
              className="tool-btn danger"
              onClick={deleteSelectedShape}
              title="Delete Selected"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      <div className="editor-canvas">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${blueprintData.page.width_mm} ${blueprintData.page.height_mm}`}
          width="100%"
          height="600"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          style={{ border: '1px solid #ddd', background: '#fff' }}
        >
          {/* Grid */}
          {renderGrid()}
          
          {/* Shapes */}
          {renderShapes()}
          
          {/* Openings */}
          {renderOpenings()}
          
          {/* Current drawing path */}
          {renderCurrentPath()}
        </svg>
      </div>

      <div className="editor-instructions">
        {selectedTool === 'select' && (
          <p>Click and drag to move shapes. Press Delete to remove selected shape.</p>
        )}
        {(selectedTool === 'polyline' || selectedTool === 'polygon' || selectedTool === 'pathway') && (
          <p>Click to add points. Double-click to finish drawing.</p>
        )}
        {selectedTool === 'property-line' && (
          <p>Click to start line, click again to finish.</p>
        )}
      </div>
    </div>
  );
};

export default BlueprintEditor;