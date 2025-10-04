import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ currentPage, onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="text-white shadow-lg" style={{ backgroundColor: '#01796F' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold font-ranade">CuraLink</h1>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'dashboard' ? 'bg-[#015e57]' : 'hover:bg-[#015e57]'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('analytics')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'analytics' ? 'bg-[#015e57]' : 'hover:bg-[#015e57]'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => onNavigate('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'history' ? 'bg-[#015e57]' : 'hover:bg-[#015e57]'
                }`}
              >
                Logs
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-[#015e57] focus:outline-none"
            >
              <svg
                className={`h-6 w-6 ${isMenuOpen ? 'hidden' : 'block'}`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`h-6 w-6 ${isMenuOpen ? 'block' : 'hidden'}`}
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentUser && (
              <>
                <span className="text-sm">
                  Welcome, {currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{ 
                    backgroundColor: '#015e57',
                    ':hover': { backgroundColor: '#014a45' }
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#014a45'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#015e57'}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <button
            onClick={() => {
              onNavigate('dashboard');
              setIsMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              currentPage === 'dashboard' ? 'bg-[#015e57]' : 'hover:bg-[#015e57]'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              onNavigate('analytics');
              setIsMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              currentPage === 'analytics' ? 'bg-[#015e57]' : 'hover:bg-[#015e57]'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => {
              onNavigate('history');
              setIsMenuOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              currentPage === 'history' ? 'bg-[#015e57]' : 'hover:bg-[#015e57]'
            }`}
          >
            Logs
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
