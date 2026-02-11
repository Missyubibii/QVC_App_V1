import { create } from 'zustand';

export type LogType = 'INFO' | 'WARN' | 'ERROR' | 'NETWORK';

export interface LogEntry {
    id: string;
    timestamp: number;
    type: LogType;
    message: string;
    details?: any; // JSON object
}

interface LogState {
    logs: LogEntry[];
    addLog: (type: LogType, message: string, details?: any) => void;
    clearLogs: () => void;
}

const MAX_LOGS = 50; // Giới hạn RAM

export const useLogStore = create<LogState>((set) => ({
    logs: [],

    addLog: (type, message, details) => set((state) => {
        const newLog: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            type,
            message,
            details,
        };

        // Giữ tối đa MAX_LOGS mới nhất
        return { logs: [newLog, ...state.logs].slice(0, MAX_LOGS) };
    }),

    clearLogs: () => set({ logs: [] }),
}));
