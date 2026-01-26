import { API_CONFIG } from './api.config';

/**
 * Fail-Fast ENV Validation
 * Tuân thủ Chương 1.6: App phải crash ngay nếu cấu hình sai
 */
export function validateEnv() {
    const errors: string[] = [];

    // ✅ Check API URL exists
    if (!API_CONFIG.BASE_URL) {
        errors.push('❌ API_CONFIG.BASE_URL không được để trống');
    }

    // ✅ Check not pointing to localhost in production
    if (API_CONFIG.BASE_URL && API_CONFIG.BASE_URL.includes('localhost') && !__DEV__) {
        errors.push('❌ Production build không được trỏ về localhost');
    }

    // ✅ Check HTTPS in production
    if (!__DEV__ && API_CONFIG.BASE_URL && !API_CONFIG.BASE_URL.startsWith('https://')) {
        errors.push('❌ Production API phải dùng HTTPS');
    }

    if (errors.length > 0) {
        console.error('🚨 ENV Validation Failed:\n' + errors.join('\n'));
        throw new Error('Invalid environment configuration. App cannot start. Check console for details.');
    }

    console.log('✅ ENV Validation passed:', {
        BASE_URL: API_CONFIG.BASE_URL,
        TIMEOUT: API_CONFIG.TIMEOUT,
        IS_DEV: __DEV__,
    });
}
