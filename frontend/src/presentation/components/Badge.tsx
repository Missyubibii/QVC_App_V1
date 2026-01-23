import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
    label: string;
    variant?: 'default' | 'success' | 'warning' | 'error';
    className?: string;
}

export function Badge({ label, variant = 'default', className }: BadgeProps) {
    const getVariantStyle = () => {
        switch (variant) {
            case 'success': return 'bg-green-100 border-green-200';
            case 'warning': return 'bg-orange-100 border-orange-200';
            case 'error': return 'bg-red-100 border-red-200';
            default: return 'bg-blue-100 border-blue-200'; // default
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'success': return 'text-green-700';
            case 'warning': return 'text-orange-700';
            case 'error': return 'text-red-700';
            default: return 'text-blue-700';
        }
    };

    return (
        <View className={`px-2.5 py-1 rounded-md border self-start ${getVariantStyle()} ${className || ''}`}>
            <Text className={`text-[10px] font-bold uppercase tracking-wide ${getTextStyle()}`}>
                {label}
            </Text>
        </View>
    );
}
