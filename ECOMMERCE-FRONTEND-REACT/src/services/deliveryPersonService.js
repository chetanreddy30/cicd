import api from './api';

export const deliveryPersonService = {
  getAll: () => api.get('/delivery-persons'),
  getActive: () => api.get('/delivery-persons/active'),
  getById: (id) => api.get(`/delivery-persons/${id}`),
  create: (data) => api.post('/delivery-persons', data),
  update: (id, data) => api.put(`/delivery-persons/${id}`, data),
  delete: (id) => api.delete(`/delivery-persons/${id}`),
  findByLocation: (location) => api.get(`/delivery-persons?location=${encodeURIComponent(location)}`)
};

export default deliveryPersonService;