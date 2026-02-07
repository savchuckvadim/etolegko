import { describe, it, expect } from 'vitest';
import { loginSchema } from '../schemas/login.schema';

describe('loginSchema', () => {
    describe('валидация email', () => {
        it('должен требовать email', () => {
            const result = loginSchema.safeParse({
                email: '',
                password: 'Password123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Email обязателен');
            }
        });

        it('должен валидировать формат email', () => {
            const result = loginSchema.safeParse({
                email: 'invalid-email',
                password: 'Password123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Некорректный email');
            }
        });

        it('должен принимать валидный email', () => {
            const result = loginSchema.safeParse({
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
        });

        it('должен нормализовать email (lowercase)', () => {
            // Примечание: Zod валидирует email ДО transform, поэтому пробелы вызовут ошибку
            // Тестируем только lowercase нормализацию
            const result = loginSchema.safeParse({
                email: 'USER@EXAMPLE.COM',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('user@example.com');
            }
        });
    });

    describe('валидация password', () => {
        it('должен требовать пароль', () => {
            const result = loginSchema.safeParse({
                email: 'user@example.com',
                password: '',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Пароль обязателен');
            }
        });

        it('должен принимать любой непустой пароль', () => {
            const result = loginSchema.safeParse({
                email: 'user@example.com',
                password: 'anypassword',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('валидация полной формы', () => {
        it('должен принимать валидные данные', () => {
            const result = loginSchema.safeParse({
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('user@example.com');
                expect(result.data.password).toBe('Password123');
            }
        });

        it('должен отклонять данные без email', () => {
            const result = loginSchema.safeParse({
                password: 'Password123',
            } as any);
            expect(result.success).toBe(false);
        });

        it('должен отклонять данные без password', () => {
            const result = loginSchema.safeParse({
                email: 'user@example.com',
            } as any);
            expect(result.success).toBe(false);
        });
    });
});
