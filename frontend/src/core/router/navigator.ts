/**
 * Custom Navigation Layer - Wraps Expo Router
 * 
 * Provides centralized navigation with:
 * - Type safety
 * - Logging
 * - Auth guards (future)
 * - Analytics (future)
 */

import { useRouter, useSegments, usePathname, useRootNavigationState } from 'expo-router';
import { ROUTES, ROUTE_META } from './routes';
import { useEffect } from 'react';
import { useAuth } from '@/data/hooks/useAuth';

export function useAppNavigation() {
    const router = useRouter();
    const segments = useSegments();
    const pathname = usePathname();

    /**
     * Navigate to a route
     * 
     * @example
     * navigate(ROUTES.MAIN.HOME);
     * navigate(ROUTES.AUTH.LOGIN);
     */
    const navigate = (route: string, params?: any) => {
        // Log navigation for debugging
        console.log(`[Navigation] ${pathname} → ${route}`, params || '');

        // TODO: Add analytics tracking here
        // TODO: Add auth guard checks here

        // Perform navigation
        if (params) {
            router.push({ pathname: route, params });
        } else {
            router.push(route);
        }
    };

    /**
     * Go back to previous screen
     */
    const goBack = () => {
        if (router.canGoBack()) {
            console.log(`[Navigation] Going back from ${pathname}`);
            router.back();
        }
    };

    /**
     * Replace current screen (no back stack)
     */
    const replace = (route: string, params?: any) => {
        console.log(`[Navigation] Replacing ${pathname} with ${route}`);
        try {
            if (params) {
                router.replace({ pathname: route, params });
            } else {
                router.replace(route);
            }
        } catch (error) {
            console.warn('[Navigation] Replace failed:', error);
        }
    };

    return {
        navigate,
        goBack,
        replace,
        currentRoute: pathname,
        canGoBack: router.canGoBack(),
    };
}

/**
 * Auth guard hook - Use in screens that require authentication
 */
export function useAuthGuard() {
    const { isAuthenticated } = useAuth();
    const { replace } = useAppNavigation();
    const segments = useSegments();
    const rootNavigationState = useRootNavigationState();

    useEffect(() => {
        // IMPORTANT: Wait for navigation to be ready
        if (!rootNavigationState?.key) return;

        // Check if we are in the auth group
        const inAuthGroup = segments[0] === '(auth)';

        // Check if we are effectively on a protected route (anything not auth)
        // This logic might need refinement based on exact route structure

        if (!isAuthenticated && !inAuthGroup) {
            // Not authenticated and not in login screen → redirect
            console.log('[AuthGuard] Not authenticated, redirecting to login');
            replace(ROUTES.AUTH.LOGIN);
        }

        if (isAuthenticated && inAuthGroup) {
            // Authenticated but still in login screen → redirect to home
            console.log('[AuthGuard] Authenticated, redirecting to home');
            replace(ROUTES.MAIN.HOME);
        }
    }, [isAuthenticated, segments, rootNavigationState?.key]);
}
