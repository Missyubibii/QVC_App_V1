import { BlurView } from 'expo-blur';
import React from 'react';
import { ViewProps } from 'react-native';
// Standard nativewind v4 usage usually doesn't need 'cn' unless defined. 
// I will just use template literals.

interface GlassCardProps extends ViewProps {
    intensity?: number;
}

export const GlassCard = ({ children, style, className, intensity = 50, ...props }: GlassCardProps) => {
    return (
        <BlurView
            intensity={intensity}
            tint="light"
            className={`overflow-hidden rounded-2xl bg-white/60 ${className || ''}`}
            style={style}
            {...props}
        >
            {children}
        </BlurView>
    );
};
