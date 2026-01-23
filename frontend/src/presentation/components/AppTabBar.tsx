import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, ClipboardList, MapPin, Bell, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Helper functions (Hoisted for performance)
const getIcon = (routeName: string, color: string, size: number) => {
    switch (routeName) {
        case 'index': return <Home size={size} color={color} />; // Home
        case 'task': return <ClipboardList size={size} color={color} />;
        case 'checkin': return <MapPin size={size} color={color} />;
        case 'noti': return <Bell size={size} color={color} />;
        case 'profile': return <User size={size} color={color} />;
        default: return <Home size={size} color={color} />;
    }
};

const getLabel = (routeName: string) => {
    switch (routeName) {
        case 'index': return 'Trang chủ';
        case 'task': return 'Việc';
        case 'checkin': return 'Chấm công';
        case 'noti': return 'Thông báo';
        case 'profile': return 'Cá nhân';
        default: return routeName;
    }
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0', // slate-200
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,

        // Shadow for the floating feeling
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        height: 65, // Fixed height for tab content (excluding safe area)
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    iconContainer: {
        padding: 6,
        borderRadius: 12,
        marginBottom: 2,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
    }
});

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={styles.content}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    // Define colors
                    const color = isFocused ? '#2563eb' : '#94a3b8'; // blue-600 vs slate-400
                    const bgColor = isFocused ? '#eff6ff' : 'transparent'; // blue-50

                    // Don't render if it's a hidden route
                    if (['settings'].includes(route.name)) return null;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            // testID={options.tabBarTestID} // Comment out to fix type error
                            onPress={onPress}
                            style={styles.tabItem}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: bgColor, transform: isFocused ? [{ translateY: -4 }] : [] }]}>
                                {getIcon(route.name, color, isFocused ? 24 : 22)}
                            </View>
                            <Text style={[styles.label, { color }]}>
                                {getLabel(route.name)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
