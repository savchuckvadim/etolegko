import { z } from 'zod';
import type { UpdatePromoCodeDto } from '@entities/promo-codes';

/**
 * Схема валидации для формы обновления промокода
 * Соответствует UpdatePromoCodeDto от Orval
 */
export const updatePromoCodeSchema = z.object({
    discountPercent: z
        .number()
        .min(1, 'Процент скидки должен быть не менее 1')
        .max(100, 'Процент скидки не может быть более 100')
        .optional(),
    isActive: z.boolean().optional(),
}) satisfies z.ZodType<UpdatePromoCodeDto>;

export type UpdatePromoCodeFormData = z.infer<typeof updatePromoCodeSchema>;
