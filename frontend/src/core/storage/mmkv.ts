import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';

// Khởi tạo instance
export const storage = new MMKV({
    id: 'user-settings-storage',
});

/**
 * Wrapper để hỗ trợ Web (Antigravity)
 * Vì MMKV là JSI Native, không chạy trên Web.
 */
export const AppStorage = {
    setItem: (key: string, value: string | number | boolean | object) => {
        const stringValue = JSON.stringify(value);
        if (Platform.OS === 'web') {
            localStorage.setItem(key, stringValue);
        } else {
            storage.set(key, stringValue);
        }
    },

    getItem: <T>(key: string): T | null => {
        let value: string | undefined | null;

        if (Platform.OS === 'web') {
            value = localStorage.getItem(key);
        } else {
            value = storage.getString(key);
        }

        if (!value) return null;
        try {
            return JSON.parse(value) as T;
        } catch {
            return null;
        }
    },

    removeItem: (key: string) => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
        } else {
            storage.delete(key);
        }
    },

    clearAll: () => {
        if (Platform.OS === 'web') {
            localStorage.clear();
        } else {
            storage.clearAll();
        }
    }
};
