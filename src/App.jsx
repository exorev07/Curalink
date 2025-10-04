import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import FullHistory from './components/FullHistory';
import Navbar from './components/Navbar';
import './index.css';

function AppContent() {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sharedHistory, setSharedHistory] = useState([]);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} sharedHistory={sharedHistory} setSharedHistory={setSharedHistory} />;
      case 'analytics':
        return <Analytics />;
      case 'history':
        return <FullHistory onBack={() => handleNavigate('dashboard')} historyData={sharedHistory} />;
      default:
        return <Dashboard onNavigate={handleNavigate} sharedHistory={sharedHistory} setSharedHistory={setSharedHistory} />;
    }
  };

  return (
    <div className="App">
      {currentUser ? (
        <>
          <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
          {renderCurrentPage()}
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
