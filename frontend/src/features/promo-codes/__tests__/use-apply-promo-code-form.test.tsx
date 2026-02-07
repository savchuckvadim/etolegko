import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useApplyPromoCodeForm } from '../hooks/use-apply-promo-code-form';
import * as promoCodesApi from '@entities/promo-codes';

// Мокаем зависимости
vi.mock('@entities/promo-codes', () => ({
    usePromoCodesApply: vi.fn(),
}));

describe('useApplyPromoCodeForm', () => {
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
            vi.mocked(promoCodesApi.usePromoCodesApply).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useApplyPromoCodeForm(), { wrapper });

            expect(result.current.errors).toEqual({});
            expect(result.current.isSubmitting).toBe(false);
        });

        it('должен предоставлять register функции для всех полей', () => {
            const mockMutate = vi.fn();
            vi.mocked(promoCodesApi.usePromoCodesApply).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useApplyPromoCodeForm(), { wrapper });

            expect(result.current.register).toBeDefined();
            expect(typeof result.current.register('orderId')).toBe('object');
            expect(typeof result.current.register('promoCode')).toBe('object');
        });
    });

    describe('структура хука', () => {
        it('должен возвращать все необходимые методы и свойства', () => {
            const mockMutate = vi.fn();
            vi.mocked(promoCodesApi.usePromoCodesApply).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useApplyPromoCodeForm(), { wrapper });

            expect(result.current.register).toBeDefined();
            expect(result.current.handleSubmit).toBeDefined();
            expect(result.current.errors).toBeDefined();
            expect(result.current.isSubmitting).toBeDefined();
            expect(result.current.reset).toBeDefined();
        });
    });
});
