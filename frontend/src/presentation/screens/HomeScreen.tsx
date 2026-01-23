import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Smartphone, Shield, Settings, Bell, ChevronRight } from 'lucide-react-native';
import { FlashList } from '@shopify/flash-list';
import { Card } from '../components/Card'; // Giả định bạn đã có component này như plan
import { Badge } from '../components/Badge'; // Giả định bạn đã có component này như plan
import { ROUTES } from '@/core/router/routes';
import { useAppNavigation } from '@/core/router/navigator';
import { useAuth } from '@/data/hooks/useAuth';

// --- HELPERS (GIỮ NGUYÊN) ---
const getStatusLabel = (status: string) => {
    switch (status) {
        case 'new': return 'Mới giao';
        case 'due_soon': return 'Sắp hết hạn';
        case 'overdue': return 'Quá hạn';
        default: return '';
    }
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'new': return 'default'; // Blue/Gray
        case 'due_soon': return 'warning'; // Yellow
        case 'overdue': return 'error'; // Red
        default: return 'default';
    }
};

// --- SUB-COMPONENTS (REFACTORED UI) ---

// 1. StatBox: Tinh chỉnh lại font size và spacing cho gọn
const StatBox = ({ number, label, color = "text-gray-800" }: { number: string, label: string, color?: string }) => (
    <View className="flex-1 items-center justify-center py-2">
        <Text className={`text-xl font-bold ${color}`}>{number}</Text>
        <Text className="text-xs text-gray-500 font-medium mt-1">{label}</Text>
    </View>
);

// 2. QuickAction: Chuyển sang layout dọc nhỏ gọn (Icon trên, Text dưới) để xếp hàng 4
const QuickAction = ({ label, icon: Icon, color, bg, onPress }: any) => (
    <TouchableOpacity
        onPress={onPress}
        className="w-1/4 items-center justify-center py-2" // Chia 4 cột
        activeOpacity={0.7}
    >
        <View className={`w-12 h-12 rounded-2xl ${bg} items-center justify-center mb-2 shadow-sm`}>
            <Icon size={22} className={color} color={color.replace('text-', '').replace('-600', '') === 'orange' ? '#ea580c' : color.replace('text-', '').replace('-600', '') === 'green' ? '#16a34a' : color.replace('text-', '').replace('-600', '') === 'purple' ? '#9333ea' : '#4b5563'} />
        </View>
        <Text className="text-xs font-medium text-gray-600 text-center" numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
);

// --- MOCK DATA ---
const TASKS_MOCK = [
    { id: 1, title: "Thiết kế Banner Tết", deadline: "2026-01-22", status: "new", assignee: "Sếp Tổng", description: "Banner chính cho chiến dịch Marketing" },
    { id: 2, title: "Báo cáo doanh thu Q1", deadline: "2026-01-20", status: "due_soon", assignee: "Trưởng phòng", description: "Cần nộp trước 17:00 chiều nay" },
    { id: 3, title: "Họp triển khai dự án X", deadline: "2026-01-18", status: "overdue", assignee: "Giám đốc", description: "Đã quá hạn 2 ngày" },
    { id: 4, title: "Đặt lịch khách hàng VIP", deadline: "2026-01-25", status: "new", assignee: "Trưởng nhóm", description: "Khách hàng cty ABC" },
];

