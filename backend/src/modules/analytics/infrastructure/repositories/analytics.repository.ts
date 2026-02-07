import { PromoCodeAnalyticsDto } from '@analytics/api/dto/promo-code-analytics.dto';
import { PromoCodeStatsDto } from '@analytics/api/dto/promo-code-stats.dto';
import { PromoCodeUsageHistoryDto } from '@analytics/api/dto/promo-code-usage-history.dto';
import { UserAnalyticsDto } from '@analytics/api/dto/user-analytics.dto';
import { Injectable } from '@nestjs/common';
import { ClickHouseService } from '@shared/database/clickhouse/clickhouse.service';
import { SortOrder } from '@common/paginate/dto/pagination.dto';
import { PaginatedResult } from '@common/paginate/interfaces/paginated-result.interface';

/**
 * Analytics Repository
 * Инкапсулирует все SQL-запросы к ClickHouse для аналитики
 * Находится в infrastructure слое модуля analytics
 */
@Injectable()
export class AnalyticsRepository {
    constructor(private readonly clickhouse: ClickHouseService) {}

    /**
     * Получить статистику по промокоду
     */
    async getPromoCodeStats(
        promoCodeId: string,
        dateFrom: string, // YYYY-MM-DD
        dateTo: string, // YYYY-MM-DD
    ): Promise<PromoCodeStatsDto> {
        const query = `
            SELECT
                count() as usage_count,
                sum(discount_amount) as total_discount,
                sum(order_amount) as total_revenue,
                uniq(user_id) as unique_users,
                avg(discount_amount) as avg_discount
            FROM promo_code_usages_analytics
            WHERE promo_code_id = {promoCodeId:String}
                AND event_date >= {dateFrom:Date}
                AND event_date <= {dateTo:Date}
        `;

        const result = await this.clickhouse.query<PromoCodeStatsDto>(query, {
            promoCodeId,
            dateFrom,
            dateTo,
        });

        return (
            result[0] || {
                usage_count: 0,
                total_discount: 0,
                total_revenue: 0,
                unique_users: 0,
                avg_discount: 0,
            }
        );
    }

    /**
     * Получить список промокодов с аналитикой (с пагинацией)
     */
    async getPromoCodesList(
        dateFrom: string, // YYYY-MM-DD
        dateTo: string, // YYYY-MM-DD
        page: number,
        limit: number,
        sortBy: string,
        sortOrder: SortOrder,
    ): Promise<PaginatedResult<PromoCodeAnalyticsDto>> {
        // Подзапрос для агрегации
        const subquery = `
            SELECT
                promo_code_id,
                promo_code,
                count() as usage_count,
                sum(discount_amount) as total_discount,
                sum(order_amount) as total_revenue,
                uniq(user_id) as unique_users
            FROM promo_code_usages_analytics
            WHERE event_date >= {dateFrom:Date}
                AND event_date <= {dateTo:Date}
            GROUP BY promo_code_id, promo_code
        `;

        // Общий запрос с пагинацией
        const countQuery = `SELECT count() as count FROM (${subquery})`;
        const dataQuery = `
            SELECT *
            FROM (${subquery})
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT {limit:UInt32} OFFSET {offset:UInt32}
        `;

        const params = {
            dateFrom,
            dateTo,
            limit,
            offset: (page - 1) * limit,
        };

        const [countResult, dataResult] = await Promise.all([
            this.clickhouse.query<{ count: number }>(countQuery, params),
            this.clickhouse.query<PromoCodeAnalyticsDto>(dataQuery, params),
        ]);

        const total = countResult[0]?.count || 0;

        return {
            items: dataResult,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Получить список пользователей с аналитикой (с пагинацией)
     */
    async getUsersList(
        dateFrom: string, // YYYY-MM-DD
        dateTo: string, // YYYY-MM-DD
        page: number,
        limit: number,
        sortBy: string,
        sortOrder: SortOrder,
    ): Promise<PaginatedResult<UserAnalyticsDto>> {
        const subquery = `
            SELECT
                user_id,
                sum(orders_count) as orders_count,
                sum(total_amount) as total_amount,
                sum(promo_codes_used) as promo_codes_used
            FROM users_analytics
            WHERE event_date >= {dateFrom:Date}
                AND event_date <= {dateTo:Date}
            GROUP BY user_id
        `;

        const countQuery = `SELECT count() as count FROM (${subquery})`;
        const dataQuery = `
            SELECT *
            FROM (${subquery})
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT {limit:UInt32} OFFSET {offset:UInt32}
        `;

        const params = {
            dateFrom,
            dateTo,
            limit,
            offset: (page - 1) * limit,
        };

        const [countResult, dataResult] = await Promise.all([
            this.clickhouse.query<{ count: number }>(countQuery, params),
            this.clickhouse.query<UserAnalyticsDto>(dataQuery, params),
        ]);

        const total = countResult[0]?.count || 0;

        return {
            items: dataResult,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Получить историю использований промокодов (с пагинацией)
     */
    async getPromoCodeUsageHistory(
        dateFrom: string, // YYYY-MM-DD
        dateTo: string, // YYYY-MM-DD
        promoCodeId: string | undefined,
        page: number,
        limit: number,
        sortBy: string,
        sortOrder: SortOrder,
    ): Promise<PaginatedResult<PromoCodeUsageHistoryDto>> {
        const whereClause = promoCodeId
            ? `promo_code_id = {promoCodeId:String} AND event_date >= {dateFrom:Date} AND event_date <= {dateTo:Date}`
            : `event_date >= {dateFrom:Date} AND event_date <= {dateTo:Date}`;

        const countQuery = `
            SELECT count() as count
            FROM promo_code_usages_analytics
            WHERE ${whereClause}
        `;

        const dataQuery = `
            SELECT
                promo_code,
                user_id,
                order_id,
                order_amount,
                discount_amount,
                created_at
            FROM promo_code_usages_analytics
            WHERE ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT {limit:UInt32} OFFSET {offset:UInt32}
        `;

        const params: Record<string, unknown> = {
            dateFrom,
            dateTo,
            limit,
            offset: (page - 1) * limit,
        };

        if (promoCodeId) {
            params.promoCodeId = promoCodeId;
        }

        const [countResult, dataResult] = await Promise.all([
            this.clickhouse.query<{ count: number }>(countQuery, params),
            this.clickhouse.query<PromoCodeUsageHistoryDto>(dataQuery, params),
        ]);

        const total = countResult[0]?.count || 0;

        return {
            items: dataResult,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
