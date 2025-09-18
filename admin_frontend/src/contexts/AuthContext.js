import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios defaults
  useEffect(() => {
    axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    axios.defaults.timeout = 10000;
    axios.defaults.withCredentials = true;
  }, []);

  // Check if admin is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get('/api/admin/auth/profile');
      
      if (response.data.success) {
        setAdmin(response.data.data);
      } else {
        throw new Error(response.data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      
      if (error.response?.status === 401) {
        // Token is invalid, clear it
        localStorage.removeItem('adminToken');
        delete axios.defaults.headers.common['Authorization'];
        setAdmin(null);
      } else {
        setError(error.response?.data?.message || 'Failed to verify authentication');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.post('/api/admin/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });

      if (response.data.success) {
        const { token, admin: adminData } = response.data.data;
        
        localStorage.setItem('adminToken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setAdmin(adminData);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Try to call logout endpoint
      await axios.post('/api/admin/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Always clear local data
      localStorage.removeItem('adminToken');
      delete axios.defaults.headers.common['Authorization'];
      setAdmin(null);
      setError(null);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      setError(null);
      const response = await axios.put('/api/admin/auth/profile', profileData);
      
      if (response.data.success) {
        setAdmin(response.data.data);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return false;
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await checkAuthStatus();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }, [checkAuthStatus]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    admin,
    isAuthenticated: !!admin,
    loading,
    error,
    login,
    logout,
    updateProfile,
    refreshToken,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
