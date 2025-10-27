// src/services/useScreenService.js
import apiClient from '@/services/axios';

export const useScreenService = {
    async storeOnboarding(params) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/screens/onboarding', params);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    async getScreens() {
        try {
            const response = await apiClient.get('/api/screens');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getScreen(deviceId) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.get(`/api/screens/${deviceId}/exists`);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            throw error;
        }
    },
    async setScreenOnline(deviceId, status) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/screens/${deviceId}/${status}`);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            throw error;
        }
    }
};
