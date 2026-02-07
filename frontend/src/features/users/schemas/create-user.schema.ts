import { z } from 'zod';
import type { CreateUserDto } from '@entities/users';

/**
 * Схема валидации для формы создания пользователя
 * Соответствует CreateUserDto от Orval
 */
export const createUserSchema = z.object({
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
    phone: z.union([z.string(), z.literal('')]).optional(),
    password: z
        .string()
        .min(1, 'Пароль обязателен')
        .min(8, 'Пароль должен содержать минимум 8 символов')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Пароль должен содержать заглавные, строчные буквы и цифры',
        ),
}) satisfies z.ZodType<Omit<CreateUserDto, 'phone'> & { phone?: string }>;

export type CreateUserFormData = z.infer<typeof createUserSchema>;
