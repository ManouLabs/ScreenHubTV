// src/services/useCampaignService.js
import apiClient from '@/services/axios';

export const useCampaignService = {
    async getCampaigns(params) {
        try {
            const response = await apiClient.post('/api/admin/campaigns/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeCampaign(campaignData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/campaigns', campaignData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateCampaign(campaignId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            updatedData.append('_method', 'PUT');
            const response = await apiClient.post(`/api/admin/campaigns/${campaignId}`, updatedData, {
                headers: { 'X-Socket-Id': window.Echo?.socketId?.() }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async toggleCampaignActive(campaignId) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.patch(`/api/admin/campaigns/${campaignId}/toggle-active`, null, {
                headers: { 'X-Socket-Id': window.Echo?.socketId?.() }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteCampaigns(campaignsIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/campaigns', {
                data: { campaigns: campaignsIds },
                headers: { 'X-Socket-Id': window.Echo?.socketId?.() }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
