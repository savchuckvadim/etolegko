import {
    DateRangeQueryDto,
    PromoCodeAnalyticsQueryDto,
    PromoCodeUsageHistoryQueryDto,
    UserAnalyticsQueryDto,
} from '@analytics/api/dto/analytics-query.dto';
import { PromoCodeAnalyticsDto } from '@analytics/api/dto/promo-code-analytics.dto';
import { PromoCodeStatsDto } from '@analytics/api/dto/promo-code-stats.dto';
import { PromoCodeUsageHistoryDto } from '@analytics/api/dto/promo-code-usage-history.dto';
import { UserAnalyticsDto } from '@analytics/api/dto/user-analytics.dto';
import { AnalyticsService } from '@analytics/application/services/analytics.service';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuth } from '@common/decorators/auth/jwt-auth.decorator';
import { ApiErrorResponse } from '@common/decorators/response/api-error-response.decorator';
import { ApiPaginatedResponse } from '@common/decorators/response/api-paginated-response.decorator';
import { ApiSuccessResponseDecorator } from '@common/decorators/response/api-success-response.decorator';
import { PaginatedResult } from '@common/paginate/interfaces/paginated-result.interface';

@ApiTags('Analytics')
@Controller('analytics')
@JwtAuth() // Все роуты в контроллере защищены JWT
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('promo-codes')
    @ApiOperation({ summary: 'Get promo codes analytics with pagination' })
    @ApiPaginatedResponse(PromoCodeAnalyticsDto, {
        description: 'Promo codes analytics retrieved successfully',
    })
    @ApiErrorResponse([400])
    async getPromoCodesList(
        @Query() query: PromoCodeAnalyticsQueryDto,
    ): Promise<PaginatedResult<PromoCodeAnalyticsDto>> {
        return this.analyticsService.getPromoCodesList(query);
    }

    @Get('promo-codes/:id/stats')
    @ApiOperation({ summary: 'Get promo code statistics' })
    @ApiParam({ name: 'id', description: 'Promo code ID' })
    @ApiSuccessResponseDecorator(PromoCodeStatsDto, {
        description: 'Promo code statistics retrieved successfully',
    })
    @ApiErrorResponse([400, 404])
    async getPromoCodeStats(
        @Param('id') id: string,
        @Query() query: DateRangeQueryDto,
    ): Promise<PromoCodeStatsDto> {
        const dateFrom =
            query.dateFrom ||
            new Date(new Date().setMonth(new Date().getMonth() - 1));
        const dateTo = query.dateTo || new Date();
        return this.analyticsService.getPromoCodeStats(id, dateFrom, dateTo);
    }

    @Get('users')
    @ApiOperation({ summary: 'Get users analytics with pagination' })
    @ApiPaginatedResponse(UserAnalyticsDto, {
        description: 'Users analytics retrieved successfully',
    })
    @ApiErrorResponse([400])
    async getUsersList(
        @Query() query: UserAnalyticsQueryDto,
    ): Promise<PaginatedResult<UserAnalyticsDto>> {
        return this.analyticsService.getUsersList(query);
    }

    @Get('promo-code-usages')
    @ApiOperation({ summary: 'Get promo code usage history with pagination' })
    @ApiPaginatedResponse(PromoCodeUsageHistoryDto, {
        description: 'Promo code usage history retrieved successfully',
    })
    @ApiErrorResponse([400])
    async getPromoCodeUsageHistory(
        @Query() query: PromoCodeUsageHistoryQueryDto,
    ): Promise<PaginatedResult<PromoCodeUsageHistoryDto>> {
        return this.analyticsService.getPromoCodeUsageHistory(query);
    }
}
