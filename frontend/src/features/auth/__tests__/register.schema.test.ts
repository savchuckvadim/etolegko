import { describe, it, expect } from 'vitest';
import { registerSchema } from '../schemas/register.schema';

describe('registerSchema', () => {
    describe('валидация name', () => {
        it('должен требовать имя', () => {
            const result = registerSchema.safeParse({
                name: '',
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Имя обязательно');
            }
        });

        it('должен требовать минимум 2 символа в имени', () => {
            const result = registerSchema.safeParse({
                name: 'A',
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe(
                    'Имя должно содержать минимум 2 символа',
                );
            }
        });

        it('должен принимать валидное имя', () => {
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
        });

        it('должен нормализовать имя (trim)', () => {
            const result = registerSchema.safeParse({
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
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: '',
                password: 'Password123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const emailError = result.error.issues.find((issue) =>
                    issue.message.includes('Email'),
                );
                expect(emailError).toBeDefined();
            }
        });

        it('должен валидировать формат email', () => {
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'invalid-email',
                password: 'Password123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const emailError = result.error.issues.find((issue) =>
                    issue.message.includes('email'),
                );
                expect(emailError).toBeDefined();
            }
        });

        it('должен нормализовать email (lowercase)', () => {
            // Примечание: Zod валидирует email ДО transform, поэтому пробелы вызовут ошибку
            // Тестируем только lowercase нормализацию
            const result = registerSchema.safeParse({
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
            const result = registerSchema.safeParse({
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
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                phone: '',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
        });

        it('должен принимать валидный phone', () => {
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                phone: '+1234567890',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+1234567890');
            }
        });
    });

    describe('валидация password', () => {
        it('должен требовать пароль', () => {
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                password: '',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const passwordError = result.error.issues.find((issue) =>
                    issue.message.includes('Пароль'),
                );
                expect(passwordError).toBeDefined();
            }
        });

        it('должен требовать минимум 8 символов', () => {
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                password: 'Pass123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const passwordError = result.error.issues.find((issue) =>
                    issue.message.includes('8 символов'),
                );
                expect(passwordError).toBeDefined();
            }
        });

        it('должен требовать заглавные, строчные буквы и цифры', () => {
            const testCases = [
                { password: 'password123', description: 'только строчные и цифры' },
                { password: 'PASSWORD123', description: 'только заглавные и цифры' },
                { password: 'Password', description: 'только буквы' },
                { password: '12345678', description: 'только цифры' },
            ];

            testCases.forEach(({ password, description }) => {
                const result = registerSchema.safeParse({
                    name: 'John Doe',
                    email: 'user@example.com',
                    password,
                });
                expect(result.success).toBe(false);
                if (!result.success) {
                    const passwordError = result.error.issues.find((issue) =>
                        issue.message.includes('заглавные, строчные'),
                    );
                    expect(passwordError).toBeDefined();
                }
            });
        });

        it('должен принимать валидный пароль', () => {
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('валидация полной формы', () => {
        it('должен принимать валидные данные без phone', () => {
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.name).toBe('John Doe');
                expect(result.data.email).toBe('user@example.com');
                expect(result.data.password).toBe('Password123');
                expect(result.data.phone).toBeUndefined();
            }
        });

        it('должен принимать валидные данные с phone', () => {
            const result = registerSchema.safeParse({
                name: 'John Doe',
                email: 'user@example.com',
                phone: '+1234567890',
                password: 'Password123',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.phone).toBe('+1234567890');
            }
        });

        it('должен отклонять данные без обязательных полей', () => {
            const testCases = [
                { data: { email: 'user@example.com', password: 'Password123' } },
                { data: { name: 'John Doe', password: 'Password123' } },
                { data: { name: 'John Doe', email: 'user@example.com' } },
            ];

            testCases.forEach(({ data }) => {
                const result = registerSchema.safeParse(data as any);
                expect(result.success).toBe(false);
            });
        });
    });
});
