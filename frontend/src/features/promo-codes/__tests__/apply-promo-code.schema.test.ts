import { describe, it, expect } from 'vitest';
import { applyPromoCodeSchema } from '../schemas/apply-promo-code.schema';

describe('applyPromoCodeSchema', () => {
    describe('валидация orderId', () => {
        it('должен требовать orderId', () => {
            const result = applyPromoCodeSchema.safeParse({
                promoCode: 'SUMMER2024',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                // Проверяем, что есть ошибки валидации
                expect(result.error.issues.length).toBeGreaterThan(0);
            }
        });

        it('должен принимать валидный orderId', () => {
            const result = applyPromoCodeSchema.safeParse({
                orderId: 'order-123',
                promoCode: 'SUMMER2024',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('валидация promoCode', () => {
        it('должен требовать promoCode', () => {
            const result = applyPromoCodeSchema.safeParse({
                orderId: 'order-123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                // Проверяем, что есть ошибки валидации
                expect(result.error.issues.length).toBeGreaterThan(0);
            }
        });

        it('должен нормализовать promoCode (trim и uppercase)', () => {
            const result = applyPromoCodeSchema.safeParse({
                orderId: 'order-123',
                promoCode: '  summer2024  ',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.promoCode).toBe('SUMMER2024');
            }
        });
    });

    describe('валидация полной формы', () => {
        it('должен принимать валидные данные', () => {
            const result = applyPromoCodeSchema.safeParse({
                orderId: 'order-123',
                promoCode: 'SUMMER2024',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.orderId).toBe('order-123');
                expect(result.data.promoCode).toBe('SUMMER2024');
            }
        });
    });
});
