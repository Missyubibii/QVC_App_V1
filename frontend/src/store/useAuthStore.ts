import { create } from 'zustand';
import { TokenStorage } from '@/core/auth/TokenStorage';
import { router } from 'expo-router';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthState {
    isAuthenticated: boolean;
    isInitialized: boolean; // 👈 Cờ kiểm tra trạng thái khởi động
    user: User | null;
    login: (token: string, user: User) => Promise<void>;
    logout: () => Promise<void>;
    hydrate: () => Promise<void>; // Gọi khi App start
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    isInitialized: false, // Mặc định chưa khởi tạo
    user: null,

    login: async (token, user) => {
        await TokenStorage.setToken(token);
        set({ isAuthenticated: true, user });
        router.replace('/(tabs)/home'); // Chuyển hướng sau khi login
    },

    logout: async () => {
        await TokenStorage.clearToken();
        set({ isAuthenticated: false, user: null });
        router.replace('/(auth)/login');
    },

    hydrate: async () => {
        try {
            const token = await TokenStorage.getToken();
            if (token) {
                // TODO: Gọi API /me để lấy thông tin user mới nhất
                set({ isAuthenticated: true, user: { id: '1', email: 'user@test.com', name: 'User' } });
            }
        } catch (e) {
            console.error('Hydration failed', e);
        } finally {
            // 👇 Quan trọng: Luôn đánh dấu đã khởi tạo xong dù có token hay không
            set({ isInitialized: true });
        }
    }
}));
