import { AppConfig } from '../../config/app-config';
import axiosClient from '../../core/networking/axios-client';
import { LoginPayload, LoginResponse, UserProfile } from './auth.types';

// --- MOCK DATA ---
const MOCK_TOKEN = "mock_access_token_123456789";
const MOCK_USER: UserProfile = {
    id: "user_01",
    name: "Nguyễn Quốc Việt",
    email: "admin@quocviet.com",
    avatar: "https://i.pravatar.cc/300?img=11",
    permissions: ["admin", "view_reports"],
    is_deleted: false,
    is_banned: false,
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AuthRepo = {
    async login(payload: LoginPayload): Promise<LoginResponse> {
        if (AppConfig.USE_MOCK_DATA) {
            await delay(AppConfig.MOCK_DELAY_MS);
            // Mock Validation
            if (payload.email === 'admin@quocviet.com' && payload.password === '123456') {
                return { access_token: MOCK_TOKEN, refresh_token: "mock_refresh_token" };
            }
            if (payload.email === 'banned@quocviet.com') {
                return { access_token: "banned_token", refresh_token: "mock_refresh_token" };
            }
            throw new Error("Thông tin đăng nhập không chính xác (Mock: admin@quocviet.com / 123456)");
        }

        const { data } = await axiosClient.post<LoginResponse>('/auth/login', payload);
        return data;
    },

    async getProfile(): Promise<UserProfile> {
        if (AppConfig.USE_MOCK_DATA) {
            await delay(AppConfig.MOCK_DELAY_MS);

            // Check which token is currently stored to return correct mock user
            const { storage } = require('../../core/storage'); // Lazy require to avoid circular dependency if any
            const token = await storage.getSecureItem('access_token');

            if (token === "banned_token") {
                return {
                    ...MOCK_USER,
                    id: "user_banned",
                    name: "Banned User",
                    email: "banned@quocviet.com",
                    is_banned: true,
                };
            }

            return MOCK_USER;
        }

        const { data } = await axiosClient.get<UserProfile>('/me');
        return data;
    },

    async deleteAccount(): Promise<void> {
        if (AppConfig.USE_MOCK_DATA) {
            await delay(AppConfig.MOCK_DELAY_MS);
            console.log("Mock Delete Account Success");
            return;
        }
        await axiosClient.delete('/account');
    },
};
