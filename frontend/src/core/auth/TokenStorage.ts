import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'auth_token';

export const TokenStorage = {
    setToken: async (token: string) => {
        if (Platform.OS === 'web') {
            localStorage.setItem(KEY, token);
        } else {
            await SecureStore.setItemAsync(KEY, token);
        }
    },

    getToken: async () => {
        if (Platform.OS === 'web') {
            return localStorage.getItem(KEY);
        }
        return await SecureStore.getItemAsync(KEY);
    },

    clearToken: async () => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(KEY);
        } else {
            await SecureStore.deleteItemAsync(KEY);
        }
    }
};
