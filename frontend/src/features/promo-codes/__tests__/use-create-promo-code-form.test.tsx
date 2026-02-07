import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreatePromoCodeForm } from '../hooks/use-create-promo-code-form';
import * as promoCodesApi from '@entities/promo-codes';

// Мокаем зависимости
vi.mock('@entities/promo-codes', () => ({
    usePromoCodesCreate: vi.fn(),
}));

describe('useCreatePromoCodeForm', () => {
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
            vi.mocked(promoCodesApi.usePromoCodesCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useCreatePromoCodeForm(), { wrapper });

            expect(result.current.errors).toEqual({});
            expect(result.current.isSubmitting).toBe(false);
        });

        it('должен предоставлять register функции для всех полей', () => {
            const mockMutate = vi.fn();
            vi.mocked(promoCodesApi.usePromoCodesCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useCreatePromoCodeForm(), { wrapper });

            expect(result.current.register).toBeDefined();
            expect(typeof result.current.register('code')).toBe('object');
            expect(typeof result.current.register('discountPercent')).toBe('object');
            expect(typeof result.current.register('totalLimit')).toBe('object');
            expect(typeof result.current.register('perUserLimit')).toBe('object');
        });
    });

    describe('структура хука', () => {
        it('должен возвращать все необходимые методы и свойства', () => {
            const mockMutate = vi.fn();
            vi.mocked(promoCodesApi.usePromoCodesCreate).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
            } as any);

            const { result } = renderHook(() => useCreatePromoCodeForm(), { wrapper });

            expect(result.current.register).toBeDefined();
            expect(result.current.handleSubmit).toBeDefined();
            expect(result.current.errors).toBeDefined();
            expect(result.current.isSubmitting).toBeDefined();
            expect(result.current.reset).toBeDefined();
        });

        it('должен показывать isSubmitting во время отправки', () => {
            vi.mocked(promoCodesApi.usePromoCodesCreate).mockReturnValue({
                mutate: vi.fn(),
                isPending: true,
            } as any);

            const { result } = renderHook(() => useCreatePromoCodeForm(), { wrapper });

            expect(result.current.isSubmitting).toBe(true);
        });
    });
});
