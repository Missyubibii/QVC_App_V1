import "../src/global.css";
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/useAuthStore';
import { enableConsoleCapture } from '@/core/logger/consoleOverride';
import '../src/global.css';

// Giữ Splash Screen hiển thị
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { isInitialized, isAuthenticated, hydrate } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    // 1. Enable Console Capture
    useEffect(() => {
        enableConsoleCapture();
    }, []);

    // 2. Khởi động Auth
    useEffect(() => {
        hydrate();
    }, []);

    // 3. Ẩn Splash Screen khi đã load xong
    useEffect(() => {
        if (isInitialized) {
            SplashScreen.hideAsync();
        }
    }, [isInitialized]);

    // 3. Bảo vệ Route (Navigation Guard)
    useEffect(() => {
        if (!isInitialized) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (isAuthenticated && inAuthGroup) {
            // Đã login mà đang ở trang Login -> Đá về Home
            router.replace('/(tabs)/home');
        } else if (!isAuthenticated && !inAuthGroup) {
            // Chưa login mà đang ở trang trong -> Đá về Login
            router.replace('/(auth)/login');
        }
    }, [isInitialized, isAuthenticated, segments]);

    return <Slot />;
}
