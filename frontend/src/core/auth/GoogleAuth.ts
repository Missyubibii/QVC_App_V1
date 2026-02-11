import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export const GoogleAuth = {
    configure: () => {
        if (Platform.OS !== 'web') {
            try {
                GoogleSignin.configure({
                    // scopes: ['email', 'profile'], // Tùy chỉnh
                });
            } catch (e) {
                console.warn('Google Signin configure failed (ok if in mock mode)');
            }
        }
    },

    signIn: async () => {
        // 1. Web / Mock Guard
        if (Platform.OS === 'web' || process.env.EXPO_PUBLIC_IS_MOCK === 'true') {
            console.log('⚠️ Using Mock Google Login');
            return {
                idToken: 'mock-google-token-123',
                user: { email: 'mock@test.com', name: 'Mock User' }
            };
        }

        // 2. Real Native Login
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            return userInfo.data; // Expo 52+ / GoogleSignin v11+ return structure
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            throw error;
        }
    }
};
