import api from './api';

export const appointmentService = {
  bookAppointment: async (bookingData) => {
    const response = await api.post('/appointments', bookingData);
    return response.data;
  },

  getAppointmentById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  getPatientAppointments: async () => {
    const response = await api.get('/appointments/patient/me');
    return response.data;
  },

  getDoctorAppointments: async () => {
    const response = await api.get('/appointments/doctor/me');
    return response.data;
  },

  cancelAppointment: async (id) => {
    const response = await api.put(`/appointments/${id}/cancel`);
    return response.data;
  },
};
