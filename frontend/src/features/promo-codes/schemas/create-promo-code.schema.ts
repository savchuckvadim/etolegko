import { z } from 'zod';
import type { CreatePromoCodeDto } from '@entities/promo-codes';

/**
 * Схема валидации для формы создания промокода
 * Соответствует CreatePromoCodeDto от Orval
 */
export const createPromoCodeSchema = z
    .object({
        code: z
            .string()
            .min(1, 'Код промокода обязателен')
            .transform((val) => val.trim().toUpperCase()),
        discountPercent: z
            .number()
            .min(1, 'Процент скидки должен быть не менее 1')
            .max(100, 'Процент скидки не может быть более 100'),
        totalLimit: z
            .number()
            .min(1, 'Общий лимит должен быть не менее 1')
            .int('Общий лимит должен быть целым числом'),
        perUserLimit: z
            .number()
            .min(1, 'Лимит на пользователя должен быть не менее 1')
            .int('Лимит на пользователя должен быть целым числом'),
        startsAt: z.string().optional(),
        endsAt: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.startsAt && data.endsAt) {
                return new Date(data.startsAt) < new Date(data.endsAt);
            }
            return true;
        },
        {
            message: 'Дата начала должна быть раньше даты окончания',
            path: ['endsAt'],
        },
    ) satisfies z.ZodType<CreatePromoCodeDto>;

export type CreatePromoCodeFormData = z.infer<typeof createPromoCodeSchema>;
