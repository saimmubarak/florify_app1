import React, { useState } from 'react';
import { BlueprintModel } from './BlueprintModel';
import SVGEditor from './SVGEditor';
import HouseFrontSelector from './HouseFrontSelector';
import WallConfigurator from './WallConfigurator';
import PathwayEditor from './PathwayEditor';
import Button from '../Button';
import TypewriterText from '../TypewriterText';

const EmptyGardenWizard = ({ onClose, onGardenCreated, userEmail }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [blueprintModel] = useState(() => new BlueprintModel());
  const [blueprintData, setBlueprintData] = useState(blueprintModel.toJSON());
  const [editorMode, setEditorMode] = useState('view');
  const [gardenName, setGardenName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { 
      number: 1, 
      title: 'House Front', 
      description: 'Select and customize your house front design',
      component: 'house-front'
    },
    { 
      number: 2, 
      title: 'Boundary Walls', 
      description: 'Configure your garden boundaries',
      component: 'walls'
    },
    { 
      number: 3, 
      title: 'Pathways', 
      description: 'Draw driveways, walkways, and garden areas',
      component: 'pathways'
    },
    { 
      number: 4, 
      title: 'Review', 
      description: 'Review and finalize your garden blueprint',
      component: 'review'
    }
  ];

  const handleBlueprintChange = (newData) => {
    setBlueprintData(newData);
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
        return blueprintModel.data.templates.selected !== null;
      case 2:
        return blueprintModel.getShapesByRole('boundary').length > 0;
      case 3:
        return true; // Pathways are optional
      case 4:
        return gardenName.trim().length >= 2;
      default:
        return false;
    }
  };

  const handleSaveGarden = async () => {
    if (!gardenName.trim()) {
      setError('Please enter a garden name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create garden data with blueprint
      const gardenData = {
        name: gardenName,
        description: 'Empty garden blueprint created with the garden wizard',
        location: 'Garden Blueprint',
        coordinates: { lat: 0, lng: 0 },
        userEmail: userEmail,
        blueprintData: blueprintData,
        isBlueprint: true
      };

      // For now, we'll just call the callback with the blueprint data
      // In a real implementation, you'd save this to your backend
      if (onGardenCreated) {
        onGardenCreated({
          ...gardenData,
          id: `blueprint-${Date.now()}`,
          createdAt: new Date().toISOString()
        });
      }
    } catch {
      setError('Failed to save garden blueprint');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <HouseFrontSelector 
              blueprintModel={blueprintModel}
              onBlueprintChange={handleBlueprintChange}
            />
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <WallConfigurator 
              blueprintModel={blueprintModel}
              onBlueprintChange={handleBlueprintChange}
            />
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <PathwayEditor 
              blueprintModel={blueprintModel}
              onBlueprintChange={handleBlueprintChange}
            />
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <div className="review-content">
              <h3>Review Your Garden Blueprint</h3>
              <p>Take a final look at your garden design before saving</p>
              
              <div className="garden-name-input">
                <label htmlFor="garden-name">Garden Name *</label>
                <input
                  id="garden-name"
                  type="text"
                  value={gardenName}
                  onChange={(e) => setGardenName(e.target.value)}
                  placeholder="Enter a name for your garden blueprint"
                  className="name-input"
                />
              </div>
              
              <div className="blueprint-summary">
                <h4>Blueprint Summary:</h4>
                <ul>
                  <li>House Front: {blueprintModel.data.templates.selected || 'Not selected'}</li>
                  <li>Boundary Configuration: {blueprintModel.getShapesByRole('boundary').length > 0 ? 'Configured' : 'Not configured'}</li>
                  <li>Pathways: {blueprintModel.getShapesByRole('pathway').length} drawn</li>
                  <li>Garden Beds: {blueprintModel.getShapesByRole('gardenBed').length} defined</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderEditor = () => {
    if (currentStep === 4) return null; // Don't show editor on review step
    
    return (
      <div className="editor-panel">
        <div className="editor-controls">
          <div className="mode-buttons">
            <button 
              className={`mode-btn ${editorMode === 'view' ? 'active' : ''}`}
              onClick={() => setEditorMode('view')}
            >
              👁️ View
            </button>
            <button 
              className={`mode-btn ${editorMode === 'edit' ? 'active' : ''}`}
              onClick={() => setEditorMode('edit')}
            >
              ✏️ Edit
            </button>
            <button 
              className={`mode-btn ${editorMode === 'draw' ? 'active' : ''}`}
              onClick={() => setEditorMode('draw')}
            >
              🖊️ Draw
            </button>
          </div>
        </div>
        
        <SVGEditor
          blueprintModel={blueprintModel}
          onBlueprintChange={handleBlueprintChange}
          mode={editorMode}
        />
      </div>
    );
  };

  return (
    <div className="empty-garden-wizard">
      <div className="wizard-header">
        <TypewriterText delay={100}>
          <h2 className="wizard-title">CREATE EMPTY GARDEN BLUEPRINT</h2>
        </TypewriterText>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="wizard-layout">
        <div className="wizard-sidebar">
          <div className="wizard-progress">
            {steps.map((step) => (
              <div key={step.number} className={`progress-step ${currentStep >= step.number ? 'active' : ''}`}>
                <div className="step-number">{step.number}</div>
                <div className="step-info">
                  <div className="step-title-small">{step.title}</div>
                  <div className="step-desc-small">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="step-content-wrapper">
            {renderStepContent()}
          </div>
        </div>

        <div className="wizard-main">
          {renderEditor()}
        </div>
      </div>

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
            onClick={handleSaveGarden} 
            disabled={loading || !gardenName.trim()}
            className="primary-btn"
          >
            {loading ? 'SAVING BLUEPRINT...' : 'SAVE BLUEPRINT 📐'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyGardenWizard;