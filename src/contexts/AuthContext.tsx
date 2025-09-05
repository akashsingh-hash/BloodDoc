import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'hospital' | 'patient') => Promise<void>;
  signup: (userData: {
    email: string;
    password: string;
    name: string;
    role: 'hospital' | 'patient';
    address?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('blooddoc_token');
    const userData = localStorage.getItem('blooddoc_user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('blooddoc_token');
        localStorage.removeItem('blooddoc_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, role: 'hospital' | 'patient') => {
    try {
      const response = await authService.login(email, password, role);
      setUser(response.user);
      localStorage.setItem('blooddoc_token', response.token);
      localStorage.setItem('blooddoc_user', JSON.stringify(response.user));
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData: {
    email: string;
    password: string;
    name: string;
    role: 'hospital' | 'patient';
    address?: string;
    phone?: string;
  }) => {
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      localStorage.setItem('blooddoc_token', response.token);
      localStorage.setItem('blooddoc_user', JSON.stringify(response.user));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('blooddoc_token');
    localStorage.removeItem('blooddoc_user');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};