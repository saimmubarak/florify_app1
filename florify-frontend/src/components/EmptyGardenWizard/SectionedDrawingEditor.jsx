import React, { useState, useRef, useEffect } from 'react';

const SectionedDrawingEditor = ({ blueprintModel, onBlueprintChange }) => {
  const svgRef = useRef(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [drawingTool, setDrawingTool] = useState('line');

  const sections = [
    {
      id: 'buildings',
      title: 'Draw Buildings',
      description: 'Draw the outline of your house and other buildings',
      color: '#e74c3c',
      role: 'building'
    },
    {
      id: 'pathways',
      title: 'Draw Pathways',
      description: 'Draw driveways, walkways, and paths',
      color: '#7f8c8d',
      role: 'pathway'
    },
    {
      id: 'walls',
      title: 'Draw Boundary Walls',
      description: 'Draw walls and fences around your property',
      color: '#8e44ad',
      role: 'boundary'
    }
  ];

  // Convert mm to SVG pixels
  const mmToPixels = (mm) => mm * 3.78;
  
  // Convert SVG pixels to mm
  const pixelsToMm = (pixels) => pixels / 3.78;

  // Get mouse position relative to SVG
  const getMousePosition = (event) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    
    const rect = svgRef.current.getBoundingClientRect();
    const svg = svgRef.current;
    const viewBox = svg.getAttribute('viewBox');
    
    if (viewBox) {
      const [minX, minY, width, height] = viewBox.split(' ').map(Number);
      const x = ((event.clientX - rect.left) / rect.width) * width + minX;
      const y = ((event.clientY - rect.top) / rect.height) * height + minY;
      return { x, y };
    } else {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y };
    }
  };

  // Handle mouse down for drawing
  const handleMouseDown = (event) => {
    const { x, y } = getMousePosition(event);
    const mmPos = { x: pixelsToMm(x), y: pixelsToMm(y) };
    
    if (event.button === 0) { // Left click
      setIsDrawing(true);
      setCurrentPath([mmPos]);
    }
  };

  // Handle mouse move for drawing
  const handleMouseMove = (event) => {
    const { x, y } = getMousePosition(event);
    setMousePos({ x, y });
    
    if (isDrawing) {
      const mmPos = { x: pixelsToMm(x), y: pixelsToMm(y) };
      
      if (drawingTool === 'line') {
        setCurrentPath([currentPath[0], mmPos]);
      } else if (drawingTool === 'rectangle') {
        const start = currentPath[0];
        setCurrentPath([start, { x: mmPos.x, y: start.y }, mmPos, { x: start.x, y: mmPos.y }, start]);
      } else if (drawingTool === 'polygon') {
        setCurrentPath(prev => [...prev, mmPos]);
      }
    }
  };

  // Handle mouse up to finish drawing
  const handleMouseUp = (event) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (currentPath.length >= 2) {
      const currentSectionData = sections[currentSection];
      const newShape = {
        type: drawingTool === 'line' ? 'polyline' : 'polygon',
        role: currentSectionData.role,
        points: currentPath,
        style: {
          stroke: currentSectionData.color,
          weight_mm: 0.8,
          fill: drawingTool === 'rectangle' ? `${currentSectionData.color}20` : 'none'
        }
      };
      
      blueprintModel.addShape(newShape);
      onBlueprintChange(blueprintModel.toJSON());
    }
    
    setCurrentPath([]);
  };

  // Handle double click to finish polygon
  const handleDoubleClick = (event) => {
    if (drawingTool === 'polygon' && currentPath.length >= 3) {
      setIsDrawing(false);
      
      const currentSectionData = sections[currentSection];
      const newShape = {
        type: 'polygon',
        role: currentSectionData.role,
        points: currentPath,
        style: {
          stroke: currentSectionData.color,
          weight_mm: 0.8,
          fill: `${currentSectionData.color}20`
        }
      };
      
      blueprintModel.addShape(newShape);
      onBlueprintChange(blueprintModel.toJSON());
      setCurrentPath([]);
    }
  };

  // Render a shape as SVG element
  const renderShape = (shape) => {
    const points = shape.points.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    
    const commonProps = {
      key: shape.id,
      stroke: shape.style.stroke,
      strokeWidth: mmToPixels(shape.style.weight_mm),
      fill: shape.style.fill || 'none',
      className: 'shape'
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
      default:
        return null;
    }
  };

  // Render current drawing path
  const renderCurrentPath = () => {
    if (currentPath.length < 2) return null;
    
    const points = currentPath.map(p => `${mmToPixels(p.x)},${mmToPixels(p.y)}`).join(' ');
    const currentSectionData = sections[currentSection];
    
    return (
      <g>
        {drawingTool === 'line' ? (
          <polyline
            points={points}
            stroke={currentSectionData.color}
            strokeWidth={mmToPixels(0.8)}
            fill="none"
            strokeDasharray="5,5"
            className="current-path"
          />
        ) : (
          <polygon
            points={points}
            stroke={currentSectionData.color}
            strokeWidth={mmToPixels(0.8)}
            fill={`${currentSectionData.color}20`}
            strokeDasharray="5,5"
            className="current-path"
          />
        )}
      </g>
    );
  };

  const currentSectionData = sections[currentSection];
  const canGoNext = currentSection < sections.length - 1;
  const canGoPrevious = currentSection > 0;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentSection(currentSection + 1);
      setCurrentPath([]);
      setIsDrawing(false);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentSection(currentSection - 1);
      setCurrentPath([]);
      setIsDrawing(false);
    }
  };

  const handleFinish = () => {
    // Navigate back to main wizard or show completion
    console.log('Drawing completed!', blueprintModel.toJSON());
  };

  return (
    <div className="sectioned-drawing-editor">
      <div className="drawing-header">
        <div className="section-info">
          <h3 style={{ color: currentSectionData.color, margin: 0 }}>
            {currentSectionData.title}
          </h3>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d' }}>
            {currentSectionData.description}
          </p>
        </div>
        
        <div className="section-progress">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`progress-dot ${index === currentSection ? 'active' : ''} ${index < currentSection ? 'completed' : ''}`}
              style={{ backgroundColor: section.color }}
            />
          ))}
        </div>
      </div>

      <div className="drawing-toolbar">
        <div className="tool-buttons">
          <button 
            className={`tool-btn ${drawingTool === 'line' ? 'active' : ''}`}
            onClick={() => setDrawingTool('line')}
          >
            📏 Line
          </button>
          <button 
            className={`tool-btn ${drawingTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => setDrawingTool('rectangle')}
          >
            ⬜ Rectangle
          </button>
          <button 
            className={`tool-btn ${drawingTool === 'polygon' ? 'active' : ''}`}
            onClick={() => setDrawingTool('polygon')}
          >
            🔷 Polygon
          </button>
        </div>
        
        <div className="mouse-coords">
          {Math.round(pixelsToMm(mousePos.x))}mm, {Math.round(pixelsToMm(mousePos.y))}mm
        </div>
      </div>

      <div className="drawing-canvas">
        <svg
          ref={svgRef}
          viewBox={blueprintModel.getViewBox()}
          width="100%"
          height="100%"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          className="blueprint-svg"
          style={{ cursor: 'crosshair' }}
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
            </g>
          ))}
          
          {/* Render current drawing path */}
          {renderCurrentPath()}
        </svg>
      </div>

      <div className="drawing-instructions">
        <p>
          <strong>{drawingTool === 'line' ? 'Line Tool:' : drawingTool === 'rectangle' ? 'Rectangle Tool:' : 'Polygon Tool:'}</strong>
          {drawingTool === 'line' && ' Click and drag to draw a line'}
          {drawingTool === 'rectangle' && ' Click and drag to draw a rectangle'}
          {drawingTool === 'polygon' && ' Click to add points, double-click to finish'}
        </p>
        <p style={{ color: currentSectionData.color, fontWeight: 'bold' }}>
          Drawing with {currentSectionData.color} color
        </p>
      </div>

      <div className="drawing-navigation">
        <button 
          className="nav-btn prev-btn"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
        >
          ← Previous
        </button>
        
        <div className="section-indicator">
          Step {currentSection + 1} of {sections.length}
        </div>
        
        {canGoNext ? (
          <button 
            className="nav-btn next-btn"
            onClick={handleNext}
          >
            Next →
          </button>
        ) : (
          <button 
            className="nav-btn finish-btn"
            onClick={handleFinish}
          >
            Finish Drawing
          </button>
        )}
      </div>
    </div>
  );
};

export default SectionedDrawingEditor;