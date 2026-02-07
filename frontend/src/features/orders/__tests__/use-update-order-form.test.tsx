import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpdateOrderForm } from '../hooks/use-update-order-form';
import * as ordersApi from '@entities/orders';

// Мокаем зависимости
vi.mock('@entities/orders', () => ({
    useOrdersUpdate: vi.fn(),
}));

describe('useUpdateOrderForm', () => {
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
            const orderId = 'test-id';
            const mockMutate = vi.fn();
            vi.mocked(ordersApi.useOrdersUpdate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useUpdateOrderForm(orderId), { wrapper });

            expect(result.current.errors).toEqual({});
            expect(result.current.isSubmitting).toBe(false);
        });

        it('должен предоставлять register функцию', () => {
            const orderId = 'test-id';
            const mockMutate = vi.fn();
            vi.mocked(ordersApi.useOrdersUpdate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useUpdateOrderForm(orderId), { wrapper });

            expect(result.current.register).toBeDefined();
            expect(typeof result.current.register('amount')).toBe('object');
        });
    });

    describe('структура хука', () => {
        it('должен возвращать все необходимые методы и свойства', () => {
            const orderId = 'test-id';
            const mockMutate = vi.fn();
            vi.mocked(ordersApi.useOrdersUpdate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useUpdateOrderForm(orderId), { wrapper });

            expect(result.current.register).toBeDefined();
            expect(result.current.handleSubmit).toBeDefined();
            expect(result.current.errors).toBeDefined();
            expect(result.current.isSubmitting).toBeDefined();
            expect(result.current.reset).toBeDefined();
        });

        it('должен показывать isSubmitting во время отправки', () => {
            const orderId = 'test-id';
            vi.mocked(ordersApi.useOrdersUpdate).mockReturnValue({
                mutate: vi.fn(),
                isPending: true,
            } as any);

            const { result } = renderHook(() => useUpdateOrderForm(orderId), { wrapper });

            expect(result.current.isSubmitting).toBe(true);
        });
    });
});
