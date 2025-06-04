'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { useRouter } from 'next/navigation'; // For navigation

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for token on initial load
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', { username, password });
      const { token: receivedToken, user: loggedInUser } = response.data;

      localStorage.setItem('authToken', receivedToken);
      localStorage.setItem('authUser', JSON.stringify(loggedInUser));
      setToken(receivedToken);
      setUser(loggedInUser);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;

      // Redirect based on role
      if (loggedInUser.role === 'owner') {
        router.push('/owner-dashboard');
      } else if (loggedInUser.role === 'staff') {
        router.push('/staff-dashboard');
      } else {
        router.push('/dashboard'); // Fallback
      }
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data?.message || error.message);
      // alert(error.response?.data?.message || 'Login failed');
      throw error; // Re-throw to be caught by the form
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, password) => {
    // Role is determined by backend (first user owner, others staff)
    try {
      setLoading(true);
      await apiClient.post('/auth/register', { username, password });
      // alert('Registration successful! Please login.');
      router.push('/login');
      return true;
    } catch (error) {
      console.error('Registration error:', error.response?.data?.message || error.message);
      // alert(error.response?.data?.message || 'Registration failed');
      throw error; // Re-throw
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
