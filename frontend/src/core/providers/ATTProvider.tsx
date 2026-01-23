import React, { useEffect } from 'react';
import { Platform, AppState } from 'react-native';

/**
 * App Tracking Transparency Provider
 * Handles mandatory iOS 14.5+ permission request for tracking
 */
export function ATTProvider({ children }: { children: React.ReactNode }) {
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
            // This strict check ensures bundler doesn't try to include it for web
            const TrackingTransparency = require('expo-tracking-transparency');

            // This will show the prompt defined in app.json NSUserTrackingUsageDescription
            const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();

            if (status === 'granted') {
                console.log('[ATT] Permission granted - Analytics can start');
                // Initialize marketing/analytics SDKs here
            } else {
                console.log('[ATT] Permission denied - Analytics disabled');
                // Disable tracking
            }
        } catch (error) {
            console.error('[ATT] Error requesting permission:', error);
        }
    };

    return <>{children}</>;
}
