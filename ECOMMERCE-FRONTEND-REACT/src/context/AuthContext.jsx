import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user in localStorage on app start
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      console.log('AuthContext: Attempting login with credentials:', credentials);
      const response = await authService.login(credentials);
      console.log('AuthContext: Login response received:', response);
      
      if (response.success && response.user) {
        setUser(response.user);
        toast.success('Login successful!');
        return { success: true };
      } else {
        const errorMessage = response.message || 'Login failed';
        console.log('AuthContext: Login failed with message:', errorMessage);
        toast.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      let errorMessage = 'Login failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Server not available. Please try again later.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid email or password';
      }
      
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        toast.success('Registration successful! Please login.');
        return { success: true };
      } else {
        toast.error(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const loginSeller = async (credentials) => {
    try {
      const response = await authService.loginSeller(credentials);
      if (response.success) {
        const userWithRole = { ...response.seller, role: 'SELLER' };
        setUser(userWithRole);
        toast.success('Seller login successful!');
        return { success: true };
      } else {
        toast.error(response.message || 'Seller login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Seller login failed';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const loginAdmin = async (credentials) => {
    try {
      const response = await authService.loginAdmin(credentials);
      if (response.success) {
        const userWithRole = { ...response.admin, role: 'ADMIN' };
        setUser(userWithRole);
        toast.success('Admin login successful!');
        return { success: true };
      } else {
        toast.error(response.message || 'Admin login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Admin login failed';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const registerSeller = async (sellerData) => {
    try {
      const response = await authService.registerSeller(sellerData);
      if (response.success) {
        toast.success('Seller registration successful! Please login.');
        return { success: true };
      } else {
        toast.error(response.message || 'Seller registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Seller registration failed';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = async (userId, userData) => {
    try {
      await authService.updateUser(userId, userData);
      setUser(prev => ({ ...prev, ...userData }));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    loginSeller,
    registerSeller,
    loginAdmin,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
