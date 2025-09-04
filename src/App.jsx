import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Navbar from './components/Navbar';
import './index.css';

function AppContent() {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="App">
      {currentUser ? (
        <>
          <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
          {currentPage === 'dashboard' ? <Dashboard onNavigate={handleNavigate} /> : <Analytics />}
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
