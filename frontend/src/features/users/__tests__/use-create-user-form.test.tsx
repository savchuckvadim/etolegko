import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreateUserForm } from '../hooks/use-create-user-form';
import * as usersApi from '@entities/users';

// Мокаем зависимости
vi.mock('@entities/users', () => ({
    useUsersCreate: vi.fn(),
}));

describe('useCreateUserForm', () => {
    let queryClient: QueryClient;
    let wrapper: ({ children }: { children: ReactNode }) => ReactNode;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        wrapper = ({ children }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
        vi.clearAllMocks();
    });

    describe('инициализация', () => {
        it('должен инициализироваться с пустыми значениями', () => {
            const mockMutate = vi.fn();
            vi.mocked(usersApi.useUsersCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useCreateUserForm(), { wrapper });

            expect(result.current.errors).toEqual({});
            expect(result.current.isSubmitting).toBe(false);
        });

        it('должен предоставлять register функции для всех полей', () => {
            const mockMutate = vi.fn();
            vi.mocked(usersApi.useUsersCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useCreateUserForm(), { wrapper });

            expect(result.current.register).toBeDefined();
            expect(typeof result.current.register('name')).toBe('object');
            expect(typeof result.current.register('email')).toBe('object');
            expect(typeof result.current.register('phone')).toBe('object');
            expect(typeof result.current.register('password')).toBe('object');
        });
    });

    describe('структура хука', () => {
        it('должен возвращать все необходимые методы и свойства', () => {
            const mockMutate = vi.fn();
            vi.mocked(usersApi.useUsersCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useCreateUserForm(), { wrapper });

            expect(result.current.register).toBeDefined();
            expect(result.current.handleSubmit).toBeDefined();
            expect(result.current.errors).toBeDefined();
            expect(result.current.isSubmitting).toBeDefined();
            expect(result.current.reset).toBeDefined();
        });

        it('должен показывать isSubmitting во время отправки', () => {
            vi.mocked(usersApi.useUsersCreate).mockReturnValue({
                mutate: vi.fn(),
                isPending: true,
            } as any);

            const { result } = renderHook(() => useCreateUserForm(), { wrapper });

            expect(result.current.isSubmitting).toBe(true);
        });
    });
});
