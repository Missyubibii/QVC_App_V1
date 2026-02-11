import axios, { AxiosError } from 'axios';
import { Env } from '@/core/config/env';
import { TokenStorage } from '@/core/auth/TokenStorage';
import { useLogStore } from '@/core/logger/logStore';

export const apiClient = axios.create({
    baseURL: Env.EXPO_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000, // 10s timeout
});

// Request: Auto Inject Token + Logging
apiClient.interceptors.request.use(async (config) => {
    const token = await TokenStorage.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // 🔥 Log Network Request
    useLogStore.getState().addLog(
        'NETWORK',
        `⬆️ ${config.method?.toUpperCase()} ${config.url}`,
        {
            headers: config.headers,
            // ⚠️ Cẩn thận: Ẩn password nếu là login endpoint
            data: config.url?.includes('login')
                ? { ...config.data, password: '***' }
                : config.data,
        }
    );

    return config;
});

// Response: Auto Unwrap Envelope & Error Handling + Logging
apiClient.interceptors.response.use(
    (response) => {
        // 1. Guard: Check nếu data không tồn tại hoặc không phải object
        // (Tránh crash khi server trả về HTML/text trong trường hợp 500 error)
        if (!response.data || typeof response.data !== 'object') {
            return response; // Trả về nguyên gốc nếu không đúng format Envelope
        }

        // 2. Lấy body
        const { code, data, message } = response.data;

        // 🔥 Log Network Response
        useLogStore.getState().addLog(
            'NETWORK',
            `⬇️ ${response.status} ${response.config.url}`,
            {
                code,
                data: typeof data === 'object' ? JSON.stringify(data).slice(0, 200) : data,
            }
        );

        // 3. Check Logic Code (Laravel Convention)
        // Nếu HTTP 200 nhưng Code != 200 -> Là lỗi nghiệp vụ
        if (code && code !== 200) {
            return Promise.reject(new Error(message || 'Lỗi nghiệp vụ không xác định'));
        }

        // 4. Unwrap: Trả về data thực sự thay vì cả envelope
        // Giữ nguyên response structure nhưng replace response.data
        response.data = data;
        return response;
    },
    async (error: AxiosError) => {
        // 🔥 Log Network Error
        useLogStore.getState().addLog(
            'ERROR',
            `❌ ${error.response?.status || 'NETWORK_ERR'} ${error.config?.url}`,
            {
                message: error.message,
                response: error.response?.data,
            }
        );

        // Handle 401 Logout
        if (error.response?.status === 401) {
            await TokenStorage.clearToken();
            // Emit event logout hoặc redirect
        }

        // Handle network errors
        if (!error.response) {
            return Promise.reject(new Error('Lỗi kết nối mạng'));
        }

        return Promise.reject(error);
    }
);
