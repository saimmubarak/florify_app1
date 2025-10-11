import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import AnimatedText from '../components/AnimatedText';
import InputField from '../components/InputField';
import Button from '../components/Button';
import config from '../config';

const LoginPage = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(config.LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      // Parse JSON safely even if response is empty
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      alert('✅ Login successful!');
      onNavigate('landing', formData.email);

    } catch (err) {
      console.error('Network error:', err);
      setError('Unable to connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AnimatedText delay={100}>
        <h1 className="auth-title">Welcome Back</h1>
      </AnimatedText>

      <AnimatedText delay={200}>
        <p className="auth-subtitle">Please login to your account</p>
      </AnimatedText>

      <div className="auth-form">
        <AnimatedText delay={300}>
          <label className="input-label">Email*</label>
          <InputField
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
          />
        </AnimatedText>

        <AnimatedText delay={400}>
          <label className="input-label">Password*</label>
          <InputField
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
          />
        </AnimatedText>

        {error && <div className="error-message">{error}</div>}

        <AnimatedText delay={500}>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </AnimatedText>

        <AnimatedText delay={600}>
          <p className="auth-link">
            Don't have an account?{' '}
            <a
              onClick={() => onNavigate('signup')}
              style={{ cursor: 'pointer' }}
            >
              Sign up
            </a>
          </p>
        </AnimatedText>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
