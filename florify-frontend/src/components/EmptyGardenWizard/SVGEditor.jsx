import React, { useState, useRef, useEffect } from 'react';
import { BlueprintModel } from './BlueprintModel';

const SVGEditor = ({ blueprintModel, onBlueprintChange, mode = 'view' }) => {
  const svgRef = useRef(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [dragState, setDragState] = useState(null);

  // Convert mm to SVG pixels
  const mmToPixels = (mm) => mm * 3.78;
  
  // Convert SVG pixels to mm
  const pixelsToMm = (pixels) => pixels / 3.78;

  // Get mouse position relative to SVG
  const getMousePosition = (event) => {
    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y };
  };

  // Handle mouse down for drawing
  const handleMouseDown = (e) => {
    if (mode !== 'draw') return;
    
    const { x, y } = getMousePosition(e);
    const mmPos = { x: pixelsToMm(x), y: pixelsToMm(y) };
    
    if (event.button === 0) { // Left click
      setIsDrawing(true);
      setCurrentPath([mmPos]);
    }
  };

  // Handle mouse move for drawing
  const handleMouseMove = (event) => {
    if (!isDrawing || mode !== 'draw') return;
    
    const { x, y } = getMousePosition(event);
    const mmPos = { x: pixelsToMm(x), y: pixelsToMm(y) };
    
    setCurrentPath(prev => [...prev, mmPos]);
  };

  // Handle mouse up to finish drawing
  const handleMouseUp = (event) => {
    if (!isDrawing || mode !== 'draw') return;
    
    setIsDrawing(false);
    
    if (currentPath.length > 1) {
      const newShape = {
        type: 'polyline',
        role: 'pathway',
        points: currentPath,
        style: {
          stroke: '#7f8c8d',
          weight_mm: 0.6,
          fill: 'none'
        }
      };
      
      blueprintModel.addShape(newShape);
      onBlueprintChange(blueprintModel.toJSON());
    }
    
    setCurrentPath([]);
  };

  // Handle shape selection
  const handleShapeClick = (e, shapeId) => {
    e.stopPropagation();
    setSelectedShape(shapeId);
  };

  // Handle shape dragging
  const handleShapeMouseDown = (event, shapeId) => {
    if (mode !== 'edit') return;
    
    event.stopPropagation();
    setSelectedShape(shapeId);
    
    const { x, y } = getMousePosition(event);
    setDragState({
      shapeId,
      startX: x,
      startY: y,
      startPoints: [...blueprintModel.getShape(shapeId).points]
    });
  };

  // Add event listeners for dragging
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMoveDrag = (event) => {
      if (mode !== 'edit') return;
      
      const { x, y } = getMousePosition(event);
      const deltaX = pixelsToMm(x - dragState.startX);
      const deltaY = pixelsToMm(y - dragState.startY);
      
      const newPoints = dragState.startPoints.map(point => ({
        x: point.x + deltaX,
        y: point.y + deltaY
      }));
      
      blueprintModel.updateShape(dragState.shapeId, { points: newPoints });
      onBlueprintChange(blueprintModel.toJSON());
    };

    const handleMouseUpDrag = () => {
      setDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMoveDrag);
    document.addEventListener('mouseup', handleMouseUpDrag);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveDrag);
      document.removeEventListener('mouseup', handleMouseUpDrag);
    };
  }, [dragState, mode, blueprintModel, onBlueprintChange]);

  // Render a shape as SVG element
  const renderShape = (shape) => {
    const points = shape.points.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    const isSelected = selectedShape === shape.id;
    
    const commonProps = {
      key: shape.id,
      stroke: shape.style.stroke,
      strokeWidth: mmToPixels(shape.style.weight_mm),
      fill: shape.style.fill || 'none',
      className: `shape ${isSelected ? 'selected' : ''}`,
      onClick: (e) => handleShapeClick(e, shape.id),
      onMouseDown: (e) => handleShapeMouseDown(e, shape.id),
      style: {
        cursor: mode === 'edit' ? 'move' : 'pointer'
      }
    };

    switch (shape.type) {
      case 'polyline':
        return (
          <polyline
            {...commonProps}
            points={points}
          />
        );
      case 'polygon':
        return (
          <polygon
            {...commonProps}
            points={points}
          />
        );
      case 'rect': {
        const rect = shape.points[0];
        const width = Math.abs(shape.points[1].x - shape.points[0].x);
        const height = Math.abs(shape.points[1].y - shape.points[0].y);
        return (
          <rect
            {...commonProps}
            x={mmToPixels(rect.x)}
            y={mmToPixels(rect.y)}
            width={mmToPixels(width)}
            height={mmToPixels(height)}
          />
        );
      }
      default:
        return null;
    }
  };

  // Render openings (doors, gates)
  const renderOpenings = (shape) => {
    if (!shape.openings || shape.openings.length === 0) return null;
    
    return shape.openings.map((opening, index) => {
      const start = opening.start;
      const end = opening.end;
      
      return (
        <line
          key={`${shape.id}-opening-${index}`}
          x1={mmToPixels(start[0])}
          y1={mmToPixels(start[1])}
          x2={mmToPixels(end[0])}
          y2={mmToPixels(end[1])}
          stroke="#e74c3c"
          strokeWidth={mmToPixels(0.3)}
          strokeDasharray="2,2"
          className="opening"
        />
      );
    });
  };

  // Render current drawing path
  const renderCurrentPath = () => {
    if (currentPath.length < 2) return null;
    
    const points = currentPath.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    
    return (
      <polyline
        points={points}
        stroke="#3498db"
        strokeWidth={mmToPixels(0.6)}
        fill="none"
        strokeDasharray="3,3"
        className="current-path"
      />
    );
  };

  return (
    <div className="svg-editor">
      <svg
        ref={svgRef}
        viewBox={blueprintModel.getViewBox()}
        width="100%"
        height="100%"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="blueprint-svg"
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Render all shapes */}
        {blueprintModel.data.shapes.map(shape => (
          <g key={shape.id}>
            {renderShape(shape)}
            {renderOpenings(shape)}
          </g>
        ))}
        
        {/* Render current drawing path */}
        {renderCurrentPath()}
      </svg>
      
      {/* Mode indicator */}
      <div className="mode-indicator">
        Mode: {mode === 'view' ? 'View' : mode === 'edit' ? 'Edit' : 'Draw'}
      </div>
    </div>
  );
};

export default SVGEditor;