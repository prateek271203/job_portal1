import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import Jobs from './components/Jobs';
import Content from './components/Content';
import Categories from './components/Categories';
import FAQs from './components/FAQs';
import Companies from './components/Companies';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function AppContent() {
  const { isAuthenticated } = useAuth();

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />

        {isAuthenticated ? (
          <div className="admin-layout">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                                 <Route path="/jobs" element={<Jobs />} />
                 <Route path="/companies" element={<Companies />} />
                 <Route path="/content" element={<Content />} />
                 <Route path="/categories" element={<Categories />} />
                 <Route path="/faqs" element={<FAQs />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
