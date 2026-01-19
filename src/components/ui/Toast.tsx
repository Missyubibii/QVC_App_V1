import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastType, useToastStore } from '../../core/state/toast-store';
import { DynamicIcon } from './DynamicIcon';

const ToastIcon = ({ type }: { type: ToastType }) => {
    switch (type) {
        case 'success': return <DynamicIcon name="CheckCircle" size={24} color="#22c55e" />;
        case 'error': return <DynamicIcon name="AlertCircle" size={24} color="#ef4444" />;
        case 'warning': return <DynamicIcon name="AlertTriangle" size={24} color="#f59e0b" />;
        case 'info': default: return <DynamicIcon name="Info" size={24} color="#3b82f6" />;
    }
};

const ToastItem = ({ id, type, title, message, onDismiss }: any) => {
    // Sử dụng Animated chuẩn của React Native (Không dùng Reanimated để tránh lỗi version)
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        // Animation xuất hiện
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                friction: 5,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const borderColor = type === 'error' ? 'border-red-200' :
        type === 'success' ? 'border-green-200' :
            type === 'warning' ? 'border-yellow-200' : 'border-blue-200';

    const bgColor = type === 'error' ? 'bg-red-50' :
        type === 'success' ? 'bg-green-50' :
            type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50';

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: translateY }],
                width: '100%',
                paddingHorizontal: 16,
                marginBottom: 12,
            }}
        >
            <View className={`overflow-hidden rounded-2xl border ${borderColor} ${bgColor} shadow-sm`}>
                <View className="flex-row p-4 items-center">
                    <ToastIcon type={type} />
                    <View className="ml-3 flex-1">
                        {title && <Text className="font-bold text-gray-900 text-sm mb-0.5">{title}</Text>}
                        <Text className="text-gray-700 text-xs font-medium leading-4">{message}</Text>
                    </View>
                    <TouchableOpacity onPress={() => onDismiss(id)} className="p-2 -mr-2">
                        <DynamicIcon name="X" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

export const ToastOverlay = () => {
    const { toasts, hideToast } = useToastStore();
    const insets = useSafeAreaInsets();

    if (toasts.length === 0) return null;

    return (
        <View
            className="absolute left-0 right-0 z-50 flex-col items-center"
            pointerEvents="box-none"
            style={{ top: insets.top + 10 }}
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} {...toast} onDismiss={hideToast} />
            ))}
        </View>
    );
};