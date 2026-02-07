import { describe, it, expect } from 'vitest';
import { createPromoCodeSchema } from '../schemas/create-promo-code.schema';

describe('createPromoCodeSchema', () => {
    describe('валидация code', () => {
        it('должен требовать code', () => {
            const result = createPromoCodeSchema.safeParse({
                discountPercent: 10,
                totalLimit: 100,
                perUserLimit: 1,
            });
            expect(result.success).toBe(false);
        });

        it('должен нормализовать code (trim и uppercase)', () => {
            const result = createPromoCodeSchema.safeParse({
                code: '  summer2024  ',
                discountPercent: 10,
                totalLimit: 100,
                perUserLimit: 1,
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.code).toBe('SUMMER2024');
            }
        });
    });

    describe('валидация discountPercent', () => {
        it('должен требовать discountPercent', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                totalLimit: 100,
                perUserLimit: 1,
            });
            expect(result.success).toBe(false);
        });

        it('должен отклонять значения меньше 1', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 0,
                totalLimit: 100,
                perUserLimit: 1,
            });
            expect(result.success).toBe(false);
        });

        it('должен отклонять значения больше 100', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 101,
                totalLimit: 100,
                perUserLimit: 1,
            });
            expect(result.success).toBe(false);
        });

        it('должен принимать значения от 1 до 100', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 50,
                totalLimit: 100,
                perUserLimit: 1,
            });
            expect(result.success).toBe(true);
        });
    });

    describe('валидация totalLimit', () => {
        it('должен требовать totalLimit', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 10,
                perUserLimit: 1,
            });
            expect(result.success).toBe(false);
        });

        it('должен отклонять значения меньше 1', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 10,
                totalLimit: 0,
                perUserLimit: 1,
            });
            expect(result.success).toBe(false);
        });

        it('должен требовать целое число', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 10,
                totalLimit: 100.5,
                perUserLimit: 1,
            });
            expect(result.success).toBe(false);
        });

        it('должен принимать целые положительные числа', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 10,
                totalLimit: 100,
                perUserLimit: 1,
            });
            expect(result.success).toBe(true);
        });
    });

    describe('валидация perUserLimit', () => {
        it('должен требовать perUserLimit', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 10,
                totalLimit: 100,
            });
            expect(result.success).toBe(false);
        });

        it('должен отклонять значения меньше 1', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 10,
                totalLimit: 100,
                perUserLimit: 0,
            });
            expect(result.success).toBe(false);
        });

        it('должен требовать целое число', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 10,
                totalLimit: 100,
                perUserLimit: 1.5,
            });
            expect(result.success).toBe(false);
        });
    });

    describe('валидация дат', () => {
        it('должен принимать данные без дат', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 10,
                totalLimit: 100,
                perUserLimit: 1,
            });
            expect(result.success).toBe(true);
        });

        it('должен отклонять когда endsAt раньше startsAt', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 10,
                totalLimit: 100,
                perUserLimit: 1,
                startsAt: '2024-12-31T00:00:00',
                endsAt: '2024-01-01T00:00:00',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                // Проверяем, что есть ошибки валидации (refine ошибка)
                expect(result.error.issues.length).toBeGreaterThan(0);
            }
        });

        it('должен принимать когда startsAt раньше endsAt', () => {
            const result = createPromoCodeSchema.safeParse({
                code: 'SUMMER2024',
                discountPercent: 10,
                totalLimit: 100,
                perUserLimit: 1,
                startsAt: '2024-01-01T00:00:00',
                endsAt: '2024-12-31T00:00:00',
            });
            expect(result.success).toBe(true);
        });
    });
});
