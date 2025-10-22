// src/services/useScreenService.js
import apiClient from '@/services/axios';

export const useScreenService = {
    async storeOnboarding(payload) {
        // payload: { device_id, location_id, group_id }
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/screens/onboarding', payload);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
