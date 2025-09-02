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
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold">🏥 Bed Occupancy Management</h1>
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
                  className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
