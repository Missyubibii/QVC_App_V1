import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export const AppleAuth = {
    signIn: async () => {
        // 1. Web / Mock Guard
        if (Platform.OS === 'web' || process.env.EXPO_PUBLIC_IS_MOCK === 'true') {
            console.log('⚠️ Using Mock Apple Login');
            return {
                identityToken: 'mock-apple-token-123',
                user: { email: 'mock@apple.com', fullName: { givenName: 'Mock' } }
            };
        }

        // 2. Check Apple Auth Available (iOS only)
        if (Platform.OS !== 'ios') {
            throw new Error('Apple Sign-In only available on iOS');
        }

        // 3. Real Native Login
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            return credential;
        } catch (error) {
            console.error('Apple Sign-In Error:', error);
            throw error;
        }
    }
};
