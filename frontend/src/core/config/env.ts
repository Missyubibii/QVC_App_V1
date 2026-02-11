import { z } from 'zod';

const envSchema = z.object({
    EXPO_PUBLIC_API_URL: z.string().url(),
    EXPO_PUBLIC_IS_MOCK: z.string().optional(),
});

// Validate process.env
const _env = envSchema.safeParse({
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_IS_MOCK: process.env.EXPO_PUBLIC_IS_MOCK,
});

if (!_env.success) {
    console.error("❌ INVALID ENVIRONMENT VARIABLES:", _env.error.format());
    throw new Error("Invalid Environment Variables");
}

export const Env = _env.data;
