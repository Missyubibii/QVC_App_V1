import React from 'react';
import { View, Pressable, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';

interface CardProps {
    children: React.ReactNode;
    className?: string; // For NativeWind
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
}

export function Card({ children, className, style, onPress }: CardProps) {
    const Container = onPress ? Pressable : View;

    return (
        <Container
            onPress={onPress}
            style={[styles.card, style]}
            className={`bg-white rounded-2xl p-4 border border-slate-100 ${className || ''}`}
        >
            {children}
        </Container>
    );
}

const styles = StyleSheet.create({
    card: {
        // iOS Shadow
        shadowColor: '#64748b', // sate-500
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        // Android Elevation
        elevation: 4,
    }
});
