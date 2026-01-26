import React, { useEffect } from 'react';
import { Platform, AppState } from 'react-native';

/**
 * App Tracking Transparency Provider
 * Handles mandatory iOS 14.5+ permission request for tracking
 * 
 * ⚠️ CRITICAL: expo-tracking-transparency KHÔNG hoạt động trong Expo Go
 * → Phải build development client hoặc production APK/IPA
 * → Tạm thời comment out để app chạy được
 */
export function ATTProvider({ children }: { children: React.ReactNode }) {
    // ⚠️ DISABLED: ATT logic until production build
    // Expo Go không support expo-tracking-transparency
    // require() ở line 33 gây crash toàn bộ app

    /* ORIGINAL CODE - UNCOMMENT khi build production:
    
    useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === 'active') {
                requestATTPermission();
            }
        };

        // Request on mount
        requestATTPermission();

        // Re-check on app resume (in case user changed settings)
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, []);

    const requestATTPermission = async () => {
        if (Platform.OS !== 'ios') return;

        try {
            // Dynamic require to avoid web bundling issues
            const TrackingTransparency = require('expo-tracking-transparency');

            const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();

            if (status === 'granted') {
                console.log('[ATT] Permission granted - Analytics can start');
            } else {
                console.log('[ATT] Permission denied - Analytics disabled');
            }
        } catch (error) {
            console.error('[ATT] Error requesting permission:', error);
        }
    };
    */

    return <>{children}</>;
}
