import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#3B82F6',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E2E8F0',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="attendance"
                options={{
                    title: 'Chấm công',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="finger-print" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'Lịch sử',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="time" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Cá nhân',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
