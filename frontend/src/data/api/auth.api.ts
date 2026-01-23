import { apiClient } from './client';

export interface LoginResponse {
    token: string;
    user: {
        id: number;
        code: string;
        name: string;
        email: string;
        avatar?: string;
        position?: string;
    };
    expires_in?: number;
    token_type?: string;
}

export interface LoginRequest {
    email?: string;
    password?: string;
    // Support potential other login methods if needed in future
    username?: string;
}

// Internal interface for backend response structure
interface BackendLoginResponse {
    code: number;
    status: string;
    message: string;
    data: {
        access_token: string;
        expires_in: number;
        token_type: string;
        user: any;
    };
    trace_id: string;
}

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<BackendLoginResponse>('/auth/login', credentials);
        const body = response.data;

        // Check if authentication was actually successful
        if (body.code === 200 && body.data?.access_token) {
            return {
                token: body.data.access_token,
                user: body.data.user,
                expires_in: body.data.expires_in,
                token_type: body.data.token_type
            };
        }

        throw new Error(body.message || 'Back-end returned unsuccessfull code');
    },

    updateProfile: async (data: { name?: string; email?: string; phone?: string; avatar?: string }): Promise<any> => {
        const response = await apiClient.post('/auth/update', data);
        return response.data;
    }
};
