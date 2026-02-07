import { describe, it, expect } from 'vitest';
import { createUserSchema } from '../schemas/create-user.schema';

describe('createUserSchema', () => {
    describe('валидация name', () => {
        it('должен требовать name', () => {
            const result = createUserSchema.safeParse({
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(false);
        });

        it('должен требовать минимум 2 символа', () => {
            const result = createUserSchema.safeParse({
                name: 'A',
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(false);
        });

        it('должен нормализовать name (trim)', () => {
            const result = createUserSchema.safeParse({
                name: '  John Doe  ',
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('John Doe');
            }
        });
    });

    describe('валидация email', () => {
        it('должен требовать email', () => {
            const result = createUserSchema.safeParse({
                name: 'John Doe',
                password: 'Password123',
            });
            expect(result.success).toBe(false);
        });

        it('должен валидировать формат email', () => {
            const result = createUserSchema.safeParse({
                name: 'John Doe',
                email: 'invalid-email',
                password: 'Password123',
            });
            expect(result.success).toBe(false);
        });

        it('должен нормализовать email (lowercase)', () => {
            const result = createUserSchema.safeParse({
                name: 'John Doe',
                email: 'USER@EXAMPLE.COM',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.email).toBe('user@example.com');
            }
        });
    });

    describe('валидация phone', () => {
        it('должен принимать undefined для phone', () => {
            const result = createUserSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBeUndefined();
            }
        });

        it('должен принимать пустую строку для phone', () => {
            const result = createUserSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                phone: '',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('валидация password', () => {
        it('должен требовать password', () => {
            const result = createUserSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
            });
            expect(result.success).toBe(false);
        });

        it('должен требовать минимум 8 символов', () => {
            const result = createUserSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                password: 'Pass123',
            });
            expect(result.success).toBe(false);
        });

        it('должен требовать заглавные, строчные буквы и цифры', () => {
            const testCases = [
                { password: 'password123', description: 'только строчные и цифры' },
                { password: 'PASSWORD123', description: 'только заглавные и цифры' },
                { password: 'Password', description: 'только буквы' },
            ];

            testCases.forEach(({ password }) => {
                const result = createUserSchema.safeParse({
                    name: 'John Doe',
                    email: 'user@example.com',
                    password,
                });
                expect(result.success).toBe(false);
            });
        });

        it('должен принимать валидный пароль', () => {
            const result = createUserSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
        });
    });
});
