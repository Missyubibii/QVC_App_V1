import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';

// Office location (example coordinates - Hà Nội)
// TODO: Fetch this from backend API
const OFFICE_LOCATION = {
    latitude: 21.0285,
    longitude: 105.8542,
    radius: 100, // meters
    name: 'Văn phòng chính',
    address: 'Hoàn Kiếm, Hà Nội',
};

export default function LocationVerificationScreen() {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [loading, setLoading] = useState(true);
    const [distance, setDistance] = useState<number | null>(null);
    const [isWithinRange, setIsWithinRange] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Lỗi', 'Cần cấp quyền vị trí để chấm công', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
                return;
            }

            try {
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });
                setLocation(loc);

                // Calculate distance from office
                const dist = calculateDistance(
                    loc.coords.latitude,
                    loc.coords.longitude,
                    OFFICE_LOCATION.latitude,
                    OFFICE_LOCATION.longitude
                );
                setDistance(dist);
                setIsWithinRange(dist <= OFFICE_LOCATION.radius);
            } catch (error) {
                Alert.alert('Lỗi', 'Không thể lấy vị trí. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    const handleContinue = () => {
        if (!isWithinRange) {
            Alert.alert(
                'Ngoài phạm vi',
                `Bạn đang cách văn phòng ${Math.round(distance || 0)}m (cho phép: ${OFFICE_LOCATION.radius}m). Vẫn tiếp tục?`,
                [
                    { text: 'Hủy', style: 'cancel' },
                    {
                        text: 'Tiếp tục',
                        onPress: () => router.push('/check-in/face')
                    },
                ]
            );
        } else {
            router.push('/check-in/face');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Đang lấy vị trí GPS...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Xác minh vị trí</Text>
                    <View style={{ width: 24 }} />
                </View>
            </LinearGradient>

            {/* Map View */}
            <View style={styles.mapContainer}>
                {location ? (
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        showsUserLocation
                        showsMyLocationButton
                    >
                        {/* Office Marker */}
                        <Marker
                            coordinate={{
                                latitude: OFFICE_LOCATION.latitude,
                                longitude: OFFICE_LOCATION.longitude,
                            }}
                            title={OFFICE_LOCATION.name}
                            description={OFFICE_LOCATION.address}
                        >
                            <View style={styles.officeMarker}>
                                <Ionicons name="business" size={24} color="#FFFFFF" />
                            </View>
                        </Marker>

                        {/* Allowed Radius */}
                        <Circle
                            center={{
                                latitude: OFFICE_LOCATION.latitude,
                                longitude: OFFICE_LOCATION.longitude,
                            }}
                            radius={OFFICE_LOCATION.radius}
                            fillColor="rgba(59, 130, 246, 0.2)"
                            strokeColor="rgba(59, 130, 246, 0.5)"
                            strokeWidth={2}
                        />
                    </MapView>
                ) : (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Không thể hiển thị bản đồ</Text>
                    </View>
                )}
            </View>

            {/* Status Card */}
            <View style={styles.statusCard}>
                <View style={[
                    styles.statusIcon,
                    { backgroundColor: isWithinRange ? '#10B981' : '#EF4444' }
                ]}>
                    <Ionicons
                        name={isWithinRange ? 'checkmark-circle' : 'alert-circle'}
                        size={48}
                        color="#FFFFFF"
                    />
                </View>

                <Text style={styles.statusTitle}>
                    {isWithinRange ? 'Trong phạm vi' : 'Ngoài phạm vi'}
                </Text>

                <Text style={styles.distanceText}>
                    Khoảng cách: {distance ? Math.round(distance) : '--'}m
                </Text>

                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                    >
                        <LinearGradient
                            colors={isWithinRange ? ['#3B82F6', '#2563EB'] : ['#F59E0B', '#D97706']}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonText}>
                                {isWithinRange ? 'Tiếp tục' : 'Vẫn tiếp tục'}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748B',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    mapContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#64748B',
    },
    officeMarker: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    statusCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
        alignItems: 'center',
        marginTop: -24, // Overlay slightly on map
    },
    statusIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: -64, // Floating effect
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
    },
    distanceText: {
        fontSize: 18,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 24,
    },
    actionContainer: {
        width: '100%',
    },
    continueButton: {
        borderRadius: 12,
        overflow: 'hidden',
        width: '100%',
    },
    buttonGradient: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 16,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});
