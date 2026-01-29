/**
 * Safe Location Hook
 * 
 * Hook lấy vị trí GPS an toàn, xử lý TOÀN BỘ edge cases:
 * 1. Simulator/Antigravity → Mock location
 * 2. Permission denied → Alert + Deep link Settings
 * 3. Location timeout → Fail gracefully
 * 4. Mock GPS detection → Flag is_mock
 * 
 * Tại sao cần file này?
 * - Gọi trực tiếp expo-location trong UI → Crash khi không có quyền
 * - iOS không bao giờ hỏi quyền lại sau khi user từ chối lần đầu
 * - Simulator không có GPS thật → Cần mock
 * 
 * Apple Compliance:
 * - Guideline 2.1: Không crash khi thiếu quyền
 * - Guideline 5.1.2: Giải thích TẠI SAO cần quyền TRƯỚC KHI xin
 */

import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

/**
 * Location result (success case)
 */
export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    is_mock: boolean;
}

/**
 * Location error types
 */
export type LocationError =
    | 'PERMISSION_DENIED'      // User bấm "Don't Allow" lần đầu
    | 'PERMISSION_BLOCKED'     // iOS: User đã từ chối trước đó, không thể xin lại
    | 'LOCATION_UNAVAILABLE'   // GPS hardware error
    | 'TIMEOUT'                // Quá 10s không lấy được location
    | 'UNKNOWN';               // Lỗi không xác định

/**
 * Discriminated union return type (type-safe)
 */
export type LocationResult =
    | { success: true; data: LocationData }
    | { success: false; error: LocationError };

/**
 * Mock location (Văn phòng Vinh City)
 * Dùng cho Simulator/Antigravity testing
 */
const OFFICE_MOCK_LOCATION: LocationData = {
    latitude: 18.6793,
    longitude: 105.6818,
    accuracy: 10, // Mock accuracy (rất chính xác)
    is_mock: true,
};

/**
 * Timeout cho getCurrentPositionAsync (ms)
 * Tránh treo app mãi mãi khi GPS yếu
 */
const LOCATION_TIMEOUT = 10000; // 10 seconds

/**
 * Hook lấy vị trí an toàn
 */
export const useSafeLocation = () => {
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Lấy vị trí với error handling đầy đủ
     * 
     * @returns LocationResult (discriminated union)
     * 
     * @example
     * const { getLocation } = useSafeLocation();
     * 
     * const result = await getLocation();
     * if (result.success) {
     *   console.log(result.data.latitude);
     * } else {
     *   console.error(result.error);
     * }
     */
    const getLocation = useCallback(async (): Promise<LocationResult> => {
        setIsLoading(true);

        try {
            // ============================================================
            // CASE 1: SIMULATOR/ANTIGRAVITY
            // ============================================================
            if (!Device.isDevice) {
                console.log(
                    '[useSafeLocation] Running on simulator/Antigravity, ' +
                    'returning mock location immediately'
                );
                setIsLoading(false);
                return { success: true, data: OFFICE_MOCK_LOCATION };
            }

            // ============================================================
            // CASE 2: REAL DEVICE - CHECK PERMISSION
            // ============================================================
            const { status } = await Location.getForegroundPermissionsAsync();

            console.log(`[useSafeLocation] Current permission status: ${status}`);

            // CASE 2a: Permission chưa xin → Xin lần đầu
            if (status === Location.PermissionStatus.UNDETERMINED) {
                console.log('[useSafeLocation] Permission undetermined, requesting...');

                // Hiện rationale trước khi xin quyền (Apple best practice)
                await showPermissionRationale();

                const { status: newStatus } = await Location.requestForegroundPermissionsAsync();

                if (newStatus !== Location.PermissionStatus.GRANTED) {
                    console.warn('[useSafeLocation] Permission denied by user');
                    setIsLoading(false);
                    return { success: false, error: 'PERMISSION_DENIED' };
                }

                console.log('[useSafeLocation] Permission granted!');
            }

            // CASE 2b: Permission đã bị denied vĩnh viễn (iOS behavior)
            if (status === Location.PermissionStatus.DENIED) {
                console.error('[useSafeLocation] Permission permanently denied');
                setIsLoading(false);

                // Hiện Alert hướng dẫn vào Settings (Apple compliance)
                showSettingsAlert();

                return { success: false, error: 'PERMISSION_BLOCKED' };
            }

            // ============================================================
            // CASE 3: PERMISSION OK - LẤY VỊ TRÍ
            // ============================================================
            console.log('[useSafeLocation] Fetching current position...');

            // Wrap trong Promise.race để timeout
            const locationPromise = Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced, // Cân bằng tốc độ & độ chính xác
                timeInterval: 5000,
                distanceInterval: 0,
            });

            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                    reject(new Error('TIMEOUT'));
                }, LOCATION_TIMEOUT);
            });

            const location = await Promise.race([locationPromise, timeoutPromise]);

            setIsLoading(false);

            const result: LocationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,

                // CRITICAL: Phát hiện Fake GPS
                // iOS/Android sẽ set mocked=true nếu dùng app giả GPS
                is_mock: location.mocked ?? false,
            };

            console.log(
                `[useSafeLocation] Location acquired: ` +
                `(${result.latitude}, ${result.longitude}) | ` +
                `Accuracy: ${result.accuracy}m | ` +
                `Mock: ${result.is_mock}`
            );

            return { success: true, data: result };

        } catch (error: any) {
            console.error('[useSafeLocation] Error:', error);
            setIsLoading(false);

            // Parse error type
            if (error.message === 'TIMEOUT') {
                return { success: false, error: 'TIMEOUT' };
            }

            if (error.code === 'E_LOCATION_UNAVAILABLE') {
                return { success: false, error: 'LOCATION_UNAVAILABLE' };
            }

            return { success: false, error: 'UNKNOWN' };
        }
    }, []);

    return {
        /** Hàm lấy vị trí */
        getLocation,

        /** Loading state (hiển thị spinner) */
        isLoading,
    };
};

