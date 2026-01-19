import React from 'react';
import { View, ViewProps } from 'react-native';

interface GradientBlobProps extends ViewProps {
    className?: string;
}

export const GradientBlob = ({ className, style, ...props }: GradientBlobProps) => {
    return (
        <View
            className={`rounded-full ${className}`}
            style={style}
            {...props}
        />
    );
};