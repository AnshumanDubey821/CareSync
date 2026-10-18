import api from './api';

export const prescriptionService = {
  createPrescription: async (data) => {
    const response = await api.post('/prescriptions', data);
    return response.data;
  },

  getPrescriptionById: async (id) => {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },

  getPatientPrescriptions: async () => {
    const response = await api.get('/patients/me/prescriptions');
    return response.data;
  },

  getDoctorPrescriptions: async () => {
    const response = await api.get('/doctors/me/prescriptions');
    return response.data;
  },
};
