import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import './index.css';

function AppContent() {
  const { currentUser } = useAuth();

  return (
    <div className="App">
      {currentUser ? (
        <>
          <Navbar />
          <Dashboard />
        </>
      ) : (
        <LoginPage />
      )}
    </div>
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
