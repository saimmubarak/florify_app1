import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import AnimatedText from '../components/AnimatedText';
import CreateGardenWizard from '../components/CreateGardenWizard';
import GardenCard from '../components/GardenCard';
import config from '../config';
import '../styles/landing.css';

function LandingPage({ onLogout, userEmail }) {
  const [showWizard, setShowWizard] = useState(false);
  const [gardens, setGardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch user's gardens on component mount
  useEffect(() => {
    fetchGardens();
  }, []);

  const fetchGardens = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/gardens`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'mock-token'}` // Mock token for testing
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGardens(data.gardens || []);
      } else {
        setError('Failed to load gardens');
      }
    } catch (err) {
      setError('Network error loading gardens');
    } finally {
      setLoading(false);
    }
  };

  const handleGardenCreated = (newGarden) => {
    setGardens(prev => [newGarden, ...prev]);
    setShowWizard(false);
  };

  const handleGardenClick = (gardenId) => {
    // Navigate to garden detail view (to be implemented)
    console.log('Navigate to garden:', gardenId);
  };

  return (
    <div className="landing-container">
      {/* Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">Florify 🌸</h1>
            <p className="welcome-text">Welcome back, {userEmail?.split('@')[0]}!</p>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="landing-main">
        <div className="landing-content">
          {/* Hero Section */}
          <section className="hero-section">
            <AnimatedText delay={100}>
              <h2 className="hero-title">Create Your Garden Paradise</h2>
            </AnimatedText>
            <AnimatedText delay={200}>
              <p className="hero-subtitle">
                Transform your space into a beautiful garden. Track, manage, and watch your plants grow.
              </p>
            </AnimatedText>
            <AnimatedText delay={300}>
              <Button 
                onClick={() => setShowWizard(true)}
                className="create-garden-btn"
              >
                🌱 Create Your Garden
              </Button>
            </AnimatedText>
          </section>

          {/* Gardens Section */}
          <section className="gardens-section">
            <AnimatedText delay={400}>
              <h3 className="section-title">Your Gardens</h3>
            </AnimatedText>
            
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading your gardens...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <p>{error}</p>
                <Button onClick={fetchGardens}>Retry</Button>
              </div>
            ) : gardens.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🌱</div>
                <h4>No gardens yet</h4>
                <p>Create your first garden to get started!</p>
                <Button onClick={() => setShowWizard(true)}>
                  Create Your First Garden
                </Button>
              </div>
            ) : (
              <div className="gardens-grid">
                {gardens.map((garden, index) => (
                  <AnimatedText key={garden.id} delay={500 + (index * 100)}>
                    <GardenCard 
                      garden={garden} 
                      onClick={() => handleGardenClick(garden.id)}
                    />
                  </AnimatedText>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Create Garden Wizard Modal */}
      {showWizard && (
        <div className="modal-overlay">
          <div className="modal-content">
            <CreateGardenWizard 
              onClose={() => setShowWizard(false)}
              onGardenCreated={handleGardenCreated}
              userEmail={userEmail}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;
