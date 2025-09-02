import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, isDemoMode } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Demo mode user for testing without Firebase
  const demoUser = { email: 'demo@hospital.com', uid: 'demo-user' };

  const signup = async (email, password) => {
    if (isDemoMode) {
      // Simulate signup in demo mode
      setCurrentUser({ email, uid: 'demo-' + Date.now() });
      return Promise.resolve();
    }
    
    if (!auth) {
      throw new Error('Firebase not properly configured');
    }
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = async (email, password) => {
    if (isDemoMode) {
      // Simulate login in demo mode
      setCurrentUser({ email, uid: 'demo-' + Date.now() });
      return Promise.resolve();
    }
    
    if (!auth) {
      throw new Error('Firebase not properly configured');
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    if (isDemoMode) {
      setCurrentUser(null);
      return Promise.resolve();
    }
    
    if (!auth) {
      throw new Error('Firebase not properly configured');
    }
    return signOut(auth);
  };

  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, auto-login with demo user
      setTimeout(() => {
        setCurrentUser(demoUser);
        setLoading(false);
      }, 1000);
      return;
    }

    if (!auth) {
      setError('Firebase authentication not available');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    }, (error) => {
      setError(error.message);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    error,
    isDemoMode
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