// --- MAIN SCREEN ---
export function HomeScreen() {
    const { navigate } = useAppNavigation();
    const { user } = useAuth(); // Get real user data

    // Default avatar if none provided from backend
    const defaultAvatar = "https://ui-avatars.com/api/?background=2563eb&color=fff&name=" + (user?.name || "User");

    // Render Item: Task Card (Style Card chuẩn Web: trắng, shadow nhẹ, bo góc)
    const renderTaskItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => console.log('Task pressed', item.id)}
            className="mb-4 mx-5"
        >
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 android:elevation-2">
                {/* Header Card: Badge & Deadline */}
                <View className="flex-row justify-between items-center mb-3">
                    <Badge label={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} />
                    {item.status === 'overdue' && (
                        <View className="flex-row items-center bg-red-50 px-2 py-1 rounded-full">
                            <Text className="text-red-600 text-[10px] font-bold">HẾT HẠN</Text>
                        </View>
                    )}
                </View>

                {/* Title & Desc */}
                <Text className="text-gray-900 font-bold text-lg mb-1 leading-6">{item.title}</Text>
                <Text className="text-gray-500 text-sm mb-4 line-clamp-2" numberOfLines={2}>
                    {item.description}
                </Text>

                {/* Footer Card: Assignee info */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-50">
                    <View className="flex-row items-center gap-2">
                        <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center">
                            <Text className="text-xs font-bold text-indigo-600">{item.assignee.charAt(0)}</Text>
                        </View>
                        <Text className="text-xs text-gray-500 font-medium">{item.assignee}</Text>
                    </View>
                    <Text className="text-xs text-gray-400">{item.deadline}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    // List Header: Chứa toàn bộ phần trên của Dashboard
    const ListHeader = () => (
        <View className="pb-2">
            {/* 1. Header Section: Avatar & Greeting */}
            <View className="px-5 pt-4 mb-6 flex-row justify-between items-center">
                <View>
                    <Text className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Hôm nay, {new Date().toLocaleDateString('vi-VN')}</Text>
                    <Text className="text-2xl font-bold text-gray-900">
                        Chào, {user?.name?.split(' ').pop() || 'Bạn'} 👋
                    </Text>
                </View>
                <TouchableOpacity
                    className="relative"
                    onPress={() => navigate(ROUTES.MAIN.PROFILE)}
                >
                    <Image
                        source={{ uri: user?.avatar || defaultAvatar }}
                        className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                    />
                    <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </TouchableOpacity>
            </View>

            {/* 2. Performance Card (Style giống Widget iOS) */}
            <View className="mx-5 mb-6">
                <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 android:elevation-3">
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center gap-2">
                            <View className="w-1 h-4 bg-blue-600 rounded-full" />
                            <Text className="font-bold text-gray-800 text-base">Hiệu suất tháng 1</Text>
                        </View>
                        <View className="bg-blue-50 px-3 py-1 rounded-full">
                            <Text className="text-blue-700 text-xs font-bold">98% Target</Text>
                        </View>
                    </View>

                    <View className="flex-row divide-x divide-gray-100">
                        <StatBox number="18" label="Công chấm" />
                        <StatBox number="1" label="Đi muộn" color="text-orange-500" />
                        <StatBox number="5" label="Hoàn thành" color="text-green-600" />
                    </View>
                </View>
            </View>

            {/* 3. Quick Actions (Grid 4 cột) */}
            <View className="mx-5 mb-6">
                <Text className="font-bold text-gray-800 mb-3 text-base">Tiện ích nhanh</Text>
                <View className="flex-row flex-wrap bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
                    <QuickAction label="Đơn từ" icon={FileText} color="text-orange-600" bg="bg-orange-50" />
                    <QuickAction label="Bảng lương" icon={Smartphone} color="text-green-600" bg="bg-green-50" />
                    <QuickAction label="Quy định" icon={Shield} color="text-purple-600" bg="bg-purple-50" />
                    <QuickAction label="Cài đặt" icon={Settings} color="text-gray-600" bg="bg-gray-50" onPress={() => navigate(ROUTES.MAIN.SETTINGS)} />
                </View>
            </View>

            {/* 4. Section Title: Tasks */}
            <View className="flex-row justify-between items-end px-5 mb-3">
                <Text className="font-bold text-gray-800 text-base">Nhiệm vụ mới</Text>
                <TouchableOpacity className="flex-row items-center">
                    <Text className="text-blue-600 text-xs font-bold mr-1">Xem tất cả</Text>
                    <ChevronRight size={14} color="#2563eb" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            {/* Dùng gray-50 chuẩn Web Design */}
            <SafeAreaView edges={['top']} className="flex-1">
                <FlashList
                    data={TASKS_MOCK}
                    renderItem={renderTaskItem}
                    estimatedItemSize={160}
                    ListHeaderComponent={ListHeader}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    // Fix props type check tạm thời nếu version FlashList cũ
                    {...({} as any)}
                />
            </SafeAreaView>
        </View>
    );
}