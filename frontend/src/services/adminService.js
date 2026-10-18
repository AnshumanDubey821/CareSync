import api from './api';

export const adminService = {
  getSystemStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getAllDoctors: async () => {
    const response = await api.get('/admin/doctors');
    return response.data;
  },

  getAllPatients: async () => {
    const response = await api.get('/admin/patients');
    return response.data;
  },

  getAllAppointments: async () => {
    const response = await api.get('/admin/appointments');
    return response.data;
  },

  updateAppointmentStatus: async (id, status) => {
    const response = await api.put(`/admin/appointments/${id}/status`, { status });
    return response.data;
  },
};
