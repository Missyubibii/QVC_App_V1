import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const quickActions = [
        {
            id: 'checkin',
            title: 'Chấm công',
            subtitle: 'Vào/Ra làm việc',
            icon: 'finger-print',
            color: ['#3B82F6', '#2563EB'],
            route: '/check-in/location',
        },
        {
            id: 'leave',
            title: 'Xin nghỉ phép',
            subtitle: 'Đăng ký nghỉ',
            icon: 'calendar',
            color: ['#10B981', '#059669'],
            route: '/(main)/history',
        },
        {
            id: 'history',
            title: 'Lịch sử',
            subtitle: 'Xem bảng công',
            icon: 'time',
            color: ['#F59E0B', '#D97706'],
            route: '/(main)/history',
        },
        {
            id: 'profile',
            title: 'Cá nhân',
            subtitle: 'Thông tin tài khoản',
            icon: 'person',
            color: ['#8B5CF6', '#7C3AED'],
            route: '/(main)/profile',
        },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Xin chào 👋</Text>
                        <Text style={styles.userName}>Nhân viên</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationButton}>
                        <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>3</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        <Text style={styles.statValue}>22</Text>
                        <Text style={styles.statLabel}>Ngày đi làm</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="time" size={24} color="#F59E0B" />
                        <Text style={styles.statValue}>2</Text>
                        <Text style={styles.statLabel}>Đi muộn</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="calendar" size={24} color="#EF4444" />
                        <Text style={styles.statValue}>1</Text>
                        <Text style={styles.statLabel}>Nghỉ phép</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Quick Actions */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>Chức năng</Text>

                <View style={styles.actionsGrid}>
                    {quickActions.map((action) => (
                        <TouchableOpacity
                            key={action.id}
                            style={styles.actionCard}
                            onPress={() => router.push(action.route as any)}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={action.color}
                                style={styles.actionGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name={action.icon as any} size={32} color="#FFFFFF" />
                            </LinearGradient>
                            <Text style={styles.actionTitle}>{action.title}</Text>
                            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Today's Status */}
                <View style={styles.todaySection}>
                    <Text style={styles.sectionTitle}>Hôm nay</Text>
                    <View style={styles.todayCard}>
                        <View style={styles.todayHeader}>
                            <Ionicons name="calendar-outline" size={20} color="#64748B" />
                            <Text style={styles.todayDate}>
                                {new Date().toLocaleDateString('vi-VN', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </Text>
                        </View>

                        <View style={styles.todayStatus}>
                            <View style={styles.statusItem}>
                                <Text style={styles.statusLabel}>Giờ vào</Text>
                                <Text style={styles.statusValue}>--:--</Text>
                            </View>
                            <View style={styles.statusDivider} />
                            <View style={styles.statusItem}>
                                <Text style={styles.statusLabel}>Giờ ra</Text>
                                <Text style={styles.statusValue}>--:--</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.checkinButton}
                            onPress={() => router.push('/check-in/location')}
                        >
                            <LinearGradient
                                colors={['#3B82F6', '#2563EB']}
                                style={styles.checkinGradient}
                            >
                                <Ionicons name="finger-print" size={24} color="#FFFFFF" />
                                <Text style={styles.checkinText}>Chấm công ngay</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 24 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 16,
        color: '#E0E7FF',
        marginBottom: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    notificationButton: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#E0E7FF',
        marginTop: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 24,
        marginBottom: 16,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: (width - 52) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    actionGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
    },
    todaySection: {
        marginTop: 8,
    },
    todayCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    todayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    todayDate: {
        fontSize: 14,
        color: '#64748B',
    },
    todayStatus: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    statusItem: {
        flex: 1,
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 8,
    },
    statusValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    statusDivider: {
        width: 1,
        backgroundColor: '#E2E8F0',
    },
    checkinButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    checkinGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    checkinText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
