/**
 * Sync Queue Types
 * Định nghĩa cấu trúc dữ liệu cho hệ thống đồng bộ offline
 */

export interface PendingCheckIn {
    /** UUID duy nhất cho item trong queue (local tracking) */
    id: string;

    /** UUID gửi lên server (idempotency key) */
    uuid: string;

    /** Tọa độ GPS */
    latitude: number;
    longitude: number;
    accuracy: number | null;

    /** Thời gian chấm công (ISO 8601) */
    timestamp: string;

    /** Device timestamp để server validate clock skew */
    device_timestamp: number;

    /** Đánh dấu là dữ liệu mock (simulator) */
    is_mock: boolean;

    /** Thông tin thiết bị */
    device_info: {
        model: string;
        os: string;
    };

    /** Số lần retry (max 3) */
    retry_count: number;

    /** Thời điểm tạo queue item (Unix timestamp ms) */
    created_at: number;
}

export interface SyncResult {
    /** Số lượng sync thành công */
    success: number;

    /** Số lượng sync thất bại */
    failed: number;

    /** Chi tiết lỗi (nếu có) */
    errors?: Array<{
        id: string;
        error: string;
    }>;
}
