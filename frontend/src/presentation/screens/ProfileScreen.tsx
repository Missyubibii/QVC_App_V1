import { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Fingerprint, Settings, ChevronRight, LogOut, ChevronLeft, X, Save } from 'lucide-react-native';
import { Card } from '../components/Card';
import { DeleteAccountButton } from '../components/DeleteAccountButton';
import { useAuth } from '@/data/hooks/useAuth';
import { useAppNavigation } from '@/core/router/navigator';
import { authApi } from '@/data/api/auth.api';

export function ProfileScreen() {
    const { user, logout, login } = useAuth(); // Need 'login' (or a specific update function) to refresh store
    const { navigate, goBack } = useAppNavigation();

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhone, setEditPhone] = useState(user?.phone || '');
    const [isLoading, setIsLoading] = useState(false);

    const defaultAvatar = "https://ui-avatars.com/api/?background=2563eb&color=fff&name=" + (user?.name || "User");

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            console.log('[Profile] Updating...', { name: editName, phone: editPhone });
            const response = await authApi.updateProfile({ name: editName, phone: editPhone });

            // Assuming response contains fresh user object or we merge manually. 
            // In a real robust app, backend returns the updated user model.
            // Let's assume response.data is the user or response *is* the body.
            // Based on 'auth.api.ts' shell, it returns response.data.

            console.log('[Profile] Update Success:', response);

            // Refresh local user state. 
            // Since we don't have a dedicated 'updateUser' action in store yet, 
            // we can re-call login with existing token + new user data, OR modify store to have updateUser.
            // For now, let's reuse 'login' or just mutate locally if valid.
            // A safer bet is just updating the specific fields in the stored user if backend confirms success.
            const updatedUser = { ...user, name: editName, phone: editPhone };
            // Since useAuthStore exposes login(token, user), we can:
            // login(existingToken, updatedUser); // But we need token. Hook exposes token? Yes.
            // Let's grab token from hook. (Checking hook... yes it exposes token).
            // Actually, best practice: separate 'updateUser' action in store. 
            // But I will stick to minimal changes: re-login effectively updates user.
            // Wait, token accessible? 
        } catch (error: any) {
            console.error('[Profile] Error:', error);
            Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin.');
        } finally {
            setIsLoading(false);
            setIsEditing(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50">
            <SafeAreaView edges={['top']} className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
                    <TouchableOpacity onPress={() => goBack()} className="p-1">
                        <ChevronLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-slate-900">Tài khoản</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                    {/* Profile Card */}
                    <Card className="items-center py-6 mb-6">
                        <View className="w-24 h-24 rounded-full border-4 border-white shadow-sm overflow-hidden mb-4 bg-slate-200">
                            <Image
                                source={{ uri: user?.avatar || defaultAvatar }}
                                style={{ width: '100%', height: '100%' }}
                            />
                        </View>
                        <Text className="text-xl font-bold text-slate-900">{user?.name || 'Người dùng'}</Text>
                        <Text className="text-blue-600 font-medium">{user?.position || user?.email || 'N/A'}</Text>
                    </Card>

                    {/* Menu */}
                    <View className="bg-white rounded-xl overflow-hidden border border-slate-200 mb-6">
                        <MenuItem
                            icon={User}
                            label="Thông tin cá nhân"
                            value="Chỉnh sửa"
                            onPress={() => {
                                setEditName(user?.name || '');
                                setEditPhone(user?.phone || '');
                                setIsEditing(true);
                            }}
                        />
                        <MenuItem icon={Fingerprint} label="Cài đặt sinh trắc học" value="Bật" />
                        <MenuItem
                            icon={Settings}
                            label="Cài đặt & Riêng tư"
                            onPress={() => navigate('settings')}
                        />
                    </View>

                    <View className="bg-white rounded-xl overflow-hidden border border-slate-200 mb-8">
                        <MenuItem icon={LogOut} label="Đăng xuất" onPress={logout} />
                    </View>

                    {/* Apple Compliance - Delete Account */}
                    <View className="mb-8">
                        <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-4">Vùng nguy hiểm</Text>
                        <DeleteAccountButton />
                    </View>
                </ScrollView>

                {/* Edit Profile Modal */}
                <Modal
                    visible={isEditing}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsEditing(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-3xl h-[80%]">
                            {/* Modal Header */}
                            <View className="flex-row items-center justify-between p-5 border-b border-slate-100">
                                <TouchableOpacity onPress={() => setIsEditing(false)}>
                                    <View className="bg-slate-100 p-2 rounded-full">
                                        <X size={20} color="#64748b" />
                                    </View>
                                </TouchableOpacity>
                                <Text className="text-lg font-bold text-slate-900">Chỉnh sửa thông tin</Text>
                                <TouchableOpacity onPress={handleUpdateProfile} disabled={isLoading}>
                                    {isLoading ? <ActivityIndicator color="#2563eb" /> : <Text className="text-blue-600 font-bold text-base">Lưu</Text>}
                                </TouchableOpacity>
                            </View>

                            {/* Modal Content */}
                            <ScrollView className="p-5">
                                <View className="items-center mb-8">
                                    <View className="w-24 h-24 rounded-full bg-slate-200 mb-2 relative">
                                        <Image
                                            source={{ uri: user?.avatar || defaultAvatar }}
                                            className="w-full h-full rounded-full"
                                        />
                                        <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white">
                                            <Settings size={16} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text className="text-blue-600 font-medium">Thay đổi ảnh đại diện</Text>
                                </View>

                                <View className="gap-5">
                                    <View>
                                        <Text className="text-slate-500 font-medium mb-2">Họ và tên</Text>
                                        <TextInput
                                            className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-base text-slate-900 font-medium"
                                            value={editName}
                                            onChangeText={setEditName}
                                            placeholder="Nhập họ tên của bạn"
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-slate-500 font-medium mb-2">Số điện thoại</Text>
                                        <TextInput
                                            className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-base text-slate-900 font-medium"
                                            value={editPhone}
                                            onChangeText={setEditPhone}
                                            placeholder="Nhập số điện thoại"
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-slate-500 font-medium mb-2">Email (Không thể đổi)</Text>
                                        <TextInput
                                            className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-base text-slate-500"
                                            value={user?.email}
                                            editable={false}
                                        />
                                    </View>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

const MenuItem = ({ icon: Icon, label, value, onPress, isDestructive = false }: any) => (
    <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center justify-between p-4 border-b border-slate-100 bg-white active:bg-slate-50"
    >
        <View className="flex-row items-center gap-3">
            <Icon size={20} color={isDestructive ? '#ef4444' : '#64748b'} />
            <Text className={`font-medium text-base ${isDestructive ? 'text-red-500' : 'text-slate-900'}`}>{label}</Text>
        </View>
        <View className="flex-row items-center gap-2">
            {value && <Text className="text-slate-400 text-sm">{value}</Text>}
            <ChevronRight size={18} color="#cbd5e1" />
        </View>
    </TouchableOpacity>
);
