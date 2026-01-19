import axios from 'axios';
import { Env } from '../../config/env';
import { storage } from '../storage';

const axiosClient = axios.create({
    baseURL: Env.EXPO_PUBLIC_API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
axiosClient.interceptors.request.use(
    async (config) => {
        const token = await storage.getSecureItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Errors (401)
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.warn('⚠️ Unauthorized (401) - clearing token...');
            await storage.removeSecureItem('access_token');
            // In a real app, you would trigger a global logout action here.
            // For now, we clear the token so the UI can reactively switch to Login.
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
