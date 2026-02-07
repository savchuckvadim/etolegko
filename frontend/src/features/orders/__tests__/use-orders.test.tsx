import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useOrders, useOrder } from '../hooks/use-orders';
import * as ordersApi from '@entities/orders';

// Мокаем API хуки
vi.mock('@entities/orders', () => ({
    useOrdersFindAll: vi.fn(),
    useOrdersFindById: vi.fn(),
    useOrdersCreate: vi.fn(),
    useOrdersUpdate: vi.fn(),
    useOrdersRemove: vi.fn(),
}));

describe('useOrders', () => {
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

    describe('useOrders', () => {
        it('должен вызывать useOrdersFindAll с правильными params', () => {
            const mockParams = {
                page: 1,
                limit: 10,
            };
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(ordersApi.useOrdersFindAll).mockReturnValue(mockReturnValue as any);
            vi.mocked(ordersApi.useOrdersCreate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(ordersApi.useOrdersUpdate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(ordersApi.useOrdersRemove).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { result } = renderHook(() => useOrders(mockParams), { wrapper });

            expect(ordersApi.useOrdersFindAll).toHaveBeenCalledWith(mockParams, {
                query: {
                    enabled: true,
                },
            });
            expect(result.current.findAll).toEqual(mockReturnValue);
        });

        it('должен возвращать все необходимые методы', () => {
            vi.mocked(ordersApi.useOrdersFindAll).mockReturnValue({
                data: null,
                isLoading: false,
                isError: false,
            } as any);
            vi.mocked(ordersApi.useOrdersCreate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(ordersApi.useOrdersUpdate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(ordersApi.useOrdersRemove).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { result } = renderHook(() => useOrders(), { wrapper });

            expect(result.current.findAll).toBeDefined();
            expect(result.current.create).toBeDefined();
            expect(result.current.update).toBeDefined();
            expect(result.current.remove).toBeDefined();
        });
    });

    describe('useOrder', () => {
        it('должен вызывать useOrdersFindById с правильным id', () => {
            const orderId = 'test-id';
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(ordersApi.useOrdersFindById).mockReturnValue(mockReturnValue as any);

            const { result } = renderHook(() => useOrder(orderId), { wrapper });

            expect(ordersApi.useOrdersFindById).toHaveBeenCalledWith(orderId, {
                query: {
                    enabled: true,
                },
            });
            expect(result.current).toEqual(mockReturnValue);
        });

        it('должен отключать запрос когда id undefined', () => {
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(ordersApi.useOrdersFindById).mockReturnValue(mockReturnValue as any);

            renderHook(() => useOrder(undefined), { wrapper });

            expect(ordersApi.useOrdersFindById).toHaveBeenCalledWith('', {
                query: {
                    enabled: false,
                },
            });
        });
    });
});
