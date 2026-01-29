/**
 * Background Sync Worker (REFACTORED - TRUE BACKGROUND SUPPORT)
 * 
 * CRITICAL FIX: Phiên bản trước CHỈ hoạt động khi app FOREGROUND.
 * Phiên bản này hỗ trợ sync ngay cả khi app bị KILLED.
 * 
 * Architecture:
 * - Trigger 1 (Foreground): NetInfo listener → Sync ngay khi có mạng
 * - Trigger 2 (Background): expo-background-fetch → OS đánh thức app định kỳ
 * 
 * iOS Behavior:
 * - Background fetch chạy khoảng 15-60 phút/lần (tùy iOS quyết định)
 * - Yêu cầu config UIBackgroundModes trong app.json
 * 
 * Android Behavior:
 * - Background task chạy chính xác hơn (có thể set interval)
 * - Chạy tiếp cả khi app killed (stopOnTerminate: false)
 * 
 * Performance:
 * - Foreground sync: < 500ms latency
 * - Background sync: 15-60 phút/lần (iOS), 15 phút/lần (Android)
 * - Battery impact: Minimal (chỉ chạy khi có pending items)
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';

import { SyncQueue } from './SyncQueue';
import { AttendanceAPI } from '@/data/api/attendance.api';
import type { SyncResult } from './types';

/**
 * Task name cho background fetch
 * CRITICAL: Tên này phải UNIQUE trong toàn bộ app
 */
const BACKGROUND_SYNC_TASK_NAME = 'ATTENDANCE_BACKGROUND_SYNC';

/**
 * Background Sync Worker (Refactored)
 * 
 * Dual-trigger architecture:
 * 1. NetInfo (foreground) - Immediate sync khi có mạng
 * 2. Background Fetch (native) - Periodic sync khi app killed
 */
export class BackgroundSyncWorker {
    private static isRunning = false;
    private static netInfoUnsubscribe: (() => void) | null = null;
    private static isBackgroundTaskRegistered = false;

    // ============================================================
    // PUBLIC API
    // ============================================================

    /**
     * Khởi động worker (cả foreground và background)
     * Gọi trong App.tsx hoặc _layout.tsx
     * 
     * @example
     * useEffect(() => {
     *   BackgroundSyncWorker.start();
     *   return () => BackgroundSyncWorker.stop();
     * }, []);
     */
    static async start(): Promise<void> {
        console.log('[SyncWorker] Starting worker...');

        // Trigger 1: Foreground sync
        this.startForegroundListener();

        // Trigger 2: Background sync
        await this.registerBackgroundTask();

        // Initial sync nếu có mạng
        const state = await NetInfo.fetch();
        if (state.isConnected && state.isInternetReachable) {
            console.log('[SyncWorker] Initial network check: Online, triggering sync');
            this.sync();
        }
    }

