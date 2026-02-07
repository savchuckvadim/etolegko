import { z } from 'zod';
import type { LoginDto } from '@entities/auth';

/**
 * Схема валидации для формы логина
 * Соответствует LoginDto от Orval
 */
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email обязателен')
        .email('Некорректный email')
        .transform((val) => val.trim().toLowerCase()),
    password: z.string().min(1, 'Пароль обязателен'),
}) satisfies z.ZodType<LoginDto>;

export type LoginFormData = z.infer<typeof loginSchema>;
