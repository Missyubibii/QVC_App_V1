import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DynamicIcon } from '../../components/ui/DynamicIcon';
import { GlassCard } from '../../components/ui/GlassCard';
import { GradientBlob } from '../../components/ui/GradientBlob';
import { ListItem } from '../../components/ui/ListItem';
import { useAuthStore } from '../../modules/auth/auth.store';

export default function ProfileScreen() {
    const { user, logout, deleteAccount } = useAuthStore();
    const router = useRouter();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const handleDeleteAccount = () => {
        setShowDeleteConfirm(false);
        Alert.alert(
            "Yêu cầu đã gửi",
            "Tài khoản của bạn sẽ bị xóa vĩnh viễn sau 30 ngày.",
            [{ text: "OK" }]
        );
    };

    return (
        <View className="flex-1 bg-[#F5F5F7]">
            <GradientBlob className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-400 opacity-10 rounded-full blur-[80px]" />

            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-5 py-4 bg-white/80">
                    <Text className="text-2xl font-bold text-gray-900">Tài khoản</Text>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 128 }}>
                    {/* Profile Card */}
                    <GlassCard className="p-6 mb-6 bg-white items-center">
                        <View className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden mb-4">
                            {user?.avatar ? (
                                <Image source={{ uri: user.avatar }} className="w-full h-full" />
                            ) : (
                                <View className="w-full h-full bg-slate-100 items-center justify-center">
                                    <DynamicIcon name="User" size={40} color="#cbd5e1" />
                                </View>
                            )}
                        </View>
                        <Text className="text-xl font-bold text-gray-900">{user?.name || 'Chưa cập nhật'}</Text>
                        <Text className="text-blue-600 font-medium">{user?.email || 'user@example.com'}</Text>
                    </GlassCard>

                    {/* Section 1: Information */}
                    <View className="mb-6">
                        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Thông tin</Text>
                        <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <ListItem icon="User" label="Thông tin cá nhân" value="Chỉnh sửa" />
                            <ListItem icon="Fingerprint" label="Cài đặt sinh trắc học" value="Bật" />
                        </View>
                    </View>

                    {/* Section 2: Legal */}
                    <View className="mb-6">
                        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Pháp lý</Text>
                        <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <ListItem icon="FileText" label="Điều khoản sử dụng (EULA)" />
                            <ListItem icon="Shield" label="Chính sách bảo mật" />
                        </View>
                    </View>

                    {/* Section 3: Account */}
                    <View className="mb-6">
                        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Tài khoản</Text>
                        <View className="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <ListItem
                                icon="LogOut"
                                label="Đăng xuất"
                                onPress={handleLogout}
                                hasChevron={false}
                            />
                        </View>
                    </View>

                    {/* Section 4: Danger Zone */}
                    <View className="mb-6">
                        <Text className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 px-1">Vùng nguy hiểm</Text>
                        <View className="bg-white rounded-xl overflow-hidden border border-red-100">
                            <ListItem
                                icon="Trash2"
                                label="Yêu cầu xóa tài khoản"
                                isDestructive={true}
                                hasChevron={false}
                                onPress={() => setShowDeleteConfirm(true)}
                            />
                        </View>
                        <Text className="text-xs text-gray-400 mt-2 px-1">
                            Theo chính sách App Store, bạn có quyền yêu cầu xóa toàn bộ dữ liệu cá nhân khỏi hệ thống.
                        </Text>
                    </View>
                </ScrollView>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <View className="absolute inset-0 bg-black/70 items-center justify-center px-4" style={{ zIndex: 9999 }}>
                        <View
                            className="bg-white rounded-2xl w-full overflow-hidden"
                            style={{
                                maxWidth: 360,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 20 },
                                shadowOpacity: 0.25,
                                shadowRadius: 25,
                                elevation: 20,
                            }}
                        >
                            {/* Header with Icon */}
                            <View className="bg-red-50 py-6 items-center border-b border-red-100">
                                <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-3">
                                    <DynamicIcon name="AlertTriangle" size={28} color="#ef4444" strokeWidth={2} />
                                </View>
                                <Text className="text-xl font-bold text-gray-900">Xóa tài khoản?</Text>
                            </View>

                            {/* Body */}
                            <View className="px-6 py-5">
                                <Text className="text-gray-700 text-center leading-relaxed mb-1">
                                    Dữ liệu sẽ bị xóa vĩnh viễn sau
                                </Text>
                                <Text className="text-red-600 text-center font-bold text-lg mb-1">30 ngày</Text>
                                <Text className="text-gray-500 text-sm text-center">Bạn có chắc chắn không?</Text>
                            </View>

                            {/* Actions */}
                            <View className="px-4 pb-4 gap-2">
                                <TouchableOpacity
                                    onPress={handleDeleteAccount}
                                    className="w-full py-3.5 bg-red-500 rounded-xl flex-row items-center justify-center gap-2 active:bg-red-600"
                                    style={{ elevation: 2 }}
                                >
                                    <DynamicIcon name="Trash2" size={18} color="#fff" />
                                    <Text className="text-white text-center font-bold">Gửi yêu cầu xóa</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setShowDeleteConfirm(false)}
                                    className="w-full py-3.5 bg-gray-100 rounded-xl active:bg-gray-200"
                                >
                                    <Text className="text-gray-700 text-center font-semibold">Hủy bỏ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}
