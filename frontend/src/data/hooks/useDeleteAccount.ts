import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/data/api/client';

export function useDeleteAccount() {
    return useMutation({
        mutationFn: async () => {
            // Call backend DELETE /api/app/me endpoint
            // Note: Backend endpoint is /api/app/me, so with baseURL /api/app, we just need /me
            const response = await apiClient.delete('/me');
            return response.data;
        },
        onSuccess: () => {
            // Clear local storage logic would go here
            console.log('[Delete Account] Success');
        },
        onError: (error) => {
            console.error('[Delete Account] Error:', error);
        },
    });
}
