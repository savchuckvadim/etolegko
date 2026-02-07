import {
    DatePreset,
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
     * Вычислить диапазон дат на основе пресета
     */
    private calculateDateRange(
        preset: DatePreset,
        dateFrom?: Date,
        dateTo?: Date,
    ): { dateFrom: Date; dateTo: Date } {
        const now = new Date();
        const toDate: Date = dateTo
            ? new Date(
                  Date.UTC(
                      dateTo.getFullYear(),
                      dateTo.getMonth(),
                      dateTo.getDate(),
                      23,
                      59,
                      59,
                      999,
                  ),
              )
            : new Date(
                  Date.UTC(
                      now.getFullYear(),
                      now.getMonth(),
                      now.getDate(),
                      23,
                      59,
                      59,
                      999,
                  ),
              );

        let fromDate: Date;

        switch (preset) {
            case DatePreset.TODAY:
                fromDate = new Date(
                    Date.UTC(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate(),
                        0,
                        0,
                        0,
                    ),
                );
                break;
            case DatePreset.LAST_7_DAYS:
                fromDate = new Date(toDate);
                fromDate.setUTCDate(fromDate.getUTCDate() - 7);
                fromDate.setUTCHours(0, 0, 0, 0);
                break;
            case DatePreset.LAST_30_DAYS:
                fromDate = new Date(toDate);
                fromDate.setUTCDate(fromDate.getUTCDate() - 30);
                fromDate.setUTCHours(0, 0, 0, 0);
                break;
            case DatePreset.CUSTOM:
                if (!dateFrom) {
                    // Если custom, но dateFrom не указан, используем последние 30 дней
                    fromDate = new Date(toDate);
                    fromDate.setUTCDate(fromDate.getUTCDate() - 30);
                    fromDate.setUTCHours(0, 0, 0, 0);
                } else {
                    fromDate = new Date(
                        Date.UTC(
                            dateFrom.getFullYear(),
                            dateFrom.getMonth(),
                            dateFrom.getDate(),
                            0,
                            0,
                            0,
                        ),
                    );
                }
                break;
            default:
                // По умолчанию последние 30 дней
                fromDate = new Date(toDate);
                fromDate.setUTCDate(fromDate.getUTCDate() - 30);
                fromDate.setUTCHours(0, 0, 0, 0);
        }

        return { dateFrom: fromDate, dateTo: toDate };
    }

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
            datePreset = DatePreset.LAST_30_DAYS,
            dateFrom,
            dateTo,
            sortBy = 'usage_count',
            sortOrder = SortOrder.DESC,
        } = query;

        // Вычисляем диапазон дат на основе пресета
        const { dateFrom: fromDate, dateTo: toDate } = this.calculateDateRange(
            datePreset,
            dateFrom,
            dateTo,
        );

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
            datePreset = DatePreset.LAST_30_DAYS,
            dateFrom,
            dateTo,
            sortBy = 'total_amount',
            sortOrder = SortOrder.DESC,
        } = query;

        // Вычисляем диапазон дат на основе пресета
        const { dateFrom: fromDate, dateTo: toDate } = this.calculateDateRange(
            datePreset,
            dateFrom,
            dateTo,
        );

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
            datePreset = DatePreset.LAST_30_DAYS,
            dateFrom,
            dateTo,
            sortBy = 'created_at',
            sortOrder = SortOrder.DESC,
        } = query;

        // Вычисляем диапазон дат на основе пресета
        const { dateFrom: fromDate, dateTo: toDate } = this.calculateDateRange(
            datePreset,
            dateFrom,
            dateTo,
        );

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
