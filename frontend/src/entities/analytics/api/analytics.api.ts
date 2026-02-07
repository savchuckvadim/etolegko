/**
 * Analytics Entity - API клиенты
 * Re-export сгенерированных hooks для удобства использования
 */

export {
    useAnalyticsGetPromoCodesList,
    useAnalyticsGetPromoCodeStats,
    useAnalyticsGetUsersList,
    useAnalyticsGetPromoCodeUsageHistory,
    type AnalyticsGetPromoCodesListQueryResult,
    type AnalyticsGetPromoCodeStatsQueryResult,
    type AnalyticsGetUsersListQueryResult,
    type AnalyticsGetPromoCodeUsageHistoryQueryResult,
} from '@shared/api/generated/analytics/analytics';

export type {
    PromoCodeAnalyticsDto,
    PromoCodeStatsDto,
    UserAnalyticsDto,
    PromoCodeUsageHistoryDto,
    AnalyticsGetPromoCodesListParams,
    AnalyticsGetPromoCodeStatsParams,
    AnalyticsGetUsersListParams,
    AnalyticsGetPromoCodeUsageHistoryParams,
    PaginatedResponsePromoCodeAnalyticsDto,
    PaginatedResponseUserAnalyticsDto,
    PaginatedResponsePromoCodeUsageHistoryDto,
} from '@shared/api/generated/models';
