import { z } from 'zod';
import type { CreateOrderDto } from '@entities/orders';

/**
 * Схема валидации для формы создания заказа
 * Соответствует CreateOrderDto от Orval
 */
export const createOrderSchema = z.object({
    amount: z
        .number()
        .min(0, 'Сумма заказа должна быть не менее 0')
        .positive('Сумма заказа должна быть больше 0'),
}) satisfies z.ZodType<CreateOrderDto>;

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
