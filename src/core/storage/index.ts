import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * CORE STORAGE FACADE
 * - SecureStore: For sensitivity data (tokens, passwords)
 * - AsyncStorage: For general cache and non-sensitive config
 * 
 * STRICT RULE: NEVER USE MMKV (Causes Expo Go Crash)
 */

export const storage = {
    // --- SECURE STORAGE (Tokens) ---
    async setSecureItem(key: string, value: string): Promise<void> {
        try {
            await SecureStore.setItemAsync(key, value);
        } catch (error) {
            console.error('SecureStore Error [setItem]:', error);
            throw error;
        }
    },

    async getSecureItem(key: string): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(key);
        } catch (error) {
            console.error('SecureStore Error [getItem]:', error);
            return null;
        }
    },

    async removeSecureItem(key: string): Promise<void> {
        try {
            await SecureStore.deleteItemAsync(key);
        } catch (error) {
            console.error('SecureStore Error [deleteItem]:', error);
        }
    },

    // --- ASYNC STORAGE (Cache/Settings) ---
    async setItem(key: string, value: string): Promise<void> {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            console.error('AsyncStorage Error [setItem]:', error);
        }
    },

    async getItem(key: string): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error('AsyncStorage Error [getItem]:', error);
            return null;
        }
    },

    async removeItem(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('AsyncStorage Error [removeItem]:', error);
        }
    },

    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('AsyncStorage Error [clear]:', error);
        }
    }
};
