'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export { AuthContext };  // Export the context as well

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setLoading(false);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.requiresTwoFactor) {
          // Return 2FA required state
          return { 
            success: true, 
            requiresTwoFactor: true,
            userId: data.userId,
            email: data.email,
            message: data.message
          };
        } else {
          // Normal login flow
          setUser(data.data);
          localStorage.setItem('user', JSON.stringify(data.data));
          
          // Set cookie for middleware
          document.cookie = `user=${JSON.stringify(data.data)}; path=/; max-age=86400`;
          
          router.push('/');
          return { success: true };
        }
      }

      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Login failed' };
    }
  };

  const completeTwoFactorAuth = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Set cookie for middleware
    document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=86400`;
    
    router.push('/');
  };

  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        // Auto login after registration
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
        
        // Set cookie for middleware
        document.cookie = `user=${JSON.stringify(data.data)}; path=/; max-age=86400`;
        
        router.push('/');
        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    
    // Remove cookie
    document.cookie = 'user=; path=/; max-age=0';
    
    router.push('/authentication/login');
  };

  const refreshUser = async () => {
    try {
      if (!user?._id) return;

      const response = await fetch(`/api/users/${user._id}`);
      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, ...data.data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update cookie
        document.cookie = `user=${JSON.stringify(updatedUser)}; path=/; max-age=86400`;
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    completeTwoFactorAuth,
    refreshUser,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
