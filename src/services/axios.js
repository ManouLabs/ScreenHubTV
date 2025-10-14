// src/services/axios.js
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoading } from '@/stores/useLoadingStore';
import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
    withCredentials: true,
    withXSRFToken: true
});

const startPageLoading = () => useLoading().startPageLoading();
const stopPageLoading = () => useLoading().stopPageLoading();

apiClient.interceptors.request.use(
    async (config) => {
        startPageLoading();

        // Best-practice: inject Echo socket id on mutating requests so server does not echo broadcasts back
        try {
            const method = (config.method || '').toLowerCase();
            const isMutating = method && method !== 'get';
            const socketId = typeof window !== 'undefined' ? window?.Echo?.socketId?.() : undefined;

            if (isMutating && socketId) {
                if (!config.headers) config.headers = {};
                // Respect any explicitly provided header
                const hasHeader = (typeof config.headers.get === 'function' && config.headers.get('X-Socket-Id')) || config.headers['X-Socket-Id'];
                if (!hasHeader) {
                    if (typeof config.headers.set === 'function') {
                        config.headers.set('X-Socket-Id', socketId);
                    } else {
                        config.headers['X-Socket-Id'] = socketId;
                    }
                }
            }
        } catch (_) {
            // No-op: don't let header injection break requests
        }

        return config;
    },
    (error) => {
        stopPageLoading();
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        stopPageLoading();
        return response;
    },
    async (error) => {
        stopPageLoading();
        const status = error.status;
        if ([401, 419].includes(status)) {
            const authStore = useAuthStore();

            authStore.handleSessionExpired();
        }

        return Promise.reject(error);
    }
);

export default apiClient;
