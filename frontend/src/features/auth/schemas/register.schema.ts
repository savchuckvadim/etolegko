import { z } from 'zod';
import type { RegisterDto } from '@entities/auth';

/**
 * Схема валидации для формы регистрации
 * Соответствует RegisterDto от Orval
 */
export const registerSchema = z.object({
    name: z
        .string()
        .min(1, 'Имя обязательно')
        .min(2, 'Имя должно содержать минимум 2 символа')
        .transform((val) => val.trim()),
    email: z
        .string()
        .min(1, 'Email обязателен')
        .email('Некорректный email')
        .transform((val) => val.trim().toLowerCase()),
    phone: z.string().optional(),
    password: z
        .string()
        .min(1, 'Пароль обязателен')
        .min(8, 'Пароль должен содержать минимум 8 символов')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Пароль должен содержать заглавные, строчные буквы и цифры',
        ),
}) satisfies z.ZodType<RegisterDto>;

export type RegisterFormData = z.infer<typeof registerSchema>;
