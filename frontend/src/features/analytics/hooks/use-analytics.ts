import {
    useAnalyticsGetPromoCodesList,
    useAnalyticsGetPromoCodeStats,
    useAnalyticsGetUsersList,
    useAnalyticsGetPromoCodeUsageHistory,
    type AnalyticsGetPromoCodesListParams,
    type AnalyticsGetPromoCodeStatsParams,
    type AnalyticsGetUsersListParams,
    type AnalyticsGetPromoCodeUsageHistoryParams,
} from '@entities/analytics';

/**
 * Хук для работы с аналитикой промокодов
 */
export const usePromoCodesAnalytics = (params?: AnalyticsGetPromoCodesListParams) => {
    return useAnalyticsGetPromoCodesList(params, {
        query: {
            enabled: true,
        },
    });
};

/**
 * Хук для получения статистики по промокоду
 */
export const usePromoCodeStats = (
    promoCodeId: string | undefined,
    params?: AnalyticsGetPromoCodeStatsParams,
) => {
    return useAnalyticsGetPromoCodeStats(promoCodeId ?? '', params, {
        query: {
            enabled: !!promoCodeId,
        },
    });
};

/**
 * Хук для работы с аналитикой пользователей
 */
export const useUsersAnalytics = (params?: AnalyticsGetUsersListParams) => {
    return useAnalyticsGetUsersList(params, {
        query: {
            enabled: true,
        },
    });
};

/**
 * Хук для истории использований промокодов
 */
export const usePromoCodeUsageHistory = (params?: AnalyticsGetPromoCodeUsageHistoryParams) => {
    return useAnalyticsGetPromoCodeUsageHistory(params, {
        query: {
            enabled: true,
        },
    });
};
