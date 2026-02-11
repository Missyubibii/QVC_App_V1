import { apiClient } from '@/core/networking/apiClient';
import { GoogleAuth } from '@/core/auth/GoogleAuth';
import { AppleAuth } from '@/core/auth/AppleAuth';
import { z } from 'zod';

const LoginResponseSchema = z.object({
    code: z.literal(200),
    data: z.object({
        access_token: z.string(),
        user: z.object({
            id: z.string(),
            email: z.string(),
            name: z.string(),
        }),
    }),
});

export const AuthRepository = {
    loginWithGoogle: async () => {
        const googleUser = await GoogleAuth.signIn();

        // 🛡️ GUARD: Nếu user hủy login hoặc lỗi, googleUser sẽ null
        if (!googleUser || !googleUser.idToken) {
            throw new Error('Google Sign-In canceled or failed');
        }

        // Gửi idToken lên Backend để verify
        const response = await apiClient.post('/auth/google', {
            id_token: googleUser.idToken,
        });

        const parsed = LoginResponseSchema.parse(response.data);
        return parsed.data;
    },

    loginWithApple: async () => {
        const appleUser = await AppleAuth.signIn();

        // 🛡️ GUARD: Nếu user hủy login hoặc lỗi, appleUser sẽ null
        if (!appleUser || !appleUser.identityToken) {
            throw new Error('Apple Sign-In canceled or failed');
        }

        const response = await apiClient.post('/auth/apple', {
            identity_token: appleUser.identityToken,
        });

        const parsed = LoginResponseSchema.parse(response.data);
        return parsed.data;
    },

    getProfile: async () => {
        const response = await apiClient.get('/user');
        return response.data;
    },
};
