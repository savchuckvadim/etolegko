import { z } from 'zod';
import type { ApplyPromoCodeDto } from '@entities/promo-codes';

/**
 * Схема валидации для формы применения промокода
 * Соответствует ApplyPromoCodeDto от Orval
 */
export const applyPromoCodeSchema = z.object({
    orderId: z.string().min(1, 'ID заказа обязателен'),
    promoCode: z
        .string()
        .min(1, 'Код промокода обязателен')
        .transform((val) => val.trim().toUpperCase()),
}) satisfies z.ZodType<ApplyPromoCodeDto>;

export type ApplyPromoCodeFormData = z.infer<typeof applyPromoCodeSchema>;