    /**
     * Dừng worker (cleanup)
     */
    static async stop(): Promise<void> {
        console.log('[SyncWorker] Stopping worker...');

        // Stop foreground listener
        if (this.netInfoUnsubscribe) {
            this.netInfoUnsubscribe();
            this.netInfoUnsubscribe = null;
        }

        // Unregister background task
        if (this.isBackgroundTaskRegistered) {
            await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK_NAME);
            this.isBackgroundTaskRegistered = false;
        }
    }

    /**
     * Sync thủ công (UI trigger)
     * User bấm nút "Đồng bộ ngay"
     * 
     * @returns Kết quả sync
     */
    static async sync(): Promise<SyncResult> {
        return this.performSyncTask();
    }

    /**
     * Kiểm tra trạng thái background task
     * 
     * @returns Status info
     */
    static async getStatus(): Promise<{
        isRunning: boolean;
        isForegroundListening: boolean;
        isBackgroundRegistered: boolean;
        backgroundTaskStatus?: BackgroundFetch.BackgroundFetchStatus | null;
    }> {
        const backgroundStatus = await BackgroundFetch.getStatusAsync();

        return {
            isRunning: this.isRunning,
            isForegroundListening: this.netInfoUnsubscribe !== null,
            isBackgroundRegistered: this.isBackgroundTaskRegistered,
            backgroundTaskStatus: backgroundStatus,
        };
    }

    // ============================================================
    // TRIGGER 1: FOREGROUND SYNC (NetInfo)
    // ============================================================

    /**
     * Khởi động NetInfo listener (foreground only)
     * 
     * @private
     */
    private static startForegroundListener(): void {
        if (this.netInfoUnsubscribe) {
            console.warn('[SyncWorker] Foreground listener already started');
            return;
        }

        console.log('[SyncWorker] Starting foreground NetInfo listener...');

        this.netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const isOnline = state.isConnected && state.isInternetReachable;

            console.log(
                `[SyncWorker] Network changed: ${isOnline ? 'Online' : 'Offline'} | ` +
                `Type: ${state.type}`
            );

            if (isOnline) {
                // Có mạng → Trigger sync ngay lập tức
                this.sync();
            }
        });
    }

    // ============================================================
    // TRIGGER 2: BACKGROUND SYNC (Native Task)
    // ============================================================

    /**
     * Đăng ký background task với OS
     * 
     * CRITICAL: Task này chạy NGOÀI JS Engine lifecycle
     * iOS/Android sẽ đánh thức app để chạy task này định kỳ
     * 
     * @private
     */
    private static async registerBackgroundTask(): Promise<void> {
        try {
            // Kiểm tra background fetch có available không
            const status = await BackgroundFetch.getStatusAsync();

            if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
                console.error(
                    '[SyncWorker] Background fetch denied by user. ' +
                    'Sync sẽ CHỈ hoạt động khi app mở.'
                );
                return;
            }

            if (status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
                console.error(
                    '[SyncWorker] Background fetch restricted (Low Power Mode?). ' +
                    'Sync có thể không hoạt động đều đặn.'
                );
            }

            // Define task: Đã được thực hiện ở Global Scope cuối file

            // Register task với OS
            await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK_NAME, {
                minimumInterval: 15 * 60, // 15 phút (iOS minimum)
                stopOnTerminate: false,   // Android: Chạy tiếp khi kill app
                startOnBoot: true,        // Android: Chạy khi reboot
            });

            this.isBackgroundTaskRegistered = true;

            console.log(
                '[SyncWorker] ✅ Background task registered successfully | ' +
                `Interval: 15 min | Platform: ${Platform.OS}`
            );

        } catch (error: any) {
            console.error('[SyncWorker] Failed to register background task:', error);

            // Fallback: Vẫn chạy được ở foreground mode
            console.warn(
                '[SyncWorker] Falling back to FOREGROUND-ONLY mode. ' +
                'Sync sẽ CHỈ hoạt động khi user mở app.'
            );
        }
    }



    // ============================================================
    // CORE SYNC LOGIC (Shared by both triggers)
    // ============================================================

    /**
     * Thực hiện sync queue (Public for TaskManager)
     * Hàm này được gọi bởi CẢ NetInfo listener VÀ Background Task
     * 
     * @returns Sync result
     */
    public static async performSyncTask(): Promise<SyncResult> {
        // Race condition guard
        if (this.isRunning) {
            console.warn('[SyncWorker] Sync already in progress, skipping...');
            return { success: 0, failed: 0 };
        }

        this.isRunning = true;
        console.log('[SyncWorker] Starting sync process...');

        const queue = await SyncQueue.getQueue();

        if (queue.length === 0) {
            console.log('[SyncWorker] Queue is empty, nothing to sync');
            this.isRunning = false;
            return { success: 0, failed: 0 };
        }

        console.log(`[SyncWorker] Processing ${queue.length} items...`);

        let successCount = 0;
        let failedCount = 0;
        const errors: Array<{ id: string; error: string }> = [];

        // Process items sequentially
        for (const item of queue) {
            try {
                console.log(
                    `[SyncWorker] Syncing item ${item.id} | ` +
                    `UUID: ${item.uuid} | Retry: ${item.retry_count}`
                );

                // Gọi API thật
                await AttendanceAPI.checkIn({
                    uuid: item.uuid,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    accuracy: item.accuracy,
                    device_timestamp: item.device_timestamp,
                    timestamp: item.timestamp,
                    is_mock: item.is_mock,
                    device_info: item.device_info,
                });

                // ✅ Success → Remove from queue
                await SyncQueue.remove(item.id);
                successCount++;

                console.log(`[SyncWorker] ✅ Item ${item.id} synced successfully`);

            } catch (error: any) {
                console.error(
                    `[SyncWorker] ❌ Failed to sync item ${item.id}:`,
                    error.message
                );

                // Tăng retry count
                await SyncQueue.incrementRetry(item.id);
                failedCount++;

                errors.push({
                    id: item.id,
                    error: error.message || 'Unknown error',
                });

                // Nếu network error → Stop sync để tiết kiệm pin
                if (this.isNetworkError(error)) {
                    console.warn('[SyncWorker] Network error, stopping sync');
                    break;
                }
            }
        }

        this.isRunning = false;

        const result: SyncResult = {
            success: successCount,
            failed: failedCount,
            errors: errors.length > 0 ? errors : undefined,
        };

        console.log(
            `[SyncWorker] Sync completed | Success: ${successCount} | Failed: ${failedCount}`
        );

        return result;
    }

    /**
     * Kiểm tra error có phải network error
     * 
     * @private
     */
    private static isNetworkError(error: any): boolean {
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
            return true;
        }

        if (error.message?.includes('Network request failed')) {
            return true;
        }

        return false;
    }
}

// ============================================================
// BACKGROUND TASK DEFINITION (GLOBAL SCOPE)
// ============================================================

/**
 * Define background task logic
 * 
 * CRITICAL: Hàm này chạy NGOÀI React lifecycle
 * Phải được define ở global scope để Headless JS tìm thấy ngay khi app boot
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK_NAME, async () => {
    try {
        console.log('[BackgroundTask] Woke up by OS, checking queue...');

        const pendingCount = await SyncQueue.count();

        if (pendingCount === 0) {
            console.log('[BackgroundTask] Queue empty, going back to sleep');
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        console.log(
            `[BackgroundTask] Found ${pendingCount} pending items, syncing...`
        );

        // Reuse sync logic via public static method
        const result = await BackgroundSyncWorker.performSyncTask();

        if (result.success > 0) {
            console.log(
                `[BackgroundTask] ✅ Synced ${result.success} items successfully`
            );
            return BackgroundFetch.BackgroundFetchResult.NewData;
        } else {
            console.log('[BackgroundTask] ❌ Sync failed');
            return BackgroundFetch.BackgroundFetchResult.Failed;
        }

    } catch (error: any) {
        console.error('[BackgroundTask] Error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});
