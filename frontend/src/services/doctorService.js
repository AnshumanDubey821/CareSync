import api from './api';

export const doctorService = {
  searchDoctors: async (params = {}) => {
    const response = await api.get('/doctors', { params });
    return response.data;
  },

  getDoctorById: async (id) => {
    const response = await api.get(`/doctors/${id}`);
    return response.data;
  },

  getDoctorProfile: async () => {
    const response = await api.get('/doctors/me');
    return response.data;
  },

  updateDoctorProfile: async (data) => {
    const response = await api.put('/doctors/me', data);
    return response.data;
  },

  getAvailableSlots: async (doctorId, date) => {
    const response = await api.get(`/doctors/${doctorId}/available-slots`, { params: { date } });
    return response.data;
  },

  addAvailability: async (availabilityData) => {
    const response = await api.post('/availability', availabilityData);
    return response.data;
  },

  getDoctorAvailability: async () => {
    const response = await api.get('/availability/me');
    return response.data;
  },

  updateAvailability: async (id, data) => {
    const response = await api.put(`/availability/${id}`, data);
    return response.data;
  },

  deleteAvailability: async (id) => {
    const response = await api.delete(`/availability/${id}`);
    return response.data;
  },
};
