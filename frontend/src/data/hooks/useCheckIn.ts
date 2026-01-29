/**
 * Check-in Hook
 * 
 * Business logic hook cho tính năng chấm công.
 * Orchestrate giữa Location, Network, API và Sync Queue.
 * 
 * Flow:
 * 1. Lấy location (useSafeLocation)
 * 2. Tạo UUID (expo-crypto)
 * 3. Check network (expo-network)
 * 4. Nếu online → Gửi API ngay
 * 5. Nếu offline hoặc API fail (5xx) → Lưu queue
 * 6. Return UI state tương ứng
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

import { useSafeLocation } from '@/core/hardware';
import { SyncQueue } from '@/core/sync';
import { AttendanceAPI } from '@/data/api/attendance.api';
import type { CheckInPayload, CheckInResponse } from '@/data/api/attendance.api';

/**
 * Check-in result (discriminated union)
 */
type CheckInResult =
    | { mode: 'online'; data: CheckInResponse }
    | { mode: 'offline'; queue_id: string }
    | { mode: 'queued'; queue_id: string; reason: string };

/**
 * Hook useCheckIn
 * 
 * @example
 * const { checkIn, isLoading, data, error } = useCheckIn();
 * 
 * const handlePress = async () => {
 *   try {
 *     await checkIn();
 *     if (data?.mode === 'online') {
 *       Alert.alert('Thành công!');
 *     } else {
 *       Alert.alert('Đã lưu offline');
 *     }
 *   } catch (err) {
 *     Alert.alert('Lỗi', err.message);
 *   }
 * };
 */
export const useCheckIn = () => {
    const { getLocation } = useSafeLocation();
    const [queueId, setQueueId] = useState<string | null>(null);

    const mutation = useMutation<CheckInResult, Error>({
        mutationFn: async (): Promise<CheckInResult> => {
            // ============================================================
            // STEP 1: LẤY LOCATION
            // ============================================================
            console.log('[useCheckIn] Step 1: Fetching location...');

            const locationResult = await getLocation();

            if (!locationResult.success) {
                throw new Error(`LOCATION_ERROR: ${locationResult.error}`);
            }

            const { latitude, longitude, accuracy, is_mock } = locationResult.data;

            console.log(
                `[useCheckIn] Location acquired: (${latitude}, ${longitude}) | ` +
                `Mock: ${is_mock}`
            );

            // ============================================================
            // STEP 2: TẠO PAYLOAD
            // ============================================================
            const uuid = Crypto.randomUUID();
            const timestamp = new Date().toISOString();
            const device_timestamp = Date.now();

            const payload: CheckInPayload = {
                uuid,
                latitude,
                longitude,
                accuracy,
                timestamp,
                device_timestamp,
                is_mock,
                device_info: {
                    model: Device.modelName ?? 'Unknown',
                    os: Platform.OS,
                },
                // TODO: Lấy BSSID WiFi nếu backend yêu cầu
                // bssid: await getWifiBSSID(),
            };

            console.log(`[useCheckIn] Payload created | UUID: ${uuid}`);

            // ============================================================
            // STEP 3: CHECK NETWORK
            // ============================================================
            console.log('[useCheckIn] Step 3: Checking network...');

            const networkState = await Network.getNetworkStateAsync();
            const isOnline = networkState.isConnected && networkState.isInternetReachable;

            console.log(
                `[useCheckIn] Network state: ${isOnline ? 'Online' : 'Offline'} | ` +
                `Type: ${networkState.type}`
            );

            // ============================================================
            // STEP 4a: OFFLINE → QUEUE NGAY
            // ============================================================
            if (!isOnline) {
                console.log('[useCheckIn] Offline detected, enqueueing...');

                const id = await SyncQueue.enqueue(payload);
                setQueueId(id);

                return {
                    mode: 'offline',
                    queue_id: id,
                };
            }

            // ============================================================
            // STEP 4b: ONLINE → GỬI API
            // ============================================================
            console.log('[useCheckIn] Online, sending API request...');

            try {
                const response = await AttendanceAPI.checkIn(payload);

                console.log(
                    `[useCheckIn] ✅ API success | ` +
                    `Type: ${response.data.type} | ` +
                    `Status: ${response.data.status}`
                );

                return {
                    mode: 'online',
                    data: response,
                };

            } catch (error: any) {
                console.error('[useCheckIn] ❌ API error:', error.message);

                // CRITICAL: Phân loại lỗi

                // Case 1: Server error (5xx) → Queue để retry
                if (error.response?.status >= 500) {
                    console.log('[useCheckIn] Server error, enqueueing for retry...');

                    const id = await SyncQueue.enqueue(payload);
                    setQueueId(id);

                    return {
                        mode: 'queued',
                        queue_id: id,
                        reason: 'Server error, will retry automatically',
                    };
                }

                // Case 2: Client error (400, 401, 403, 422)
                // → KHÔNG queue, báo lỗi cho user ngay
                if (error.response?.status >= 400 && error.response?.status < 500) {
                    const serverMessage = error.response?.data?.message || error.message;
                    throw new Error(serverMessage);
                }

                // Case 3: Network error (timeout, DNS fail)
                // → Queue
                if (!error.response) {
                    console.log('[useCheckIn] Network error, enqueueing...');

                    const id = await SyncQueue.enqueue(payload);
                    setQueueId(id);

                    return {
                        mode: 'queued',
                        queue_id: id,
                        reason: 'Network error, will retry when online',
                    };
                }

                // Case 4: Unknown error
                throw error;
            }
        },

        // React Query options
        retry: false, // Không retry tự động (đã có custom logic)
        networkMode: 'always', // Cho phép chạy kể cả offline
    });

    return {
        /** Hàm chấm công */
        checkIn: mutation.mutate,

        /** Hàm chấm công async (cho try-catch) */
        checkInAsync: mutation.mutateAsync,

        /** Loading state */
        isLoading: mutation.isPending,

        /** Error (chỉ có khi là client error) */
        error: mutation.error,

        /** Result data */
        data: mutation.data,

        /** Queue ID (nếu đã lưu offline) */
        queueId,

        /** Reset state */
        reset: mutation.reset,
    };
};
