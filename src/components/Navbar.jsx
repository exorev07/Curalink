import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();

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
    </nav>
  );
};

export default Navbar;
