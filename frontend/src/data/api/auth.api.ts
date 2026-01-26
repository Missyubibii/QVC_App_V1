import { apiClient } from './client';
import { LoginResponseSchema, type LoginResponse } from '../schemas/auth.schema';

export interface LoginRequest {
    email?: string;
    password?: string;
    // Support potential other login methods if needed in future
    username?: string;
}

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        // ✅ Gọi đúng endpoint backend: /app/login (không phải /auth/login)
        const response = await apiClient.post('/app/login', credentials);
        const body = response.data;

        // ✅ Zod validation - Fail fast nếu backend trả về sai format
        try {
            const validated = LoginResponseSchema.parse(body);

            // ✅ Transform sang format frontend cần (convert null → undefined)
            return {
                token: validated.data.access_token,
                user: {
                    id: validated.data.user.id,
                    code: validated.data.user.code,
                    name: validated.data.user.name,
                    email: validated.data.user.email,
                    avatar: validated.data.user.avatar ?? undefined,
                    position: validated.data.user.position ?? undefined,
                },
                expires_in: validated.data.expires_in,
                token_type: validated.data.token_type,
            };
        } catch (error: any) {
            console.error('[Auth API] ❌ Response validation failed:', error.message);
            console.error('[Auth API] Received:', JSON.stringify(body, null, 2));
            throw new Error('Backend trả về response không đúng format. Check console logs.');
        }
    },

    updateProfile: async (data: { name?: string; email?: string; phone?: string; avatar?: string }): Promise<any> => {
        const response = await apiClient.post('/auth/update', data);
        return response.data;
    }
};
