import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { DynamicIcon } from '../components/ui/DynamicIcon';
import { GlassCard } from '../components/ui/GlassCard';
import { GradientBlob } from '../components/ui/GradientBlob';
import { useAuthStore } from '../modules/auth/auth.store';

import { useToastStore } from '../core/state/toast-store';

const loginSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải hơn 6 ký tự'),
});

type FormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const { showToast } = useToastStore();

    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            await login(data);
            router.replace('/(tabs)');
            showToast({ type: 'success', title: 'Xin chào', message: 'Đăng nhập thành công' });
        } catch (error: any) {
            showToast({
                type: 'error',
                title: 'Đăng nhập thất bại',
                message: error.message || 'Vui lòng kiểm tra lại thông tin.'
            });
        }
    };

    return (
        <View className="flex-1 bg-[#F5F5F7] justify-center relative">
            {/* Hiệu ứng nền nhẹ nhàng */}
            <GradientBlob className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-400 opacity-10 rounded-full blur-[80px]" />
            <GradientBlob className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-400 opacity-10 rounded-full blur-[80px]" />

            <SafeAreaView className="flex-1 px-6 justify-center">
                {/* Sử dụng GlassCard nhưng điều chỉnh opacity để giống một "Frame" trắng nổi bật */}
                <GlassCard className="p-6 w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border-white/80 rounded-[32px] bg-white">

                    {/* Header & Logo - Style vuông bo góc giống Screenshot */}
                    <View className="items-center mb-8">
                        <View className="w-24 h-24 bg-white rounded-2xl items-center justify-center mb-4 border border-slate-100 shadow-sm">
                            <Image
                                source={require('../../assets/images/icon.png')}
                                className="w-14 h-14"
                                resizeMode="contain"
                            />
                        </View>
                        <Text className="text-2xl font-extrabold text-slate-800 text-center tracking-tight">
                            Quoc Viet<Text className="text-blue-600">.</Text>
                        </Text>
                        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-1">
                            SUPER APP SYSTEM
                        </Text>
                    </View>

                    {/* Email Input */}
                    <View className="mb-4">
                        <Text className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                            Email
                        </Text>
                        <Controller
                            control={control}
                            name="email"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View className={`flex-row items-center w-full px-4 rounded-xl bg-white border h-12 ${errors.email ? 'border-red-400' : 'border-slate-200 focus:border-blue-500'}`}>
                                    <DynamicIcon name="User" size={18} color={errors.email ? "#ef4444" : "#94a3b8"} />
                                    <TextInput
                                        className="flex-1 ml-3 text-slate-800 font-medium text-sm h-full"
                                        placeholder="name@example.com"
                                        placeholderTextColor="#cbd5e1"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                            )}
                        />
                        {errors.email && <Text className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.email.message}</Text>}
                    </View>

                    {/* Password Input */}
                    <View className="mb-8">
                        <Text className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                            Mật khẩu
                        </Text>
                        <Controller
                            control={control}
                            name="password"
                            render={({ field: { onChange, onBlur, value } }) => (
                                <View className={`flex-row items-center w-full px-4 rounded-xl bg-white border h-12 ${errors.password ? 'border-red-400' : 'border-slate-200 focus:border-blue-500'}`}>
                                    <DynamicIcon name="Lock" size={18} color={errors.password ? "#ef4444" : "#94a3b8"} />
                                    <TextInput
                                        className="flex-1 ml-3 text-slate-800 font-medium text-sm h-full"
                                        placeholder="******"
                                        placeholderTextColor="#cbd5e1"
                                        onBlur={onBlur}
                                        onChangeText={onChange}
                                        value={value}
                                        secureTextEntry
                                    />
                                </View>
                            )}
                        />
                        {errors.password && <Text className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{errors.password.message}</Text>}
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit(onSubmit)}
                        disabled={isLoading}
                        activeOpacity={0.9}
                        className={`w-full py-3 rounded-xl shadow-lg shadow-blue-600/30 flex-row items-center justify-center space-x-2 ${isLoading ? 'bg-slate-300' : 'bg-blue-600'
                            }`}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <Text className="text-white font-bold text-base">Đăng nhập</Text>
                                <DynamicIcon name="ArrowRight" size={18} color="white" />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Footer */}
                    <View className="mt-6 items-center">
                        <Text className="text-slate-400 text-[10px] font-medium">© 2026 Quoc Viet Technology Co., Ltd.</Text>
                    </View>

                </GlassCard>
            </SafeAreaView>
        </View>
    );
}