import api from './api';

export const authService = {
  // User registration
  register: async (userData) => {
    try {
      const response = await api.post('/users/register', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // User login
  login: async (credentials) => {
    try {
      console.log('Attempting user login with:', credentials);
      const response = await api.post('/users/login', credentials);
      console.log('User login response:', response);
      if (response.success && response.user) {
        // Add role to identify as customer/user
        const userWithRole = { ...response.user, role: 'USER' };
        localStorage.setItem('user', JSON.stringify(userWithRole));
        return { ...response, user: userWithRole };
      }
      return response;
    } catch (error) {
      console.error('User login error:', error);
      throw error;
    }
  },

  // Seller registration
  registerSeller: async (sellerData) => {
    try {
      const response = await api.post('/sellers/register', sellerData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Seller login
  loginSeller: async (credentials) => {
    try {
      console.log('Attempting seller login with:', credentials);
      const response = await api.post('/sellers/login', credentials);
      console.log('Seller login response:', response);
      if (response.success && response.seller) {
        // Add role to identify as seller
        const userWithRole = { ...response.seller, role: 'SELLER' };
        localStorage.setItem('user', JSON.stringify(userWithRole));
      }
      return response;
    } catch (error) {
      console.error('Seller login error:', error);
      throw error;
    }
  },

  // Admin login
  loginAdmin: async (credentials) => {
    try {
      console.log('Attempting admin login with:', credentials);
      const response = await api.post('/admin/login', credentials);
      console.log('Admin login response:', response);
      if (response.success && response.admin) {
        const userWithRole = { ...response.admin, role: 'ADMIN' };
        localStorage.setItem('user', JSON.stringify(userWithRole));
        return { ...response, admin: userWithRole };
      }
      return response;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Update user profile
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default authService;