/**
 * Hiện Alert giải thích TẠI SAO cần quyền
 * (Apple Guideline 5.1.2 compliance)
 * 
 * @private
 */
async function showPermissionRationale(): Promise<void> {
    return new Promise((resolve) => {
        Alert.alert(
            'Cần quyền truy cập vị trí',
            'Ứng dụng cần biết vị trí của bạn để:\n\n' +
            '• Xác thực bạn đang ở văn phòng khi chấm công\n' +
            '• Chống gian lận chấm công từ xa\n\n' +
            'Vị trí của bạn chỉ được sử dụng khi bấm nút "Chấm công".',
            [
                {
                    text: 'Đồng ý',
                    onPress: () => resolve(),
                },
            ],
            { cancelable: false }
        );
    });
}

/**
 * Hiện Alert hướng dẫn mở Settings
 * (Bắt buộc để pass Apple Review khi permission bị denied)
 * 
 * @private
 */
function showSettingsAlert(): void {
    Alert.alert(
        'Không có quyền truy cập vị trí',
        'Ứng dụng cần quyền truy cập vị trí để xác thực chấm công. ' +
        'Vui lòng bật quyền trong Cài đặt.',
        [
            {
                text: 'Hủy',
                style: 'cancel',
            },
            {
                text: 'Mở Cài đặt',
                onPress: () => {
                    if (Platform.OS === 'ios') {
                        // iOS: Deep link vào app settings
                        Linking.openURL('app-settings:');
                    } else {
                        // Android: Mở app settings
                        Linking.openSettings();
                    }
                },
            },
        ]
    );
}

/**
 * Helper: Format error message cho UI
 * 
 * @param error - LocationError type
 * @returns Human-readable message
 */
export function getLocationErrorMessage(error: LocationError): string {
    switch (error) {
        case 'PERMISSION_DENIED':
            return 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng thử lại.';

        case 'PERMISSION_BLOCKED':
            return 'Không có quyền truy cập vị trí. Vui lòng bật trong Cài đặt.';

        case 'LOCATION_UNAVAILABLE':
            return 'Không thể lấy vị trí. Vui lòng bật GPS và thử lại.';

        case 'TIMEOUT':
            return 'Không thể lấy vị trí (quá thời gian chờ). Vui lòng thử lại.';

        case 'UNKNOWN':
        default:
            return 'Đã xảy ra lỗi khi lấy vị trí. Vui lòng thử lại.';
    }
}
