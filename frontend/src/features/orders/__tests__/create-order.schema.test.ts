import { describe, it, expect } from 'vitest';
import { createOrderSchema } from '../schemas/create-order.schema';

describe('createOrderSchema', () => {
    describe('валидация amount', () => {
        it('должен требовать amount', () => {
            const result = createOrderSchema.safeParse({});
            expect(result.success).toBe(false);
            if (!result.success) {
                // Zod возвращает общее сообщение об ошибке типа
                expect(result.error.issues.length).toBeGreaterThan(0);
            }
        });

        it('должен отклонять отрицательные значения', () => {
            const result = createOrderSchema.safeParse({
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

        it('должен отклонять ноль', () => {
            const result = createOrderSchema.safeParse({
                amount: 0,
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const amountError = result.error.issues.find((issue) =>
                    issue.message.includes('больше 0'),
                );
                expect(amountError).toBeDefined();
            }
        });

        it('должен принимать положительные значения', () => {
            const result = createOrderSchema.safeParse({
                amount: 100,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.amount).toBe(100);
            }
        });

        it('должен принимать дробные значения', () => {
            const result = createOrderSchema.safeParse({
                amount: 99.99,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.amount).toBe(99.99);
            }
        });
    });
});
