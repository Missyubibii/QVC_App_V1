import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DynamicIcon } from '../../components/ui/DynamicIcon';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientBlob } from '../../components/ui/GradientBlob';
import { useAuthStore } from '../../modules/auth/auth.store';

export default function HomeScreen() {
    const { user } = useAuthStore();

    // Helper function to format date
    const getFormattedDate = () => {
        const d = new Date();
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[d.getDay()];
        const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        return `${dayName}, ${dateStr}`;
    };

    return (
        <View className="flex-1 bg-[#F5F5F7]">
            {/* Background Gradients */}
            <GradientBlob className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-400 opacity-10 rounded-full blur-[60px]" />
            <GradientBlob className="absolute bottom-[20%] right-[-10%] w-[300px] h-[300px] bg-purple-400 opacity-10 rounded-full blur-[60px]" />

            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-5 py-4 items-center justify-center z-10 relative">
                    <View className="items-center">
                        <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-[2px] mb-0.5">{getFormattedDate()}</Text>
                        <Text className="text-lg font-extrabold text-gray-900 tracking-tight">QUỐC VIỆT SUPER APP</Text>
                    </View>

                    <TouchableOpacity className="absolute right-5 w-10 h-10 rounded-full bg-white shadow-sm border border-slate-50 items-center justify-center">
                        <DynamicIcon name="Bell" size={20} color="#475569" />
                        <View className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white shadow-sm" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Performance Card */}
                    <GlassCard className="p-4 mb-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-100">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="font-semibold text-gray-700">Hiệu suất tháng 1</Text>
                            <View className="px-2 py-1 bg-blue-600 rounded-lg">
                                <Text className="text-white text-sm font-bold">98%</Text>
                            </View>
                        </View>
                        <View className="flex-row justify-between gap-3">
                            <View className="flex-1 bg-white/60 p-3 rounded-xl items-center">
                                <Text className="text-2xl font-bold text-gray-800">18</Text>
                                <Text className="text-xs text-gray-500 mt-1">Công chấm</Text>
                            </View>
                            <View className="flex-1 bg-white/60 p-3 rounded-xl items-center">
                                <Text className="text-2xl font-bold text-orange-500">1</Text>
                                <Text className="text-xs text-gray-500 mt-1">Đi muộn</Text>
                            </View>
                            <View className="flex-1 bg-white/60 p-3 rounded-xl items-center">
                                <Text className="text-2xl font-bold text-green-600">5</Text>
                                <Text className="text-xs text-gray-500 mt-1">Hoàn thành</Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Quick Utilities */}
                    <Text className="font-semibold text-gray-700 mb-3 px-1">Tiện ích nhanh</Text>
                    <View className="flex-row flex-wrap gap-4">
                        {[
                            { label: 'Đơn từ', icon: 'FileText', color: 'bg-orange-100', iconColor: '#ea580c' },
                            { label: 'Bảng lương', icon: 'Smartphone', color: 'bg-green-100', iconColor: '#059669' },
                            { label: 'Quy định', icon: 'Shield', color: 'bg-purple-100', iconColor: '#7c3aed' },
                            { label: 'Cài đặt', icon: 'Settings', color: 'bg-gray-100', iconColor: '#6b7280' },
                        ].map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                className="flex-1 min-w-[45%] max-w-[48%]"
                            >
                                <GlassCard className="p-4 items-center justify-center gap-2 h-32 active:scale-95">
                                    <View className={`p-3 rounded-full ${item.color}`}>
                                        <DynamicIcon name={item.icon} size={24} color={item.iconColor} />
                                    </View>
                                    <Text className="font-medium text-gray-700 text-center">{item.label}</Text>
                                </GlassCard>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
