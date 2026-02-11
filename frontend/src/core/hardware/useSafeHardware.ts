import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import { Platform } from 'react-native';
import { Env } from '@/core/config/env';

export const useSafeHardware = () => {
    const isMock = Env.EXPO_PUBLIC_IS_MOCK === 'true' || Platform.OS === 'web';

    const getLocation = async () => {
        if (isMock) {
            console.log('📍 [MOCK] Location requested -> Returning Vinh City');
            return {
                coords: {
                    latitude: 18.6789,
                    longitude: 105.6789,
                    accuracy: 10,
                    altitude: null,
                    altitudeAccuracy: null,
                    heading: null,
                    speed: null,
                },
                timestamp: Date.now(),
                mocked: true,
            };
        }

        // Real Native Call
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Permission denied');
        }
        return await Location.getCurrentPositionAsync({});
    };

    const requestCameraPermission = async () => {
        if (isMock) {
            console.log('📷 [MOCK] Camera permission -> Granted');
            return { status: 'granted', mocked: true };
        }

        const { status } = await Camera.requestCameraPermissionsAsync();
        return { status, mocked: false };
    };

    return {
        getLocation,
        requestCameraPermission,
        isMock
    };
};
