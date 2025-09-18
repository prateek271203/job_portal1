import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, error: authError, clearError } = useAuth();

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Show auth errors as toast
  useEffect(() => {
    if (authError) {
      toast.error(authError);
      clearError();
    }
  }, [authError, clearError]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful! Welcome to the admin dashboard.');
      } else {
        // Error is already handled by AuthContext
        setLoading(false);
      }
    } catch (error) {
      console.error('Login submission error:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '12px', fontWeight: '700' }}>
            🚀 Admin Portal
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '32px' }}>
            Welcome back! Sign in to access your powerful dashboard
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
              📧 Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              required
              placeholder="admin@jobportal.com"
              disabled={loading}
              className={errors.email ? 'error-input' : ''}
              style={{
                padding: '16px',
                border: `2px solid ${errors.email ? '#e74c3c' : '#e1e5e9'}`,
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                opacity: loading ? 0.7 : 1
              }}
              onFocus={(e) => {
                if (!loading) {
                  e.target.style.borderColor = errors.email ? '#e74c3c' : '#667eea';
                  e.target.style.boxShadow = `0 0 0 3px ${errors.email ? 'rgba(231, 76, 60, 0.1)' : 'rgba(102, 126, 234, 0.1)'}`;
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.email ? '#e74c3c' : '#e1e5e9';
                e.target.style.boxShadow = 'none';
              }}
            />
            {errors.email && (
              <div className="error-message" style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px' }}>
                {errors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
              🔐 Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              required
              placeholder="Enter your password"
              disabled={loading}
              className={errors.password ? 'error-input' : ''}
              style={{
                padding: '16px',
                border: `2px solid ${errors.password ? '#e74c3c' : '#e1e5e9'}`,
                borderRadius: '12px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                opacity: loading ? 0.7 : 1
              }}
              onFocus={(e) => {
                if (!loading) {
                  e.target.style.borderColor = errors.password ? '#e74c3c' : '#667eea';
                  e.target.style.boxShadow = `0 0 0 3px ${errors.password ? 'rgba(231, 76, 60, 0.1)' : 'rgba(102, 126, 234, 0.1)'}`;
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.password ? '#e74c3c' : '#e1e5e9';
                e.target.style.boxShadow = 'none';
              }}
            />
            {errors.password && (
              <div className="error-message" style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: '4px' }}>
                {errors.password}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              marginTop: '24px',
              borderRadius: '12px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', marginRight: '8px' }}></div>
                Signing in...
              </>
            ) : (
              <>
                🚀 Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        <div style={{ 
          marginTop: '32px', 
          textAlign: 'center', 
          padding: '16px',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(102, 126, 234, 0.2)'
        }}>
          <p style={{ fontSize: '0.9rem', color: '#667eea', margin: 0 }}>
            💡 Demo Credentials: admin@jobportal.com / admin123456
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
