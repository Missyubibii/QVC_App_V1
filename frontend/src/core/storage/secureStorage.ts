import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ✅ Fallback cho môi trường dev (Antigravity/Linux)
const IS_DEV_ENV = __DEV__ && Platform.OS === 'web';

export const secureStorage = {
    async setItem(key: string, value: string): Promise<void> {
        if (IS_DEV_ENV) {
            // Fallback to localStorage on dev web
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },

    async getItem(key: string): Promise<string | null> {
        if (IS_DEV_ENV) {
            if (typeof localStorage !== 'undefined') {
                return localStorage.getItem(key);
            }
            return null;
        } else {
            return await SecureStore.getItemAsync(key);
        }
    },

    async removeItem(key: string): Promise<void> {
        if (IS_DEV_ENV) {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
            }
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    }
};
