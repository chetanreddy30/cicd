import api from './api';

export const adminService = {
  login: (credentials) => api.post('/admin/login', credentials),
  getAllUsers: () => api.get('/admin/users'),
  getAllSellers: () => api.get('/admin/sellers'),
  getAllProducts: () => api.get('/admin/products'),
  // Use public orders endpoint which returns full OrderDTOs (includes items and delivery info)
  getAllOrders: () => api.get('/orders'),
  createSeller: (data) => api.post('/admin/create-seller', data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  deleteSeller: (id) => api.delete(`/admin/sellers/${id}`),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  updateOrderStatus: (orderId, status) => api.put(`/admin/orders/${orderId}/status?status=${encodeURIComponent(status)}`)
};

export default adminService;
