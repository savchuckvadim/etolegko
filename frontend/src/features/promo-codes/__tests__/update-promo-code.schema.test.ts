import { describe, it, expect } from 'vitest';
import { updatePromoCodeSchema } from '../schemas/update-promo-code.schema';

describe('updatePromoCodeSchema', () => {
    describe('валидация discountPercent', () => {
        it('должен принимать undefined для discountPercent', () => {
            const result = updatePromoCodeSchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.discountPercent).toBeUndefined();
            }
        });

        it('должен отклонять значения меньше 1', () => {
            const result = updatePromoCodeSchema.safeParse({
                discountPercent: 0,
            });
            expect(result.success).toBe(false);
        });

        it('должен отклонять значения больше 100', () => {
            const result = updatePromoCodeSchema.safeParse({
                discountPercent: 101,
            });
            expect(result.success).toBe(false);
        });

        it('должен принимать значения от 1 до 100', () => {
            const result = updatePromoCodeSchema.safeParse({
                discountPercent: 50,
            });
            expect(result.success).toBe(true);
        });
    });

    describe('валидация isActive', () => {
        it('должен принимать undefined для isActive', () => {
            const result = updatePromoCodeSchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.isActive).toBeUndefined();
            }
        });

        it('должен принимать true', () => {
            const result = updatePromoCodeSchema.safeParse({
                isActive: true,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.isActive).toBe(true);
            }
        });

        it('должен принимать false', () => {
            const result = updatePromoCodeSchema.safeParse({
                isActive: false,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.isActive).toBe(false);
            }
        });
    });

    describe('валидация полной формы', () => {
        it('должен принимать оба поля', () => {
            const result = updatePromoCodeSchema.safeParse({
                discountPercent: 25,
                isActive: true,
            });
            expect(result.success).toBe(true);
        });
    });
});
