// src/services/useGroupService.js
import apiClient from '@/services/axios';

export const useGroupService = {
    async getGroups(params) {
        try {
            const response = await apiClient.post('/api/admin/groups/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeGroup(groupData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/groups', groupData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateGroup(groupId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/groups/${groupId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteGroups(groupsIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/groups', { data: { groups: groupsIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
