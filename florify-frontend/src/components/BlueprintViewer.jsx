import React, { useState, useRef, useEffect } from 'react';

const BlueprintViewer = ({ blueprintData, interactive = false, onShapeClick = null }) => {
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle zoom
  const handleWheel = (e) => {
    if (!interactive) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));
    setZoom(newZoom);
  };

  // Handle pan
  const handleMouseDown = (e) => {
    if (!interactive) return;
    
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+Left
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!interactive || !isPanning) return;
    
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handleMouseUp = () => {
    if (!interactive) return;
    setIsPanning(false);
  };

  // Handle shape click
  const handleShapeClick = (shape, e) => {
    if (interactive && onShapeClick) {
      onShapeClick(shape, e);
    }
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Fit to view
  const fitToView = () => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const bbox = svg.getBBox();
    const container = svg.parentElement;
    
    const scaleX = container.clientWidth / bbox.width;
    const scaleY = container.clientHeight / bbox.height;
    const scale = Math.min(scaleX, scaleY) * 0.9;
    
    setZoom(scale);
    setPan({
      x: (container.clientWidth - bbox.width * scale) / 2 - bbox.x * scale,
      y: (container.clientHeight - bbox.height * scale) / 2 - bbox.y * scale
    });
  };

  // Render grid
  const renderGrid = () => {
    const { width_mm, height_mm } = blueprintData.page;
    const gridSize = 10; // 10mm grid
    const lines = [];
    
    // Vertical lines
    for (let x = 0; x <= width_mm; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height_mm}
          stroke="#f0f0f0"
          strokeWidth="0.5"
          opacity="0.3"
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
          stroke="#f0f0f0"
          strokeWidth="0.5"
          opacity="0.3"
        />
      );
    }
    
    return lines;
  };

  // Render shapes
  const renderShapes = () => {
    return blueprintData.shapes.map(shape => {
      const commonProps = {
        key: shape.id,
        onClick: (e) => handleShapeClick(shape, e),
        style: { cursor: interactive ? 'pointer' : 'default' }
      };

      if (shape.type === 'polygon') {
        return (
          <polygon
            {...commonProps}
            points={shape.points.map(([x, y]) => `${x},${y}`).join(' ')}
            fill={shape.style.fill || 'none'}
            stroke={shape.style.stroke || '#000'}
            strokeWidth={shape.style.strokeWidth || 2}
            strokeDasharray={shape.style.strokeDasharray}
          />
        );
      } else if (shape.type === 'polyline') {
        return (
          <polyline
            {...commonProps}
            points={shape.points.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke={shape.style.stroke || '#000'}
            strokeWidth={shape.style.strokeWidth || 2}
            strokeDasharray={shape.style.strokeDasharray}
          />
        );
      }
      return null;
    });
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
            style={{ cursor: interactive ? 'pointer' : 'default' }}
          />
        ))
      );
  };

  // Render measurements
  const renderMeasurements = () => {
    if (!interactive) return null;
    
    const measurements = [];
    const { width_mm, height_mm } = blueprintData.page;
    
    // Add page dimensions
    measurements.push(
      <text
        key="width-label"
        x={width_mm / 2}
        y={height_mm + 20}
        textAnchor="middle"
        fontSize="12"
        fill="#666"
      >
        {width_mm}mm
      </text>
    );
    
    measurements.push(
      <text
        key="height-label"
        x={width_mm + 20}
        y={height_mm / 2}
        textAnchor="middle"
        fontSize="12"
        fill="#666"
        transform={`rotate(-90, ${width_mm + 20}, ${height_mm / 2})`}
      >
        {height_mm}mm
      </text>
    );
    
    return measurements;
  };

  // Render legend
  const renderLegend = () => {
    const legendItems = [
      { color: '#e74c3c', label: 'House Front', style: 'solid' },
      { color: '#8e44ad', label: 'Boundary Walls', style: 'solid' },
      { color: '#f39c12', label: 'Gates/Doors', style: 'dashed' },
      { color: '#7f8c8d', label: 'Pathways', style: 'solid' },
      { color: '#34495e', label: 'Driveways', style: 'solid' },
      { color: '#95a5a6', label: 'Property Lines', style: 'dashed' }
    ];

    return (
      <div className="blueprint-legend">
        <h4>Legend</h4>
        {legendItems.map((item, index) => (
          <div key={index} className="legend-item">
            <div 
              className="legend-color"
              style={{
                backgroundColor: item.color,
                borderStyle: item.style === 'dashed' ? 'dashed' : 'solid'
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="blueprint-viewer">
      {interactive && (
        <div className="viewer-controls">
          <button onClick={resetView} className="control-btn">Reset View</button>
          <button onClick={fitToView} className="control-btn">Fit to View</button>
          <div className="zoom-controls">
            <button onClick={() => setZoom(prev => Math.max(0.1, prev * 0.9))}>-</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(prev => Math.min(5, prev * 1.1))}>+</button>
          </div>
        </div>
      )}

      <div className="viewer-container">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${blueprintData.page.width_mm} ${blueprintData.page.height_mm}`}
          width="100%"
          height="600"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            border: '1px solid #ddd',
            background: '#fff',
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: '0 0'
          }}
        >
          {/* Grid */}
          {renderGrid()}
          
          {/* Shapes */}
          {renderShapes()}
          
          {/* Openings */}
          {renderOpenings()}
          
          {/* Measurements */}
          {renderMeasurements()}
        </svg>
      </div>

      {interactive && renderLegend()}
    </div>
  );
};

export default BlueprintViewer;