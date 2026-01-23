import { create } from 'zustand';

// Simple mock auth store for now
// Will replace with real auth logic later
interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    user: any | null; // Add user to state
    login: (token: string, user: any) => void; // Update login signature
    updateUser: (user: any) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    token: null,
    user: null,
    login: (token, user) => set({ isAuthenticated: true, token, user }),
    updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
    logout: () => set({ isAuthenticated: false, token: null, user: null }),
}));

// Hook for compatibility with previous plan
export function useAuth() {
    const { isAuthenticated, token, user, login, logout, updateUser } = useAuthStore();

    return {
        isAuthenticated,
        token,
        user,
        login,
        updateUser,
        logout,
    };
}
