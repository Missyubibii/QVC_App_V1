export interface LoginResponse {
    access_token: string;
    refresh_token: string;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    permissions: string[];
    is_deleted?: boolean; // Critical field for Ban Hammer
    is_banned?: boolean;
}

export interface LoginPayload {
    email: string;
    password?: string;
}
