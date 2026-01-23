import axios from 'axios';
import { Platform } from 'react-native';

// Use local IP for Android emulator (10.0.2.2) or iOS simulator (localhost)
// const DEV_API_URL = Platform.OS === 'android' 
//   ? 'http://10.0.2.2:8081/api' 
//   : 'http://localhost:8081/api';

import { API_CONFIG } from '@/core/config/api.config';

export const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: API_CONFIG.TIMEOUT,
});

import { useAuthStore } from '../hooks/useAuth';

// Add interceptors for auth token
apiClient.interceptors.request.use(
    async (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
