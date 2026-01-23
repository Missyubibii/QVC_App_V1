import { Stack } from 'expo-router';
import { QueryProvider } from '@/core/providers/QueryProvider';
import { ATTProvider } from '@/core/providers/ATTProvider';
import { useAuthGuard } from '@/core/router/navigator';
import React from 'react';

// Separate component for AuthGuard to ensure hooks run inside providers
function AuthGuardWrapper({ children }: { children: React.ReactNode }) {
    useAuthGuard();
    return <>{children}</>;
}

export default function RootLayout() {
    return (
        <QueryProvider>
            <ATTProvider>
                <AuthGuardWrapper>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="(main)" options={{ headerShown: false }} />
                        <Stack.Screen name="+not-found" />
                    </Stack>
                </AuthGuardWrapper>
            </ATTProvider>
        </QueryProvider>
    );
}
