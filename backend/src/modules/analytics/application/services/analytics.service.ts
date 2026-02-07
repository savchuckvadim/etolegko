import {
    PromoCodeAnalyticsQueryDto,
    PromoCodeUsageHistoryQueryDto,
    UserAnalyticsQueryDto,
} from '@analytics/api/dto/analytics-query.dto';
import { PromoCodeAnalyticsDto } from '@analytics/api/dto/promo-code-analytics.dto';
import { PromoCodeStatsDto } from '@analytics/api/dto/promo-code-stats.dto';
import { PromoCodeUsageHistoryDto } from '@analytics/api/dto/promo-code-usage-history.dto';
import { UserAnalyticsDto } from '@analytics/api/dto/user-analytics.dto';
import { AnalyticsRepository } from '@analytics/infrastructure/repositories/analytics.repository';
import { Injectable, Logger } from '@nestjs/common';
import { SortOrder } from '@common/paginate/dto/pagination.dto';
import { PaginatedResult } from '@common/paginate/interfaces/paginated-result.interface';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(private readonly analyticsRepository: AnalyticsRepository) {}

    /**
     * Получить статистику по промокоду
     */
    async getPromoCodeStats(
        promoCodeId: string,
        dateFrom: Date,
        dateTo: Date,
    ): Promise<PromoCodeStatsDto> {
        try {
            return await this.analyticsRepository.getPromoCodeStats(
                promoCodeId,
                dateFrom.toISOString().split('T')[0],
                dateTo.toISOString().split('T')[0],
            );
        } catch (error) {
            this.logger.error(
                `Failed to get promo code stats: ${promoCodeId}`,
                error instanceof Error ? error.stack : error,
            );
            throw error;
        }
    }

    /**
     * Получить список промокодов с аналитикой
     */
    async getPromoCodesList(
        query: PromoCodeAnalyticsQueryDto,
    ): Promise<PaginatedResult<PromoCodeAnalyticsDto>> {
        const {
            page = 1,
            limit = 10,
            dateFrom,
            dateTo,
            sortBy = 'usage_count',
            sortOrder = SortOrder.DESC,
        } = query;

        // Устанавливаем дефолтные даты, если не указаны
        const fromDate =
            dateFrom ||
            new Date(new Date().setMonth(new Date().getMonth() - 1));
        const toDate = dateTo || new Date();

        try {
            return await this.analyticsRepository.getPromoCodesList(
                fromDate.toISOString().split('T')[0],
                toDate.toISOString().split('T')[0],
                page,
                limit,
                sortBy,
                sortOrder,
            );
        } catch (error) {
            this.logger.error(
                'Failed to get promo codes list',
                error instanceof Error ? error.stack : error,
            );
            throw error;
        }
    }

    /**
     * Получить список пользователей с аналитикой
     */
    async getUsersList(
        query: UserAnalyticsQueryDto,
    ): Promise<PaginatedResult<UserAnalyticsDto>> {
        const {
            page = 1,
            limit = 10,
            dateFrom,
            dateTo,
            sortBy = 'total_amount',
            sortOrder = SortOrder.DESC,
        } = query;

        // Устанавливаем дефолтные даты, если не указаны
        const fromDate =
            dateFrom ||
            new Date(new Date().setMonth(new Date().getMonth() - 1));
        const toDate = dateTo || new Date();

        try {
            return await this.analyticsRepository.getUsersList(
                fromDate.toISOString().split('T')[0],
                toDate.toISOString().split('T')[0],
                page,
                limit,
                sortBy,
                sortOrder,
            );
        } catch (error) {
            this.logger.error(
                'Failed to get users list',
                error instanceof Error ? error.stack : error,
            );
            throw error;
        }
    }

    /**
     * Получить историю использований промокодов
     */
    async getPromoCodeUsageHistory(
        query: PromoCodeUsageHistoryQueryDto,
    ): Promise<PaginatedResult<PromoCodeUsageHistoryDto>> {
        const {
            page = 1,
            limit = 10,
            promoCodeId,
            dateFrom,
            dateTo,
            sortBy = 'created_at',
            sortOrder = SortOrder.DESC,
        } = query;

        // Устанавливаем дефолтные даты, если не указаны
        const fromDate =
            dateFrom ||
            new Date(new Date().setMonth(new Date().getMonth() - 1));
        const toDate = dateTo || new Date();

        try {
            return await this.analyticsRepository.getPromoCodeUsageHistory(
                fromDate.toISOString().split('T')[0],
                toDate.toISOString().split('T')[0],
                promoCodeId,
                page,
                limit,
                sortBy,
                sortOrder,
            );
        } catch (error) {
            this.logger.error(
                'Failed to get promo code usage history',
                error instanceof Error ? error.stack : error,
            );
            throw error;
        }
    }
}
