import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
    usePromoCodesAnalytics,
    usePromoCodeStats,
    useUsersAnalytics,
    usePromoCodeUsageHistory,
} from '../hooks/use-analytics';
import * as analyticsApi from '@entities/analytics';

// Мокаем API хуки
vi.mock('@entities/analytics', () => ({
    useAnalyticsGetPromoCodesList: vi.fn(),
    useAnalyticsGetPromoCodeStats: vi.fn(),
    useAnalyticsGetUsersList: vi.fn(),
    useAnalyticsGetPromoCodeUsageHistory: vi.fn(),
}));

describe('use-analytics', () => {
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
        vi.clearAllMocks();
    });

    describe('usePromoCodesAnalytics', () => {
        it('should call useAnalyticsGetPromoCodesList with correct params', () => {
            const mockParams = {
                page: 1,
                limit: 10,
                datePreset: 'last30days' as const,
            };
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(analyticsApi.useAnalyticsGetPromoCodesList).mockReturnValue(
                mockReturnValue as any,
            );

            const { result } = renderHook(() => usePromoCodesAnalytics(mockParams), {
                wrapper,
            });

            expect(analyticsApi.useAnalyticsGetPromoCodesList).toHaveBeenCalledWith(mockParams, {
                query: {
                    enabled: true,
                },
            });
            expect(result.current).toEqual(mockReturnValue);
        });

        it('should work without params', () => {
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(analyticsApi.useAnalyticsGetPromoCodesList).mockReturnValue(
                mockReturnValue as any,
            );

            renderHook(() => usePromoCodesAnalytics(), { wrapper });

            expect(analyticsApi.useAnalyticsGetPromoCodesList).toHaveBeenCalledWith(undefined, {
                query: {
                    enabled: true,
                },
            });
        });
    });

    describe('usePromoCodeStats', () => {
        it('should call useAnalyticsGetPromoCodeStats with correct params', () => {
            const promoCodeId = 'test-id';
            const mockParams = {
                datePreset: 'last7days' as const,
            };
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(analyticsApi.useAnalyticsGetPromoCodeStats).mockReturnValue(
                mockReturnValue as any,
            );

            const { result } = renderHook(() => usePromoCodeStats(promoCodeId, mockParams), {
                wrapper,
            });

            expect(analyticsApi.useAnalyticsGetPromoCodeStats).toHaveBeenCalledWith(
                promoCodeId,
                mockParams,
                {
                    query: {
                        enabled: true,
                    },
                },
            );
            expect(result.current).toEqual(mockReturnValue);
        });

        it('should disable query when promoCodeId is undefined', () => {
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(analyticsApi.useAnalyticsGetPromoCodeStats).mockReturnValue(
                mockReturnValue as any,
            );

            renderHook(() => usePromoCodeStats(undefined), { wrapper });

            expect(analyticsApi.useAnalyticsGetPromoCodeStats).toHaveBeenCalledWith('', undefined, {
                query: {
                    enabled: false,
                },
            });
        });
    });

    describe('useUsersAnalytics', () => {
        it('should call useAnalyticsGetUsersList with correct params', () => {
            const mockParams = {
                page: 1,
                limit: 20,
                datePreset: 'today' as const,
            };
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(analyticsApi.useAnalyticsGetUsersList).mockReturnValue(
                mockReturnValue as any,
            );

            const { result } = renderHook(() => useUsersAnalytics(mockParams), {
                wrapper,
            });

            expect(analyticsApi.useAnalyticsGetUsersList).toHaveBeenCalledWith(mockParams, {
                query: {
                    enabled: true,
                },
            });
            expect(result.current).toEqual(mockReturnValue);
        });
    });

    describe('usePromoCodeUsageHistory', () => {
        it('should call useAnalyticsGetPromoCodeUsageHistory with correct params', () => {
            const mockParams = {
                page: 1,
                limit: 10,
                datePreset: 'last30days' as const,
            };
            const mockReturnValue = {
                data: null,
                isLoading: false,
                isError: false,
            };

            vi.mocked(analyticsApi.useAnalyticsGetPromoCodeUsageHistory).mockReturnValue(
                mockReturnValue as any,
            );

            const { result } = renderHook(() => usePromoCodeUsageHistory(mockParams), { wrapper });

            expect(analyticsApi.useAnalyticsGetPromoCodeUsageHistory).toHaveBeenCalledWith(
                mockParams,
                {
                    query: {
                        enabled: true,
                    },
                },
            );
            expect(result.current).toEqual(mockReturnValue);
        });
    });
});
