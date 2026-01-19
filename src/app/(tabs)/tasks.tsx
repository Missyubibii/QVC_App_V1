import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DynamicIcon } from '../../components/ui/DynamicIcon';
import { GlassCard } from '../../components/ui/GlassCard';

const TASKS = [
    { id: 1, title: "Thiết kế Banner Tết", deadline: "2026-01-22", status: "new", assignee: "Sếp Tổng", description: "Banner chính cho chiến dịch Marketing" },
    { id: 2, title: "Báo cáo doanh thu Q1", deadline: "2026-01-20", status: "due_soon", assignee: "Trưởng phòng", description: "Cần nộp trước 17:00 chiều nay" },
    { id: 3, title: "Họp triển khai dự án X", deadline: "2026-01-18", status: "overdue", assignee: "Giám đốc", description: "Đã quá hạn 2 ngày" },
    { id: 4, title: "Đặt lịch khách hàng VIP", deadline: "2026-01-25", status: "new", assignee: "Trưởng nhóm", description: "Khách hàng cty ABC" },
];

export default function TasksScreen() {
    const [filter, setFilter] = useState('all');

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'due_soon': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'new': return 'Mới giao';
            case 'due_soon': return 'Sắp hết hạn';
            case 'overdue': return 'Quá hạn';
            default: return '';
        }
    };

    const filteredTasks = filter === 'all'
        ? TASKS
        : TASKS.filter(t => t.status === filter);

    return (
        <View className="flex-1 bg-[#F5F5F7]">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-5 py-4 bg-white/80 flex-row justify-between items-center">
                    <Text className="text-2xl font-bold text-gray-900">Nhiệm vụ</Text>
                    <TouchableOpacity>
                        <Text className="text-blue-600 text-sm font-semibold active:opacity-60">Thêm mới</Text>
                    </TouchableOpacity>
                </View>

                {/* Filter Chips */}
                <View className="bg-gray-50/50 border-b border-gray-100/50">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                    >
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setFilter('all')}
                                className={`px-4 py-2 rounded-full ${filter === 'all' ? 'bg-gray-800 shadow-sm' : 'bg-white border border-gray-200'}`}
                            >
                                <Text className={`text-sm font-medium ${filter === 'all' ? 'text-white' : 'text-gray-500'}`}>
                                    Tất cả
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setFilter('new')}
                                className={`px-4 py-2 rounded-full ${filter === 'new' ? 'bg-blue-500 shadow-sm' : 'bg-white border border-gray-200'}`}
                            >
                                <Text className={`text-sm font-medium ${filter === 'new' ? 'text-white' : 'text-gray-500'}`}>
                                    Mới giao
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setFilter('due_soon')}
                                className={`px-4 py-2 rounded-full ${filter === 'due_soon' ? 'bg-orange-500 shadow-sm' : 'bg-white border border-gray-200'}`}
                            >
                                <Text className={`text-sm font-medium ${filter === 'due_soon' ? 'text-white' : 'text-gray-500'}`}>
                                    Sắp hết hạn
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setFilter('overdue')}
                                className={`px-4 py-2 rounded-full ${filter === 'overdue' ? 'bg-red-500 shadow-sm' : 'bg-white border border-gray-200'}`}
                            >
                                <Text className={`text-sm font-medium ${filter === 'overdue' ? 'text-white' : 'text-gray-500'}`}>
                                    Quá hạn
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>

                {/* Tasks List */}
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
                    {filteredTasks.length === 0 ? (
                        <View className="items-center justify-center py-20 opacity-50">
                            <DynamicIcon name="ClipboardList" size={48} color="#9ca3af" />
                            <Text className="text-gray-500 mt-4">Không có nhiệm vụ nào</Text>
                        </View>
                    ) : (
                        filteredTasks.map((task) => (
                            <GlassCard key={task.id} className="mb-4 p-4 bg-white active:scale-[0.98]">
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className={`px-2.5 py-1 rounded-md border ${getStatusColor(task.status)}`}>
                                        <Text className="text-[10px] font-bold uppercase tracking-wide">
                                            {getStatusLabel(task.status)}
                                        </Text>
                                    </View>
                                    {task.status === 'overdue' && (
                                        <DynamicIcon name="AlertTriangle" size={16} color="#ef4444" />
                                    )}
                                </View>

                                <Text className="text-gray-900 font-bold text-lg mb-1 leading-snug">{task.title}</Text>
                                <Text className="text-gray-500 text-sm mb-3 line-clamp-2">{task.description}</Text>

                                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100/50">
                                    <View className="flex-row items-center gap-2">
                                        <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center">
                                            <Text className="text-xs font-bold text-blue-600">
                                                {task.assignee.charAt(0)}
                                            </Text>
                                        </View>
                                        <Text className="text-xs text-gray-500">{task.assignee}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-1.5">
                                        <DynamicIcon name="Calendar" size={14} color="#9ca3af" />
                                        <Text className="text-xs font-medium text-gray-500">{task.deadline}</Text>
                                    </View>
                                </View>
                            </GlassCard>
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
