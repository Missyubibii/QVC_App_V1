import { create } from 'zustand';
import { storage } from '../../core/storage';
import { AuthRepo } from './auth.repo';
import { LoginPayload, UserProfile } from './auth.types';

interface AuthState {
    token: string | null;
    user: UserProfile | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (payload: LoginPayload) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    token: null,
    user: null,
    isLoading: false,
    isAuthenticated: false,

    login: async (payload: LoginPayload) => {
        set({ isLoading: true });
        try {
            // 1. Get Token
            const { access_token } = await AuthRepo.login(payload);
            await storage.setSecureItem('access_token', access_token);
            set({ token: access_token });

            // 2. Get Profile
            const user = await AuthRepo.getProfile();

            // 3. ZERO TRUST: Check Ban/Deleted Status
            if (user.is_deleted || user.is_banned) {
                throw new Error("Tài khoản của bạn đã bị vô hiệu hóa.");
            }

            await storage.setItem('user_profile', JSON.stringify(user));
            set({ user, isAuthenticated: true });

        } catch (error: any) {
            console.error("Lỗi đăng nhập:", error);
            // Clean up if partial success
            await get().logout();
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await storage.removeSecureItem('access_token');
            await storage.removeItem('user_profile');
            set({ token: null, user: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
        }
    },

    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const token = await storage.getSecureItem('access_token');
            if (!token) {
                set({ isAuthenticated: false });
                return;
            }

            // Optimistic: Set token first
            set({ token, isAuthenticated: true });

            // Verify with Server (Zero Trust)
            const user = await AuthRepo.getProfile();

            if (user.is_deleted || user.is_banned) {
                await get().logout();
                return;
            }

            set({ user });
            await storage.setItem('user_profile', JSON.stringify(user));
        } catch (error) {
            // If token invalid, logout
            await get().logout();
        } finally {
            set({ isLoading: false });
        }
    },

    deleteAccount: async () => {
        set({ isLoading: true });
        try {
            await AuthRepo.deleteAccount();
            await get().logout();
        } catch (error) {
            console.error("Delete Account Error", error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    }
}));
