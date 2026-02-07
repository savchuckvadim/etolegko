import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAnalyticsPage } from '../hooks/use-analytics-page';
import * as analyticsHooks from '../hooks/use-analytics';

// Мокаем хуки аналитики
vi.mock('../hooks/use-analytics', () => ({
    usePromoCodesAnalytics: vi.fn(),
    useUsersAnalytics: vi.fn(),
    usePromoCodeUsageHistory: vi.fn(),
}));

describe('useAnalyticsPage', () => {
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
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        // Мокаем возвращаемые значения хуков
        vi.mocked(analyticsHooks.usePromoCodesAnalytics).mockReturnValue({
            data: null,
            isLoading: false,
            isError: false,
        } as any);

        vi.mocked(analyticsHooks.useUsersAnalytics).mockReturnValue({
            data: null,
            isLoading: false,
            isError: false,
        } as any);

        vi.mocked(analyticsHooks.usePromoCodeUsageHistory).mockReturnValue({
            data: null,
            isLoading: false,
            isError: false,
        } as any);

        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should initialize with default values', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            expect(result.current.activeTab).toBe(0);
            expect(result.current.promoCodesDatePreset).toBe('last30days');
            expect(result.current.usersDatePreset).toBe('last30days');
            expect(result.current.historyDatePreset).toBe('last30days');
            expect(result.current.promoCodesParams.page).toBe(1);
            expect(result.current.promoCodesParams.limit).toBe(10);
        });

        it('should initialize dates correctly', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const last30Days = new Date(today);
            last30Days.setDate(today.getDate() - 30);
            const expectedFrom = last30Days.toISOString().split('T')[0];

            expect(result.current.promoCodesDateFrom).toBe(expectedFrom);
            expect(result.current.promoCodesDateTo).toBe(todayStr);
        });
    });

    describe('tab management', () => {
        it('should change active tab', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            act(() => {
                result.current.handleTabChange(null, 1);
            });

            expect(result.current.activeTab).toBe(1);

            act(() => {
                result.current.handleTabChange(null, 2);
            });

            expect(result.current.activeTab).toBe(2);
        });
    });

    describe('date preset changes', () => {
        it('should update promoCodes date preset to today', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            act(() => {
                result.current.handlePromoCodesDatePresetChange('today');
            });

            const today = new Date().toISOString().split('T')[0];
            expect(result.current.promoCodesDatePreset).toBe('today');
            expect(result.current.promoCodesDateFrom).toBe(today);
            expect(result.current.promoCodesDateTo).toBe(today);
            expect(result.current.promoCodesParams.datePreset).toBe('today');
            expect(result.current.promoCodesParams.page).toBe(1); // Сбрасывается на первую страницу
        });

        it('should update promoCodes date preset to last7days', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            act(() => {
                result.current.handlePromoCodesDatePresetChange('last7days');
            });

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const last7Days = new Date(today);
            last7Days.setDate(today.getDate() - 7);
            const expectedFrom = last7Days.toISOString().split('T')[0];

            expect(result.current.promoCodesDatePreset).toBe('last7days');
            expect(result.current.promoCodesDateFrom).toBe(expectedFrom);
            expect(result.current.promoCodesDateTo).toBe(todayStr);
        });

        it('should update users date preset', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            act(() => {
                result.current.handleUsersDatePresetChange('today');
            });

            expect(result.current.usersDatePreset).toBe('today');
            expect(result.current.usersParams.datePreset).toBe('today');
        });

        it('should update history date preset', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            act(() => {
                result.current.handleHistoryDatePresetChange('last7days');
            });

            expect(result.current.historyDatePreset).toBe('last7days');
            expect(result.current.historyParams.datePreset).toBe('last7days');
        });
    });

    describe('custom date changes', () => {
        it('should update promoCodes custom date from', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            const customDate = '2024-01-15';

            act(() => {
                result.current.handlePromoCodesDateFromChange(customDate);
            });

            expect(result.current.promoCodesDateFrom).toBe(customDate);
            expect(result.current.promoCodesParams.dateFrom).toBe(customDate);
            expect(result.current.promoCodesParams.page).toBe(1);
        });

        it('should update promoCodes custom date to', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            const customDate = '2024-01-20';

            act(() => {
                result.current.handlePromoCodesDateToChange(customDate);
            });

            expect(result.current.promoCodesDateTo).toBe(customDate);
            expect(result.current.promoCodesParams.dateTo).toBe(customDate);
            expect(result.current.promoCodesParams.page).toBe(1);
        });

        it('should update users custom dates', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            const dateFrom = '2024-01-10';
            const dateTo = '2024-01-25';

            act(() => {
                result.current.handleUsersDateFromChange(dateFrom);
                result.current.handleUsersDateToChange(dateTo);
            });

            expect(result.current.usersDateFrom).toBe(dateFrom);
            expect(result.current.usersDateTo).toBe(dateTo);
            expect(result.current.usersParams.dateFrom).toBe(dateFrom);
            expect(result.current.usersParams.dateTo).toBe(dateTo);
        });

        it('should update history custom dates', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            const dateFrom = '2024-02-01';
            const dateTo = '2024-02-28';

            act(() => {
                result.current.handleHistoryDateFromChange(dateFrom);
                result.current.handleHistoryDateToChange(dateTo);
            });

            expect(result.current.historyDateFrom).toBe(dateFrom);
            expect(result.current.historyDateTo).toBe(dateTo);
            expect(result.current.historyParams.dateFrom).toBe(dateFrom);
            expect(result.current.historyParams.dateTo).toBe(dateTo);
        });
    });

    describe('pagination', () => {
        it('should update promoCodes params', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            const newParams = {
                page: 2,
                limit: 20,
                datePreset: 'last30days' as const,
                dateFrom: '2024-01-01',
                dateTo: '2024-01-31',
            };

            act(() => {
                result.current.setPromoCodesParams(newParams);
            });

            expect(result.current.promoCodesParams).toEqual(newParams);
        });

        it('should update users params', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            const newParams = {
                page: 3,
                limit: 15,
                datePreset: 'today' as const,
                dateFrom: '2024-01-15',
                dateTo: '2024-01-15',
            };

            act(() => {
                result.current.setUsersParams(newParams);
            });

            expect(result.current.usersParams).toEqual(newParams);
        });

        it('should update history params', () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            const newParams = {
                page: 1,
                limit: 50,
                datePreset: 'last7days' as const,
                dateFrom: '2024-02-01',
                dateTo: '2024-02-07',
            };

            act(() => {
                result.current.setHistoryParams(newParams);
            });

            expect(result.current.historyParams).toEqual(newParams);
        });
    });

    describe('query hooks integration', () => {
        it('should call analytics hooks with correct params', () => {
            renderHook(() => useAnalyticsPage(), { wrapper });

            expect(analyticsHooks.usePromoCodesAnalytics).toHaveBeenCalled();
            expect(analyticsHooks.useUsersAnalytics).toHaveBeenCalled();
            expect(analyticsHooks.usePromoCodeUsageHistory).toHaveBeenCalled();
        });

        it('should pass updated params to queries', async () => {
            const { result } = renderHook(() => useAnalyticsPage(), { wrapper });

            const newPromoCodesParams = {
                page: 2,
                limit: 20,
                datePreset: 'today' as const,
                dateFrom: '2024-01-15',
                dateTo: '2024-01-15',
            };

            act(() => {
                result.current.setPromoCodesParams(newPromoCodesParams);
            });

            await waitFor(() => {
                expect(analyticsHooks.usePromoCodesAnalytics).toHaveBeenCalled();
            });
        });
    });
});
