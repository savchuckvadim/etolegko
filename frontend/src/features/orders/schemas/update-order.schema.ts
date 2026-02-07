import { z } from 'zod';
import type { UpdateOrderDto } from '@entities/orders';

/**
 * Схема валидации для формы обновления заказа
 * Соответствует UpdateOrderDto от Orval
 */
export const updateOrderSchema = z.object({
    amount: z
        .number()
        .min(0, 'Сумма заказа должна быть не менее 0')
        .optional(),
}) satisfies z.ZodType<UpdateOrderDto>;

export type UpdateOrderFormData = z.infer<typeof updateOrderSchema>;
