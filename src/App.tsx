import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import HospitalDashboard from './components/Hospital/HospitalDashboard';
import PatientDashboard from './components/Patient/PatientDashboard';
import LoadingSpinner from './components/Common/LoadingSpinner';
import LandingPage from './components/Landing/LandingPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#1a1a1a] flex items-center justify-center">
        <LoadingSpinner message="Loading BloodDoc..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#1a1a1a] flex items-center justify-center">
        <LoadingSpinner message="Initializing BloodDoc..." />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#1a1a1a]">
        {user && <Navbar />}
        
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/dashboard" replace /> : <SignupForm />} 
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {user?.role === 'hospital' ? <HospitalDashboard /> : <PatientDashboard />}
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;