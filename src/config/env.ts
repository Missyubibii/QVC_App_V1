import { z } from 'zod';

const envSchema = z.object({
    EXPO_PUBLIC_API_URL: z.string().url({ message: "EXPO_PUBLIC_API_URL must be a valid URL" }),
});

const _env = {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
};

const parsed = envSchema.safeParse(_env);

if (!parsed.success) {
    console.error(
        "❌ Invalid environment variables:",
        parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables. Check your .env file.");
}

export const Env = parsed.data;
