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
      title: 'House & Walls', 
      description: 'Add house front and boundary walls',
      component: 'house-walls'
    },
    { 
      number: 2, 
      title: 'Draw Layout', 
      description: 'Draw pathways, driveways, and garden areas',
      component: 'draw'
    },
    { 
      number: 3, 
      title: 'Save', 
      description: 'Name and save your blueprint',
      component: 'save'
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
            <div className="step-section">
              <h4>🏠 House Front</h4>
              <HouseFrontSelector 
                blueprintModel={blueprintModel}
                onBlueprintChange={handleBlueprintChange}
              />
            </div>
            <div className="step-section">
              <h4>🧱 Boundary Walls</h4>
              <WallConfigurator 
                blueprintModel={blueprintModel}
                onBlueprintChange={handleBlueprintChange}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="step-section">
              <h4>🛤️ Draw Layout</h4>
              <PathwayEditor 
                blueprintModel={blueprintModel}
                onBlueprintChange={handleBlueprintChange}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <div className="review-content">
              <h3>Save Your Blueprint</h3>
              
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
                <h4>Elements in your blueprint:</h4>
                <ul>
                  <li>House Front: {blueprintModel.data.templates.selected || 'Not added'}</li>
                  <li>Boundary Walls: {blueprintModel.getShapesByRole('boundary').length > 0 ? 'Added' : 'Not added'}</li>
                  <li>Pathways: {blueprintModel.getShapesByRole('pathway').length} drawn</li>
                  <li>Garden Areas: {blueprintModel.getShapesByRole('gardenBed').length} defined</li>
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
    return (
      <div className="editor-panel">
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
      <div className="wizard-modal">
        <div className="wizard-header">
          <h2 className="wizard-title">CREATE EMPTY GARDEN BLUEPRINT</h2>
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
          <div className="action-left">
            {currentStep > 1 && (
              <Button onClick={prevStep} className="secondary-btn">
                ← PREVIOUS
              </Button>
            )}
          </div>
          
          <div className="action-right">
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
                {loading ? 'SAVING...' : 'SAVE BLUEPRINT 📐'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyGardenWizard;