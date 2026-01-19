import { create } from 'zustand';

// Export type để component dùng được
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Export interface để component ToastItem không phải dùng 'any'
export interface ToastMessage {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastState {
    toasts: ToastMessage[];
    showToast: (params: Omit<ToastMessage, 'id'>) => void;
    hideToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    showToast: (params) => {
        // Dùng substring thay vì substr (đã deprecated)
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...params, id, duration: params.duration || 3000 };

        set((state) => ({ toasts: [...state.toasts, newToast] }));

        // Logic tự động ẩn toast
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, newToast.duration + 500); // +500ms buffer cho animation Exit
    },
    hideToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));