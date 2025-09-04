import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup, isDemoMode } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (error.message.includes('Firebase not properly configured')) {
        setError('Firebase is not configured. Please check the setup instructions in README.md');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(`Failed to ${isLogin ? 'sign in' : 'create account'}: ${error.message}`);
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#e9eae0' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold mb-4 font-ranade tracking-tight" style={{ color: '#01796F' }}>CuraLink</h1>
          <p className="mt-2 text-sm" style={{ color: '#01796F' }}>
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
          
          {isDemoMode && (
            <div className="mt-4 border-2 px-4 py-3 rounded-lg" style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }}>
              <p className="text-sm" style={{ color: '#01796F' }}>
                <strong>Demo Mode:</strong> Firebase not configured. 
                <br />Any email/password will work for testing.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border-2" style={{ backgroundColor: '#c9c7c0', borderColor: '#9a9890' }}>
          {error && (
            <div className="mb-4 border-2 px-4 py-3 rounded-lg" style={{ backgroundColor: '#ffebee', borderColor: '#ffcdd2', color: '#c62828' }}>
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: '#01796F' }}>
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isDemoMode ? "test@example.com (any email works)" : ""}
                  className="appearance-none block w-full px-3 py-2 border-2 rounded-md font-ranade transition-colors duration-200"
                  style={{ 
                    backgroundColor: '#e9eae0',
                    borderColor: '#9a9890',
                    color: '#01796F'
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: '#01796F' }}>
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isDemoMode ? "password123 (any password works)" : ""}
                  className="appearance-none block w-full px-3 py-2 border-2 rounded-md font-ranade transition-colors duration-200"
                  style={{ 
                    backgroundColor: '#e9eae0',
                    borderColor: '#9a9890',
                    color: '#01796F'
                  }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-200"
                style={{ 
                  backgroundColor: '#01796F',
                  opacity: loading ? '0.5' : '1'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#015e57'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#01796F'}
              >
                {loading ? 'Loading...' : (isLogin ? 'Sign in' : 'Sign up')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm hover:opacity-80 transition-opacity duration-200"
                style={{ color: '#01796F' }}
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
