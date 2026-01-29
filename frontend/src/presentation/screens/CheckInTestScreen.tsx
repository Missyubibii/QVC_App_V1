/**
 * Check-In Test Screen
 * Simplified version để test core sync infrastructure
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useCheckIn } from '@/data/hooks/useCheckIn';
import { BackgroundSyncWorker, SyncQueue } from '@/core/sync';
import { useSafeLocation } from '@/core/hardware';
import LeafletMap from '@/presentation/components/LeafletMap';

export default function CheckInTestScreen() {
    const { checkInAsync, isLoading, data, error } = useCheckIn();
    const { getLocation } = useSafeLocation(); // Use hook to get current location for map

    // State for map location
    const [mapLocation, setMapLocation] = useState<{ lat: number, long: number } | null>(null);

    // State for pending sync items
    const [pendingCount, setPendingCount] = useState<number>(0);
    // State for worker status
    const [workerStatus, setWorkerStatus] = useState<any>(null);

    const updatePendingCount = async () => {
        const count = await SyncQueue.count();
        setPendingCount(count);
    };

    useEffect(() => {
        // Initial fetch for map
        getLocation().then(result => {
            if (result.success) {
                setMapLocation({
                    lat: result.data.latitude,
                    long: result.data.longitude
                });
            }
        });

        // Initial fetch for pending count
        updatePendingCount();
    }, []);

    const handleManualSync = async () => {
        const result = await BackgroundSyncWorker.sync();
        setWorkerStatus(result);
        await updatePendingCount();
        Alert.alert('Kết quả đồng bộ', JSON.stringify(result, null, 2));
    };

    const handleCheckIn = async () => {
        try {
            await checkInAsync();
            await updatePendingCount();
        } catch (err: any) {
            // Error is handled by hook generally, but locally we ensure pending count is updated
            await updatePendingCount();
            // useCheckIn hook will update 'error' state which is displayed in UI
        }
    };

    const handleCheckStatus = async () => {
        const status = await BackgroundSyncWorker.getStatus();
        setWorkerStatus(status);
    };

    return (
        <ScrollView className="flex-1 bg-gray-100 p-4">
            {/* Header */}
            <View className="bg-white rounded-2xl p-6 mb-4">
                <Text className="text-2xl font-bold text-center">
                    🧪 Check-In Test
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                    Testing Offline Sync Infrastructure
                </Text>
            </View>

            {/* Map Visualization */}
            <View className="h-64 mb-4 rounded-2xl overflow-hidden shadow-sm bg-gray-200">
                {mapLocation ? (
                    <LeafletMap
                        latitude={mapLocation.lat}
                        longitude={mapLocation.long}
                        zoom={16}
                    />
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-gray-500">Đang lấy vị trí...</Text>
                    </View>
                )}
            </View>

            {/* Pending Badge */}
            {pendingCount > 0 && (
                <View className="bg-orange-100 p-4 rounded-xl mb-4">
                    <Text className="text-orange-700 font-semibold">
                        📦 Chờ đồng bộ: {pendingCount} items
                    </Text>
                    <TouchableOpacity
                        onPress={handleManualSync}
                        className="bg-orange-500 px-4 py-2 rounded-lg mt-2"
                    >
                        <Text className="text-white text-center font-semibold">
                            Đồng bộ ngay
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Check-in Button */}
            <TouchableOpacity
                onPress={handleCheckIn}
                disabled={isLoading}
                className={`rounded-2xl p-6 mb-4 ${isLoading ? 'bg-gray-300' : 'bg-blue-500'
                    }`}
            >
                <Text className="text-white text-xl font-bold text-center">
                    {isLoading ? '⏳ Đang xử lý...' : '✅ CHẤM CÔNG TEST'}
                </Text>
            </TouchableOpacity>

            {/* Last Result */}
            {data && (
                <View className="bg-green-100 p-4 rounded-xl mb-4">
                    <Text className="text-green-700 font-semibold">
                        ✅ Kết quả: {data.mode}
                    </Text>
                    {data.mode === 'online' && (
                        <Text className="text-gray-600 mt-2">
                            {JSON.stringify(data.data, null, 2)}
                        </Text>
                    )}
                </View>
            )}

            {/* Error */}
            {error && (
                <View className="bg-red-100 p-4 rounded-xl mb-4">
                    <Text className="text-red-700 font-semibold">
                        ❌ Lỗi: {error.message}
                    </Text>
                </View>
            )}

            {/* Debug Buttons */}
            <View className="space-y-2">
                <TouchableOpacity
                    onPress={handleCheckStatus}
                    className="bg-gray-700 p-4 rounded-xl"
                >
                    <Text className="text-white text-center font-semibold">
                        🔍 Check Worker Status
                    </Text>
                </TouchableOpacity>

                {workerStatus && (
                    <View className="bg-gray-100 p-4 rounded-xl">
                        <Text className="text-xs font-mono">
                            {JSON.stringify(workerStatus, null, 2)}
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
