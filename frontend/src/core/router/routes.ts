/**
 * Central Route Registry - Like Laravel routes
 * 
 * Single source of truth for all app routes
 */

export const ROUTES = {
    // Auth routes
    AUTH: {
        LOGIN: '/(auth)/login' as const,
        REGISTER: '/(auth)/register' as const,
    },

    // Main app routes
    MAIN: {
        HOME: '/(main)/(tabs)' as const,
        PROFILE: '/(main)/profile' as const,
        SETTINGS: '/(main)/settings' as const,
    },
} as const;

// Route metadata for guards and analytics
export const ROUTE_META = {
    [ROUTES.AUTH.LOGIN]: {
        requiresAuth: false,
        title: 'Login',
    },
    [ROUTES.MAIN.HOME]: {
        requiresAuth: true,
        title: 'Home',
    },
    [ROUTES.MAIN.PROFILE]: {
        requiresAuth: true,
        title: 'Profile',
    },
    [ROUTES.MAIN.SETTINGS]: {
        requiresAuth: true,
        title: 'Settings',
    },
} as const;

// Type for route parameters (extend as needed)
export type RouteParams = {
    // Add route params here when needed
    // [ROUTES.DETAIL]: { id: string };
};
