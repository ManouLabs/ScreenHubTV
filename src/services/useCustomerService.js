// src/services/useCustomerService.js
import apiClient from '@/services/axios';

export const useCustomerService = {
    async getCustomers(params) {
        try {
            const response = await apiClient.post('/api/admin/customers/filter', { params });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async storeCustomer(customerData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.post('/api/admin/customers', customerData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateCustomer(customerId, updatedData) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.put(`/api/admin/customers/${customerId}`, updatedData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async deleteUsers(usersIds) {
        try {
            await apiClient.get('/sanctum/csrf-cookie');
            const response = await apiClient.delete('/api/admin/users', { data: { users: usersIds } });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
