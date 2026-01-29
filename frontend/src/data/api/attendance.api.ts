/**
 * Attendance API
 * 
 * Repository Pattern cho tính năng chấm công.
 * Tách biệt logic API call khỏi business logic.
 */

import { apiClient } from './client';
import type { PendingCheckIn } from '@/core/sync/types';

/**
 * Check-in payload (gửi lên server)
 */
export interface CheckInPayload {
    uuid: string;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: string; // ISO 8601
    device_timestamp: number; // Unix ms
    is_mock: boolean;
    device_info: {
        model: string;
        os: string;
    };
    bssid?: string | null; // WiFi MAC address (optional)
}

/**
 * Check-in response từ server
 */
export interface CheckInResponse {
    code: number;
    status: 'success' | 'error';
    message: string;
    data: {
        log_id: number;
        time: string; // "08:15:22"
        type: 'CHECK_IN' | 'CHECK_OUT';
        status: 'ON_TIME' | 'LATE' | 'EARLY';
        status_label: string; // "Đúng giờ", "Đi muộn 15 phút"
        office_name: string;
        distance_meters: number;
    };
    trace_id: string;
}

/**
 * Attendance status response
 */
export interface AttendanceStatusResponse {
    code: number;
    status: 'success';
    data: {
        current_state: 'OUT' | 'IN';
        last_checkin?: {
            time: string;
            type: 'CHECK_IN' | 'CHECK_OUT';
        };
        button_ui: {
            label: string; // "VÀO LÀM" hoặc "TAN LÀM"
            color: string; // Hex color
        };
        today_summary: {
            total_hours: number;
            checkin_time: string | null;
            checkout_time: string | null;
        };
    };
}

/**
 * Timesheet response
 */
export interface TimesheetResponse {
    code: number;
    status: 'success';
    data: {
        logs: Array<{
            id: number;
            date: string;
            checkin: string | null;
            checkout: string | null;
            total_hours: number;
            status: 'ON_TIME' | 'LATE' | 'ABSENT';
        }>;
        summary: {
            total_days: number;
            on_time: number;
            late: number;
            absent: number;
        };
    };
}

export class AttendanceAPI {
    /**
     * Chấm công (Check-in/Check-out)
     * 
     * Backend tự động phân biệt IN/OUT dựa vào lịch sử.
     * 
     * @param payload - Check-in data
     * @returns Server response
     * 
     * @throws {AxiosError} Nếu server trả lỗi (400, 403, 500)
     */
    static async checkIn(payload: CheckInPayload): Promise<CheckInResponse> {
        const response = await apiClient.post<CheckInResponse>(
            '/hrm/check-in',
            payload
        );

        // Unwrap envelope (response.data.data)
        return response.data;
    }

    /**
     * Lấy trạng thái chấm công hiện tại
     * 
     * @returns Current attendance status
     */
    static async getStatus(): Promise<AttendanceStatusResponse> {
        const response = await apiClient.get<AttendanceStatusResponse>(
            '/hrm/status'
        );

        return response.data;
    }

    /**
     * Lấy lịch sử chấm công (bảng công)
     * 
     * @param month - Format: "01-2026"
     * @returns Timesheet data
     */
    static async getTimesheet(month: string): Promise<TimesheetResponse> {
        const response = await apiClient.get<TimesheetResponse>(
            '/hrm/timesheet',
            { params: { month } }
        );

        return response.data;
    }
}
