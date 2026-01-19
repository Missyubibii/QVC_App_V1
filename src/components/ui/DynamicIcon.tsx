import * as Icons from 'lucide-react-native';
import { LucideProps } from 'lucide-react-native';
import React from 'react';

export type IconName = keyof typeof Icons;

interface DynamicIconProps extends LucideProps {
    name: string; // loose typing to allow string from JSON
}

export const DynamicIcon = ({ name, size = 24, color = 'black', ...props }: DynamicIconProps) => {
    const Icon = (Icons as any)[name];

    if (!Icon) {
        console.warn(`Icon "${name}" not found in lucide-react-native`);
        return <Icons.HelpCircle size={size} color={color} {...props} />;
    }

    return <Icon size={size} color={color} {...props} />;
};
