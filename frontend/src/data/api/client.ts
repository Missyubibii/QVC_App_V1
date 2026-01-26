import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
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

// ✅ REQUEST INTERCEPTOR - Thêm token vào mỗi request
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

// ✅ RESPONSE INTERCEPTOR - Xử lý lỗi tập trung
apiClient.interceptors.response.use(
    (response) => response, // Response thành công → trả về bình thường
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

        // ❌ LỖI 401 - Token hết hạn hoặc không hợp lệ
        if (error.response?.status === 401) {
            console.log('[API] ❌ 401 Unauthorized - Auto logout');
            useAuthStore.getState().logout(); // Tự động logout
            // Router sẽ tự redirect về login screen nhờ auth guard
            return Promise.reject(error);
        }

        // ❌ LỖI 403 - Không có quyền truy cập
        if (error.response?.status === 403) {
            console.log('[API] ❌ 403 Forbidden - Insufficient permissions');
            return Promise.reject(error);
        }

        // ⚠️ LỖI 500/502/503 - Server error hoặc network error
        // → Áp dụng RETRY LOGIC với exponential backoff
        const isServerError = error.response?.status && error.response.status >= 500;
        const isNetworkError = !error.response && error.code !== 'ECONNABORTED'; // Timeout không retry

        if ((isServerError || isNetworkError) && originalRequest) {
            const retryCount = originalRequest._retryCount || 0;

            if (retryCount < API_CONFIG.MAX_RETRIES) {
                originalRequest._retryCount = retryCount + 1;

                // Exponential backoff: 1s, 2s, 4s
                const delayMs = API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount);

                console.log(`[API] 🔄 Retry ${retryCount + 1}/${API_CONFIG.MAX_RETRIES} sau ${delayMs}ms...`);

                await new Promise(resolve => setTimeout(resolve, delayMs));
                return apiClient(originalRequest);
            }

            console.log('[API] ❌ Đã retry tối đa, request failed');
        }

        // ❌ Các lỗi khác (400, 404, etc.)
        return Promise.reject(error);
    }
);
