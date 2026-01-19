import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { DynamicIcon } from '../../components/ui/DynamicIcon';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? 20 : 15,
                    left: 20,
                    right: 20,
                    height: 64,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderRadius: 32,
                    borderTopWidth: 0,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 5 },
                    elevation: 5,
                    // Căn giữa các items theo chiều dọc
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    paddingBottom: 0,
                },
                tabBarItemStyle: {
                    height: 64, // Khớp với tabBarStyle.height để iconContainer được căn giữa
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <DynamicIcon
                                name="Home"
                                color={focused ? '#2563eb' : '#94a3b8'}
                                size={24}
                                strokeWidth={focused ? 2.5 : 2}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="tasks"
                options={{
                    title: 'Nhiệm vụ',
                    tabBarIcon: ({ focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <DynamicIcon
                                name="ClipboardList"
                                color={focused ? '#2563eb' : '#94a3b8'}
                                size={24}
                                strokeWidth={focused ? 2.5 : 2}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Cá nhân',
                    tabBarIcon: ({ focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
                            <DynamicIcon
                                name="User"
                                color={focused ? '#2563eb' : '#94a3b8'}
                                size={24}
                                strokeWidth={focused ? 2.5 : 2}
                            />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    iconContainerFocused: {
        backgroundColor: '#eff6ff', // bg-blue-50
    },
});
