import { create } from 'zustand';
// ⚠️ REMOVED: persist middleware
// Lý do: SecureStore KHÔNG available trong Expo Go
// → Zustand persist hydration crash khi gọi getItemAsync()
// → App crash NGAY khi import useAuthStore
//
// Để enable lại persist:
// 1. Build development client: npx expo run:android / npx expo run:ios
// 2. HOẶC: Dùng EAS Build
// 3. KHÔNG dùng Expo Go để test SecureStore

// Simple mock auth store for now
// Will replace with real auth logic later
interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    user: any | null; // Add user to state
    login: (token: string, user: any) => Promise<void>; // Update login signature
    updateUser: (user: any) => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    token: null,
    user: null,
    login: async (token, user) => {
        set({ isAuthenticated: true, token, user });
    },
    updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
    logout: async () => {
        set({ isAuthenticated: false, token: null, user: null });
    },
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
