/**
 * Sync Queue Manager
 * 
 * Quản lý hàng đợi offline cho chấm công.
 * Đây là "First-class citizen" thay vì dựa vào React Query Persist.
 * 
 * Tại sao cần file này?
 * - React Query chỉ sync khi app MỞ (foreground)
 * - Nếu user kill app sau khi chấm công offline → Request nằm chết trong cache
 * - Giải pháp: Quản lý queue riêng, hiển thị UI pending count, cho sync thủ công
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { PendingCheckIn } from './types';

const QUEUE_KEY = '@attendance_queue';
const FAILED_QUEUE_KEY = '@attendance_failed_queue';
const MAX_RETRIES = 3;

export class SyncQueue {
    /**
     * Thêm check-in vào hàng đợi
     * 
     * @param payload - Dữ liệu chấm công (không bao gồm id, retry_count, created_at)
     * @returns Queue ID để track item này
     * 
     * @example
     * const queueId = await SyncQueue.enqueue({
     *   uuid: 'abc-123',
     *   latitude: 18.6793,
     *   longitude: 105.6818,
     *   accuracy: 10,
     *   timestamp: '2026-01-29T08:00:00Z',
     *   device_timestamp: Date.now(),
     *   is_mock: false,
     *   device_info: { model: 'iPhone 15', os: 'iOS' }
     * });
     */
    static async enqueue(
        payload: Omit<PendingCheckIn, 'id' | 'retry_count' | 'created_at'>
    ): Promise<string> {
        try {
            const queue = await this.getQueue();

            // Tạo item mới với metadata
            const item: PendingCheckIn = {
                ...payload,
                id: Crypto.randomUUID(), // Local tracking ID
                retry_count: 0,
                created_at: Date.now(),
            };

            // Thêm vào đầu queue (LIFO cho fresh data)
            queue.unshift(item);

            // Persist vào AsyncStorage
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

            console.log(`[SyncQueue] Enqueued item ${item.id} | Server UUID: ${item.uuid}`);

            return item.id;
        } catch (error) {
            console.error('[SyncQueue] Enqueue failed:', error);
            throw new Error('Failed to save to queue');
        }
    }

    /**
     * Lấy toàn bộ queue hiện tại
     * 
     * @returns Mảng các pending check-in items
     */
    static async getQueue(): Promise<PendingCheckIn[]> {
        try {
            const data = await AsyncStorage.getItem(QUEUE_KEY);

            if (!data) {
                return [];
            }

            const queue: PendingCheckIn[] = JSON.parse(data);

            // Validation: Loại bỏ các item quá cũ (> 7 ngày)
            const now = Date.now();
            const validQueue = queue.filter((item) => {
                const age = now - item.created_at;
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                return age < sevenDays;
            });

            // Nếu có item bị loại bỏ, cập nhật lại storage
            if (validQueue.length !== queue.length) {
                await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(validQueue));
                console.warn(
                    `[SyncQueue] Cleaned ${queue.length - validQueue.length} stale items`
                );
            }

            return validQueue;
        } catch (error) {
            console.error('[SyncQueue] Get queue failed:', error);
            return []; // Fail-safe: Trả về mảng rỗng thay vì crash
        }
    }

    /**
     * Xóa item sau khi sync thành công
     * 
     * @param id - Queue item ID (không phải server UUID)
     */
    static async remove(id: string): Promise<void> {
        try {
            const queue = await this.getQueue();
            const filtered = queue.filter((item) => item.id !== id);

            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));

            console.log(`[SyncQueue] Removed item ${id} from queue`);
        } catch (error) {
            console.error('[SyncQueue] Remove failed:', error);
            // Không throw error vì đây là cleanup operation
        }
    }

    /**
     * Tăng retry count khi sync fail
     * Nếu vượt quá MAX_RETRIES → Chuyển sang failed queue
     * 
     * @param id - Queue item ID
     */
    static async incrementRetry(id: string): Promise<void> {
        try {
            const queue = await this.getQueue();
            const itemIndex = queue.findIndex((q) => q.id === id);

            if (itemIndex === -1) {
                console.warn(`[SyncQueue] Item ${id} not found for retry increment`);
                return;
            }

            const item = queue[itemIndex];
            item.retry_count += 1;

            // Kiểm tra max retries
            if (item.retry_count >= MAX_RETRIES) {
                console.error(
                    `[SyncQueue] Item ${id} exceeded max retries (${MAX_RETRIES})`
                );

                // Chuyển sang failed queue để admin xử lý sau
                await this.moveToFailedQueue(item);

                // Xóa khỏi main queue
                queue.splice(itemIndex, 1);
            }

            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        } catch (error) {
            console.error('[SyncQueue] Increment retry failed:', error);
        }
    }

    /**
     * Đếm số lượng items đang chờ sync
     * Dùng để hiển thị badge UI
     * 
     * @returns Số lượng pending items
     */
    static async count(): Promise<number> {
        const queue = await this.getQueue();
        return queue.length;
    }

    /**
     * Xóa toàn bộ queue (dùng cho testing hoặc reset)
     * 
     * ⚠️ NGUY HIỂM: Chỉ dùng khi debug, không gọi trong production flow
     */
    static async clear(): Promise<void> {
        try {
            await AsyncStorage.removeItem(QUEUE_KEY);
            console.log('[SyncQueue] Queue cleared');
        } catch (error) {
            console.error('[SyncQueue] Clear failed:', error);
        }
    }

    /**
     * Chuyển item sang failed queue khi retry quá nhiều lần
     * 
     * @private
     * @param item - Item cần chuyển
     */
    private static async moveToFailedQueue(item: PendingCheckIn): Promise<void> {
        try {
            const failedQueueData = await AsyncStorage.getItem(FAILED_QUEUE_KEY);
            const failedQueue: PendingCheckIn[] = failedQueueData
                ? JSON.parse(failedQueueData)
                : [];

            failedQueue.push({
                ...item,
                // Đánh dấu thời điểm fail
                created_at: Date.now(),
            });

            await AsyncStorage.setItem(FAILED_QUEUE_KEY, JSON.stringify(failedQueue));

            console.warn(
                `[SyncQueue] Moved item ${item.id} to failed queue | Server UUID: ${item.uuid}`
            );

            // TODO: Gửi analytics event để admin biết có item fail
            // Analytics.track('attendance_sync_failed', { uuid: item.uuid });
        } catch (error) {
            console.error('[SyncQueue] Move to failed queue error:', error);
        }
    }

    /**
     * Lấy danh sách các item đã fail (cho admin review)
     * 
     * @returns Mảng các failed items
     */
    static async getFailedQueue(): Promise<PendingCheckIn[]> {
        try {
            const data = await AsyncStorage.getItem(FAILED_QUEUE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('[SyncQueue] Get failed queue error:', error);
            return [];
        }
    }
}
