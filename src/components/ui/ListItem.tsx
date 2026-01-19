import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { DynamicIcon } from './DynamicIcon';

interface ListItemProps {
    icon?: string;
    label: string;
    value?: string;
    onPress?: () => void;
    isDestructive?: boolean;
    hasChevron?: boolean;
}

export const ListItem = ({
    icon,
    label,
    value,
    onPress,
    isDestructive = false,
    hasChevron = true
}: ListItemProps) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center justify-between p-4 bg-white active:bg-gray-50 border-b border-gray-100 last:border-0 ${isDestructive ? 'bg-red-50/30' : ''}`}
        >
            <View className="flex-row items-center gap-3 flex-1">
                {icon && (
                    <View className={`w-10 h-10 rounded-xl items-center justify-center ${isDestructive ? 'bg-red-100' : 'bg-gray-100'}`}>
                        <DynamicIcon
                            name={icon}
                            size={20}
                            color={isDestructive ? '#ef4444' : '#6b7280'}
                        />
                    </View>
                )}
                <Text className={`font-medium text-base ${isDestructive ? 'text-red-600' : 'text-gray-900'}`}>
                    {label}
                </Text>
            </View>
            <View className="flex-row items-center gap-2">
                {value && <Text className="text-gray-400 text-sm">{value}</Text>}
                {hasChevron && !isDestructive && (
                    <DynamicIcon name="ChevronRight" size={18} color="#d1d5db" />
                )}
            </View>
        </TouchableOpacity>
    );
};
