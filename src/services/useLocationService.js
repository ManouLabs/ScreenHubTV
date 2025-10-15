// src/services/useLocationService.js
import apiClient from '@/services/axios';

export const useLocationService = {
    async getLocations(params) {
        try {
            const response = await apiClient.post('/api/admin/locations/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeLocation(locationData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/locations', locationData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateLocation(locationId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/locations/${locationId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteLocations(locationsIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/locations', { data: { locations: locationsIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
