import React, { useState, useRef, useEffect } from 'react';
import Button from './Button';
import TypewriterText from './TypewriterText';
import BlueprintEditor from './BlueprintEditor';
import BlueprintViewer from './BlueprintViewer';
import '../styles/empty-garden-wizard.css';

const EmptyGardenWizard = ({ onClose, onGardenCreated, userEmail }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [blueprintData, setBlueprintData] = useState({
    page: { width_mm: 210, height_mm: 297, units: "mm" },
    templates: {
      selected: null,
      templatesList: [
        "modern-rectangular", "traditional-l-shaped", "contemporary-angled",
        "classic-square", "modern-asymmetrical", "traditional-ranch",
        "contemporary-curved", "classic-colonial", "modern-minimalist", "traditional-craftsman"
      ]
    },
    shapes: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { number: 1, title: 'House Front', description: 'Choose and customize your house front' },
    { number: 2, title: 'Boundary Walls', description: 'Set up your garden boundaries' },
    { number: 3, title: 'Property Lines', description: 'Define property boundaries' },
    { number: 4, title: 'Pathways', description: 'Draw driveways and walkways' },
    { number: 5, title: 'Review', description: 'Review and finalize your garden blueprint' }
  ];

  const houseTemplates = {
    "modern-rectangular": {
      name: "Modern Rectangular",
      description: "Clean lines with contemporary appeal",
      basePoints: [[20, 50], [80, 50], [80, 80], [20, 80]],
      defaultOpenings: [
        { start: [30, 50], end: [40, 50], type: "door" },
        { start: [50, 50], end: [70, 50], type: "window" }
      ]
    },
    "traditional-l-shaped": {
      name: "Traditional L-Shaped",
      description: "Classic L-shaped house front",
      basePoints: [[20, 50], [60, 50], [60, 70], [40, 70], [40, 80], [20, 80]],
      defaultOpenings: [
        { start: [25, 50], end: [35, 50], type: "door" },
        { start: [45, 50], end: [55, 50], type: "window" }
      ]
    },
    "contemporary-angled": {
      name: "Contemporary Angled",
      description: "Modern angled design",
      basePoints: [[20, 50], [70, 50], [80, 60], [80, 80], [20, 80]],
      defaultOpenings: [
        { start: [30, 50], end: [40, 50], type: "door" },
        { start: [50, 50], end: [65, 50], type: "window" }
      ]
    },
    "classic-square": {
      name: "Classic Square",
      description: "Traditional square house front",
      basePoints: [[30, 50], [70, 50], [70, 80], [30, 80]],
      defaultOpenings: [
        { start: [40, 50], end: [50, 50], type: "door" },
        { start: [55, 50], end: [65, 50], type: "window" }
      ]
    },
    "modern-asymmetrical": {
      name: "Modern Asymmetrical",
      description: "Asymmetrical contemporary design",
      basePoints: [[20, 50], [75, 50], [75, 65], [60, 65], [60, 80], [20, 80]],
      defaultOpenings: [
        { start: [25, 50], end: [35, 50], type: "door" },
        { start: [45, 50], end: [70, 50], type: "window" }
      ]
    },
    "traditional-ranch": {
      name: "Traditional Ranch",
      description: "Single-story ranch style",
      basePoints: [[15, 50], [85, 50], [85, 75], [15, 75]],
      defaultOpenings: [
        { start: [30, 50], end: [40, 50], type: "door" },
        { start: [50, 50], end: [70, 50], type: "window" },
        { start: [75, 50], end: [80, 50], type: "window" }
      ]
    },
    "contemporary-curved": {
      name: "Contemporary Curved",
      description: "Modern curved elements",
      basePoints: [[20, 50], [70, 50], [75, 55], [75, 80], [20, 80]],
      defaultOpenings: [
        { start: [30, 50], end: [40, 50], type: "door" },
        { start: [50, 50], end: [65, 50], type: "window" }
      ]
    },
    "classic-colonial": {
      name: "Classic Colonial",
      description: "Traditional colonial architecture",
      basePoints: [[25, 50], [75, 50], [75, 85], [25, 85]],
      defaultOpenings: [
        { start: [40, 50], end: [50, 50], type: "door" },
        { start: [55, 50], end: [65, 50], type: "window" },
        { start: [30, 50], end: [35, 50], type: "window" }
      ]
    },
    "modern-minimalist": {
      name: "Modern Minimalist",
      description: "Clean minimalist design",
      basePoints: [[30, 50], [70, 50], [70, 75], [30, 75]],
      defaultOpenings: [
        { start: [40, 50], end: [50, 50], type: "door" },
        { start: [55, 50], end: [65, 50], type: "window" }
      ]
    },
    "traditional-craftsman": {
      name: "Traditional Craftsman",
      description: "Craftsman style with character",
      basePoints: [[20, 50], [80, 50], [80, 85], [20, 85]],
      defaultOpenings: [
        { start: [35, 50], end: [45, 50], type: "door" },
        { start: [50, 50], end: [65, 50], type: "window" },
        { start: [25, 50], end: [30, 50], type: "window" }
      ]
    }
  };

  const boundaryConfigurations = {
    "full-walls": {
      name: "Full Boundary Walls",
      description: "Walls on all sides except for a gate opening",
      walls: [
        { start: [10, 10], end: [190, 10] }, // Top
        { start: [190, 10], end: [190, 280] }, // Right
        { start: [190, 280], end: [10, 280] }, // Bottom
        { start: [10, 280], end: [10, 10] } // Left
      ],
      gate: { start: [90, 10], end: [110, 10] }
    },
    "partial-walls": {
      name: "Partial Boundary Walls",
      description: "Walls on two sides, front open",
      walls: [
        { start: [10, 10], end: [190, 10] }, // Top
        { start: [10, 280], end: [190, 280] } // Bottom
      ],
      gate: null
    },
    "no-walls": {
      name: "No Boundary Walls",
      description: "Open garden with property lines only",
      walls: [],
      gate: null
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = houseTemplates[templateId];
    if (!template) return;

    // Remove existing house front shapes
    const filteredShapes = blueprintData.shapes.filter(shape => shape.role !== 'houseFront');
    
    // Add new house front shape
    const houseShape = {
      id: `house-${Date.now()}`,
      type: "polygon",
      role: "houseFront",
      points: template.basePoints,
      openings: template.defaultOpenings.map((opening, index) => ({
        id: `opening-${index}`,
        start: opening.start,
        end: opening.end,
        type: opening.type
      })),
      style: { stroke: "#e74c3c", strokeWidth: 2, fill: "#f8f9fa" }
    };

    setBlueprintData(prev => ({
      ...prev,
      templates: { ...prev.templates, selected: templateId },
      shapes: [...filteredShapes, houseShape]
    }));
  };

  const handleBoundaryConfigSelect = (configId) => {
    const config = boundaryConfigurations[configId];
    if (!config) return;

    // Remove existing boundary shapes
    const filteredShapes = blueprintData.shapes.filter(shape => 
      shape.role !== 'boundary' && shape.role !== 'gate'
    );
    
    const newShapes = [...filteredShapes];

    // Add boundary walls
    config.walls.forEach((wall, index) => {
      newShapes.push({
        id: `boundary-wall-${index}`,
        type: "polyline",
        role: "boundary",
        points: [wall.start, wall.end],
        style: { stroke: "#8e44ad", strokeWidth: 3 }
      });
    });

    // Add gate if exists
    if (config.gate) {
      newShapes.push({
        id: `gate-${Date.now()}`,
        type: "polyline",
        role: "gate",
        points: [config.gate.start, config.gate.end],
        style: { stroke: "#f39c12", strokeWidth: 4, strokeDasharray: "5,5" }
      });
    }

    setBlueprintData(prev => ({
      ...prev,
      shapes: newShapes
    }));
  };

  const handleBlueprintUpdate = (updatedShapes) => {
    setBlueprintData(prev => ({
      ...prev,
      shapes: updatedShapes
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return blueprintData.templates.selected !== null;
      case 2:
        return blueprintData.shapes.some(shape => shape.role === 'boundary');
      case 3:
        return true; // Property lines are optional
      case 4:
        return true; // Pathways are optional
      case 5:
        return blueprintData.shapes.length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!blueprintData.templates.selected) {
      setError('Please select a house template');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create garden data with blueprint
      const gardenData = {
        name: `Empty Garden - ${houseTemplates[blueprintData.templates.selected].name}`,
        description: 'Empty garden blueprint created with the garden wizard',
        location: 'Custom Location',
        coordinates: { lat: 0, lng: 0 },
        userEmail: userEmail,
        blueprintData: blueprintData,
        type: 'empty_garden'
      };

      // Submit garden to backend
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000'}/gardens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gardenData)
      });

      if (response.ok) {
        const newGarden = await response.json();
        onGardenCreated(newGarden);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create garden blueprint');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <TypewriterText delay={100}>
              <h3 className="step-title">Choose Your House Front</h3>
            </TypewriterText>
            <TypewriterText delay={200}>
              <p className="step-description">
                Select a house front template and customize it to match your home.
              </p>
            </TypewriterText>
            <TypewriterText delay={300}>
              <div className="template-grid">
                {Object.entries(houseTemplates).map(([id, template]) => (
                  <div
                    key={id}
                    className={`template-card ${blueprintData.templates.selected === id ? 'selected' : ''}`}
                    onClick={() => handleTemplateSelect(id)}
                  >
                    <div className="template-preview">
                      <svg viewBox="0 0 100 50" width="100" height="50">
                        <polygon
                          points={template.basePoints.map(([x, y]) => `${x},${y}`).join(' ')}
                          fill="#f8f9fa"
                          stroke="#e74c3c"
                          strokeWidth="1"
                        />
                        {template.defaultOpenings.map((opening, index) => (
                          <line
                            key={index}
                            x1={opening.start[0]}
                            y1={opening.start[1]}
                            x2={opening.end[0]}
                            y2={opening.end[1]}
                            stroke={opening.type === 'door' ? '#f39c12' : '#3498db'}
                            strokeWidth="2"
                          />
                        ))}
                      </svg>
                    </div>
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                  </div>
                ))}
              </div>
            </TypewriterText>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <TypewriterText delay={100}>
              <h3 className="step-title">Set Up Boundary Walls</h3>
            </TypewriterText>
            <TypewriterText delay={200}>
              <p className="step-description">
                Choose how you want to define your garden boundaries.
              </p>
            </TypewriterText>
            <TypewriterText delay={300}>
              <div className="boundary-configs">
                {Object.entries(boundaryConfigurations).map(([id, config]) => (
                  <div
                    key={id}
                    className="boundary-card"
                    onClick={() => handleBoundaryConfigSelect(id)}
                  >
                    <div className="boundary-preview">
                      <svg viewBox="0 0 200 100" width="200" height="100">
                        {config.walls.map((wall, index) => (
                          <line
                            key={index}
                            x1={wall.start[0]}
                            y1={wall.start[1]}
                            x2={wall.end[0]}
                            y2={wall.end[1]}
                            stroke="#8e44ad"
                            strokeWidth="3"
                          />
                        ))}
                        {config.gate && (
                          <line
                            x1={config.gate.start[0]}
                            y1={config.gate.start[1]}
                            x2={config.gate.end[0]}
                            y2={config.gate.end[1]}
                            stroke="#f39c12"
                            strokeWidth="4"
                            strokeDasharray="5,5"
                          />
                        )}
                      </svg>
                    </div>
                    <h4>{config.name}</h4>
                    <p>{config.description}</p>
                  </div>
                ))}
              </div>
            </TypewriterText>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <TypewriterText delay={100}>
              <h3 className="step-title">Define Property Lines</h3>
            </TypewriterText>
            <TypewriterText delay={200}>
              <p className="step-description">
                Add property boundary lines where there are no walls.
              </p>
            </TypewriterText>
            <TypewriterText delay={300}>
              <div className="editor-container">
                <BlueprintEditor
                  blueprintData={blueprintData}
                  onBlueprintUpdate={handleBlueprintUpdate}
                  mode="property-lines"
                />
              </div>
            </TypewriterText>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <TypewriterText delay={100}>
              <h3 className="step-title">Draw Pathways & Driveways</h3>
            </TypewriterText>
            <TypewriterText delay={200}>
              <p className="step-description">
                Add driveways, walkways, and other pathways to your garden.
              </p>
            </TypewriterText>
            <TypewriterText delay={300}>
              <div className="editor-container">
                <BlueprintEditor
                  blueprintData={blueprintData}
                  onBlueprintUpdate={handleBlueprintUpdate}
                  mode="pathways"
                />
              </div>
            </TypewriterText>
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <TypewriterText delay={100}>
              <h3 className="step-title">Review Your Garden Blueprint</h3>
            </TypewriterText>
            <TypewriterText delay={200}>
              <p className="step-description">
                Review your empty garden blueprint before finalizing.
              </p>
            </TypewriterText>
            <TypewriterText delay={300}>
              <div className="blueprint-review">
                <BlueprintViewer
                  blueprintData={blueprintData}
                  interactive={true}
                />
                <div className="blueprint-info">
                  <h4>Blueprint Summary</h4>
                  <ul>
                    <li>House Front: {houseTemplates[blueprintData.templates.selected]?.name || 'None'}</li>
                    <li>Boundary Walls: {blueprintData.shapes.filter(s => s.role === 'boundary').length}</li>
                    <li>Pathways: {blueprintData.shapes.filter(s => s.role === 'driveway' || s.role === 'pathway').length}</li>
                    <li>Total Elements: {blueprintData.shapes.length}</li>
                  </ul>
                </div>
              </div>
            </TypewriterText>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="empty-garden-wizard">
      <div className="wizard-header">
        <TypewriterText delay={100}>
          <h2 className="wizard-title">CREATE EMPTY GARDEN</h2>
        </TypewriterText>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="wizard-progress">
        {steps.map((step, index) => (
          <div key={step.number} className={`progress-step ${currentStep >= step.number ? 'active' : ''}`}>
            <div className="step-number">{step.number}</div>
            <div className="step-info">
              <div className="step-title-small">{step.title}</div>
              <div className="step-desc-small">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="wizard-content">
        {renderStepContent()}
        
        {error && <div className="error-message">{error}</div>}

        <div className="wizard-actions">
          {currentStep > 1 && (
            <Button onClick={prevStep} className="secondary-btn">
              ← PREVIOUS
            </Button>
          )}
          
          {currentStep < steps.length ? (
            <Button 
              onClick={nextStep} 
              disabled={!validateStep(currentStep)}
              className="primary-btn"
            >
              NEXT →
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !validateStep(currentStep)}
              className="primary-btn"
            >
              {loading ? 'CREATING BLUEPRINT...' : 'CREATE GARDEN BLUEPRINT 🏡'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyGardenWizard;