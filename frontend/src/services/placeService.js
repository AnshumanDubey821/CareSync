import api from './api';

export const placeService = {
  /**
   * Safe status check to see if Google Places is enabled and its limits.
   */
  getStatus: async () => {
    const response = await api.get('/places/status');
    return response.data;
  },

  /**
   * Search Indian medical places (hospitals, clinics, pharmacies).
   * @param {Object} params { query, city, placeType, pageSize }
   */
  searchPlaces: async (params = {}) => {
    const response = await api.get('/places/search', { params });
    return response.data;
  },

  /**
   * Retrieve full place details by Place ID.
   * @param {string} placeId
   */
  getPlaceDetails: async (placeId) => {
    const response = await api.get(`/places/${encodeURIComponent(placeId)}`);
    return response.data;
  },

  /**
   * Build backend proxy URL for place photo (keeps API key secure).
   * @param {string} photoReference
   * @param {number} maxHeightPx
   * @param {number} maxWidthPx
   */
  getPhotoUrl: (photoReference, maxHeightPx = 400, maxWidthPx = 600) => {
    if (!photoReference) return null;
    return `/api/places/photos/${encodeURIComponent(photoReference)}?maxHeightPx=${maxHeightPx}&maxWidthPx=${maxWidthPx}`;
  },

  /**
   * Admin-only: Retrieve persistent monthly quota and cost usage.
   */
  getAdminUsage: async () => {
    const response = await api.get('/places/admin/usage');
    return response.data;
  },

  /**
   * Admin-only: Reset monthly usage counter.
   */
  resetAdminUsage: async () => {
    const response = await api.post('/places/admin/usage/reset');
    return response.data;
  },
};
