import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePromoCodes, usePromoCode } from '../hooks/use-promo-codes';
import * as promoCodesApi from '@entities/promo-codes';

// Мокаем API хуки
vi.mock('@entities/promo-codes', () => ({
    usePromoCodesFindAll: vi.fn(),
    usePromoCodesFindById: vi.fn(),
    usePromoCodesCreate: vi.fn(),
    usePromoCodesUpdate: vi.fn(),
    usePromoCodesRemove: vi.fn(),
    usePromoCodesApply: vi.fn(),
}));

describe('usePromoCodes', () => {
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

    describe('usePromoCodes', () => {
        it('должен вызывать usePromoCodesFindAll с правильными params', () => {
            const mockParams = {
                page: 1,
                limit: 10,
            };
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(promoCodesApi.usePromoCodesFindAll).mockReturnValue(mockReturnValue as any);
            vi.mocked(promoCodesApi.usePromoCodesCreate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(promoCodesApi.usePromoCodesUpdate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(promoCodesApi.usePromoCodesRemove).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(promoCodesApi.usePromoCodesApply).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { result } = renderHook(() => usePromoCodes(mockParams), { wrapper });

            expect(promoCodesApi.usePromoCodesFindAll).toHaveBeenCalledWith(mockParams, {
                query: {
                    enabled: true,
                },
            });
            expect(result.current.findAll).toEqual(mockReturnValue);
        });

        it('должен возвращать все необходимые методы включая apply', () => {
            vi.mocked(promoCodesApi.usePromoCodesFindAll).mockReturnValue({
                data: null,
                isLoading: false,
                isError: false,
            } as any);
            vi.mocked(promoCodesApi.usePromoCodesCreate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(promoCodesApi.usePromoCodesUpdate).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(promoCodesApi.usePromoCodesRemove).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);
            vi.mocked(promoCodesApi.usePromoCodesApply).mockReturnValue({
                mutate: vi.fn(),
                isPending: false,
            } as any);

            const { result } = renderHook(() => usePromoCodes(), { wrapper });

            expect(result.current.findAll).toBeDefined();
            expect(result.current.create).toBeDefined();
            expect(result.current.update).toBeDefined();
            expect(result.current.remove).toBeDefined();
            expect(result.current.apply).toBeDefined();
        });
    });

    describe('usePromoCode', () => {
        it('должен вызывать usePromoCodesFindById с правильным id', () => {
            const promoCodeId = 'test-id';
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(promoCodesApi.usePromoCodesFindById).mockReturnValue(mockReturnValue as any);

            const { result } = renderHook(() => usePromoCode(promoCodeId), { wrapper });

            expect(promoCodesApi.usePromoCodesFindById).toHaveBeenCalledWith(promoCodeId, {
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

            vi.mocked(promoCodesApi.usePromoCodesFindById).mockReturnValue(mockReturnValue as any);

            renderHook(() => usePromoCode(undefined), { wrapper });

            expect(promoCodesApi.usePromoCodesFindById).toHaveBeenCalledWith('', {
                query: {
                    enabled: false,
                },
            });
        });
    });
});
