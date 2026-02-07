import { describe, it, expect } from 'vitest';
import { updateOrderSchema } from '../schemas/update-order.schema';

describe('updateOrderSchema', () => {
    describe('валидация amount', () => {
        it('должен принимать undefined для amount', () => {
            const result = updateOrderSchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.amount).toBeUndefined();
            }
        });

        it('должен отклонять отрицательные значения', () => {
            const result = updateOrderSchema.safeParse({
                amount: -1,
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const amountError = result.error.issues.find((issue) =>
                    issue.message.includes('не менее 0'),
                );
                expect(amountError).toBeDefined();
            }
        });

        it('должен принимать ноль', () => {
            const result = updateOrderSchema.safeParse({
                amount: 0,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.amount).toBe(0);
            }
        });

        it('должен принимать положительные значения', () => {
            const result = updateOrderSchema.safeParse({
                amount: 100,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.amount).toBe(100);
            }
        });

        it('должен принимать дробные значения', () => {
            const result = updateOrderSchema.safeParse({
                amount: 99.99,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.amount).toBe(99.99);
            }
        });
    });
});
