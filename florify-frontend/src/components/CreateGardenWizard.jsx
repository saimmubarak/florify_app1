import React, { useState } from 'react';
import Button from './Button';
import InputField from './InputField';
import AnimatedText from './AnimatedText';
import config from '../config';
import '../styles/garden-wizard.css';

const CreateGardenWizard = ({ onClose, onGardenCreated, userEmail }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    image: null,
    imagePreview: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { number: 1, title: 'Garden Name', description: 'Give your garden a memorable name' },
    { number: 2, title: 'Location', description: 'Where is your garden located?' },
    { number: 3, title: 'Photo', description: 'Add a photo of your garden' },
    { number: 4, title: 'Review', description: 'Review and create your garden' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: e.target.result
        }));
      };
      reader.readAsDataURL(file);
      setError('');
    }
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
        return formData.name.trim().length >= 2;
      case 2:
        return formData.location.trim().length >= 2;
      case 3:
        return true; // Image is optional
      case 4:
        return formData.name.trim().length >= 2 && formData.location.trim().length >= 2;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('userEmail', userEmail);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await fetch(`${config.API_BASE_URL}/gardens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'mock-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          description: formData.description,
          userEmail: userEmail
        })
      });

      if (response.ok) {
        const newGarden = await response.json();
        onGardenCreated(newGarden);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create garden');
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
            <AnimatedText delay={100}>
              <h3 className="step-title">What would you like to call your garden?</h3>
            </AnimatedText>
            <AnimatedText delay={200}>
              <p className="step-description">
                Choose a name that reflects your garden's personality and purpose.
              </p>
            </AnimatedText>
            <AnimatedText delay={300}>
              <div className="input-group">
                <label className="input-label">Garden Name*</label>
                <InputField
                  type="text"
                  name="name"
                  placeholder="e.g., My Backyard Paradise, Urban Herb Garden"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
            </AnimatedText>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <AnimatedText delay={100}>
              <h3 className="step-title">Where is your garden located?</h3>
            </AnimatedText>
            <AnimatedText delay={200}>
              <p className="step-description">
                This helps us provide location-specific gardening tips and track your garden's environment.
              </p>
            </AnimatedText>
            <AnimatedText delay={300}>
              <div className="input-group">
                <label className="input-label">Location*</label>
                <InputField
                  type="text"
                  name="location"
                  placeholder="e.g., Backyard, Balcony, Community Garden, 123 Main St"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>
            </AnimatedText>
            <AnimatedText delay={400}>
              <div className="input-group">
                <label className="input-label">Description (Optional)</label>
                <textarea
                  name="description"
                  placeholder="Tell us more about your garden..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="description-textarea"
                  rows="4"
                />
              </div>
            </AnimatedText>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <AnimatedText delay={100}>
              <h3 className="step-title">Add a photo of your garden</h3>
            </AnimatedText>
            <AnimatedText delay={200}>
              <p className="step-description">
                A picture helps you track your garden's progress over time. This is optional but recommended.
              </p>
            </AnimatedText>
            <AnimatedText delay={300}>
              <div className="image-upload-section">
                {formData.imagePreview ? (
                  <div className="image-preview">
                    <img src={formData.imagePreview} alt="Garden preview" />
                    <button 
                      type="button" 
                      className="change-image-btn"
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      Change Image
                    </button>
                  </div>
                ) : (
                  <div className="image-upload-area">
                    <div className="upload-icon">📷</div>
                    <p className="upload-text">Click to upload a photo</p>
                    <p className="upload-hint">PNG, JPG up to 5MB</p>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden-input"
                    />
                  </div>
                )}
              </div>
            </AnimatedText>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <AnimatedText delay={100}>
              <h3 className="step-title">Review your garden details</h3>
            </AnimatedText>
            <AnimatedText delay={200}>
              <div className="review-section">
                <div className="review-item">
                  <label>Garden Name:</label>
                  <span>{formData.name}</span>
                </div>
                <div className="review-item">
                  <label>Location:</label>
                  <span>{formData.location}</span>
                </div>
                {formData.description && (
                  <div className="review-item">
                    <label>Description:</label>
                    <span>{formData.description}</span>
                  </div>
                )}
                <div className="review-item">
                  <label>Photo:</label>
                  <span>{formData.image ? '✓ Uploaded' : 'No photo'}</span>
                </div>
              </div>
            </AnimatedText>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h2 className="wizard-title">Create Your Garden</h2>
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
              ← Previous
            </Button>
          )}
          
          {currentStep < steps.length ? (
            <Button 
              onClick={nextStep} 
              disabled={!validateStep(currentStep)}
              className="primary-btn"
            >
              Next →
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !validateStep(4)}
              className="primary-btn"
            >
              {loading ? 'Creating Garden...' : 'Create Garden 🌱'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGardenWizard;