import { z } from 'zod';

// ✅ Backend Response Schema (tuân thủ v6.0)
export const LoginResponseSchema = z.object({
    code: z.literal(200),
    status: z.literal('success'),
    message: z.string(),
    data: z.object({
        access_token: z.string().min(1),
        token_type: z.literal('Bearer'),
        expires_in: z.number().positive(),
        user: z.object({
            id: z.number(),
            code: z.string().nullable().optional(), // Made optional for backward compatibility
            name: z.string(),
            email: z.string().email(),
            avatar: z.string().nullable().optional(),
            position: z.string().nullable().optional(),
        }),
    }),
    trace_id: z.string().nullable(),
});

export type BackendLoginResponse = z.infer<typeof LoginResponseSchema>;

export interface LoginResponse {
    token: string;
    user: {
        id: number;
        code?: string; // Optional for backward compatibility
        name: string;
        email: string;
        avatar?: string;
        position?: string;
    };
    expires_in: number;
    token_type: string;
}
