/**
 * Root Layout - Minimal Test Version
 * 
 * Temporarily simplified to test core sync infrastructure
 */

import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/core/query-client';
import React from 'react';
import '../global.css';

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(main)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
            </Stack>
        </QueryClientProvider>
    );
}
