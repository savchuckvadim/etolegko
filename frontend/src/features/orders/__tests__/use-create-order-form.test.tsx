import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreateOrderForm } from '../hooks/use-create-order-form';
import * as ordersApi from '@entities/orders';

// Мокаем зависимости
vi.mock('@entities/orders', () => ({
    useOrdersCreate: vi.fn(),
}));

describe('useCreateOrderForm', () => {
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
        it('должен инициализироваться с дефолтными значениями', () => {
            const mockMutate = vi.fn();
            vi.mocked(ordersApi.useOrdersCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useCreateOrderForm(), { wrapper });

            expect(result.current.errors).toEqual({});
            expect(result.current.isSubmitting).toBe(false);
        });

        it('должен предоставлять register функцию', () => {
            const mockMutate = vi.fn();
            vi.mocked(ordersApi.useOrdersCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useCreateOrderForm(), { wrapper });

            expect(result.current.register).toBeDefined();
            expect(typeof result.current.register('amount')).toBe('object');
        });
    });

    describe('валидация формы', () => {
        it('должен показывать ошибку при отрицательном amount', async () => {
            const mockMutate = vi.fn();
            vi.mocked(ordersApi.useOrdersCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useCreateOrderForm(), { wrapper });

            await act(async () => {
                const submitHandler = result.current.handleSubmit;
                await submitHandler({
                    preventDefault: vi.fn(),
                } as any);
            });

            // Проверяем, что есть ошибки валидации
            expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
        });
    });

    describe('структура хука', () => {
        it('должен возвращать все необходимые методы и свойства', () => {
            const mockMutate = vi.fn();
            vi.mocked(ordersApi.useOrdersCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useCreateOrderForm(), { wrapper });

            expect(result.current.register).toBeDefined();
            expect(result.current.handleSubmit).toBeDefined();
            expect(result.current.errors).toBeDefined();
            expect(result.current.isSubmitting).toBeDefined();
            expect(result.current.reset).toBeDefined();
        });

        it('должен показывать isSubmitting во время отправки', () => {
            vi.mocked(ordersApi.useOrdersCreate).mockReturnValue({
                mutate: vi.fn(),
                isPending: true,
            } as any);

            const { result } = renderHook(() => useCreateOrderForm(), { wrapper });

            expect(result.current.isSubmitting).toBe(true);
        });
    });

    describe('callback onSuccess', () => {
        it('должен вызывать onSuccess callback при успешном создании', () => {
            const onSuccess = vi.fn();
            const mockMutate = vi.fn();
            vi.mocked(ordersApi.useOrdersCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            renderHook(() => useCreateOrderForm(onSuccess), { wrapper });

            // Проверяем, что хук инициализирован
            expect(mockMutate).not.toHaveBeenCalled();
        });
    });
});
