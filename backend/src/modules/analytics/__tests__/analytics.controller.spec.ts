import { AnalyticsController } from '@analytics/api/controllers/analytics.controller';
import { PromoCodeAnalyticsDto } from '@analytics/api/dto/promo-code-analytics.dto';
import { PromoCodeStatsDto } from '@analytics/api/dto/promo-code-stats.dto';
import { PromoCodeUsageHistoryDto } from '@analytics/api/dto/promo-code-usage-history.dto';
import { UserAnalyticsDto } from '@analytics/api/dto/user-analytics.dto';
import { AnalyticsService } from '@analytics/application/services/analytics.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginatedResult } from '@common/paginate/interfaces/paginated-result.interface';

describe('AnalyticsController', () => {
    let controller: AnalyticsController;

    const mockPromoCodeStats: PromoCodeStatsDto = {
        usage_count: 150,
        total_discount: 5000.0,
        total_revenue: 50000.0,
        unique_users: 45,
        avg_discount: 33.33,
    };

    const mockPromoCodeAnalytics: PaginatedResult<PromoCodeAnalyticsDto> = {
        items: [
            {
                promo_code_id: '507f1f77bcf86cd799439011',
                promo_code: 'SUMMER2024',
                usage_count: 150,
                total_discount: 5000.0,
                total_revenue: 50000.0,
                unique_users: 45,
            },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
    };

    const mockUserAnalytics: PaginatedResult<UserAnalyticsDto> = {
        items: [
            {
                user_id: '507f1f77bcf86cd799439012',
                orders_count: 25,
                total_amount: 15000.0,
                promo_codes_used: 5,
            },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
    };

    const mockUsageHistory: PaginatedResult<PromoCodeUsageHistoryDto> = {
        items: [
            {
                promo_code: 'SUMMER2024',
                user_id: '507f1f77bcf86cd799439012',
                order_id: '507f1f77bcf86cd799439013',
                order_amount: 1000.0,
                discount_amount: 100.0,
                created_at: '2024-01-15T10:30:00Z',
            },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
    };

    const mockAnalyticsService = {
        getPromoCodeStats: jest.fn(),
        getPromoCodesList: jest.fn(),
        getUsersList: jest.fn(),
        getPromoCodeUsageHistory: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AnalyticsController],
            providers: [
                {
                    provide: AnalyticsService,
                    useValue: mockAnalyticsService,
                },
            ],
        }).compile();

        controller = module.get<AnalyticsController>(AnalyticsController);

        jest.clearAllMocks();
    });

    describe('getPromoCodesList', () => {
        it('should return paginated promo codes analytics', async () => {
            const query = {
                page: 1,
                limit: 10,
            };

            mockAnalyticsService.getPromoCodesList.mockResolvedValue(
                mockPromoCodeAnalytics,
            );

            const result = await controller.getPromoCodesList(query);

            expect(result).toEqual(mockPromoCodeAnalytics);
            expect(mockAnalyticsService.getPromoCodesList).toHaveBeenCalledWith(
                query,
            );
        });
    });

    describe('getPromoCodeStats', () => {
        it('should return promo code statistics', async () => {
            const id = '507f1f77bcf86cd799439011';
            const query = {
                dateFrom: new Date('2024-01-01'),
                dateTo: new Date('2024-12-31'),
            };

            mockAnalyticsService.getPromoCodeStats.mockResolvedValue(
                mockPromoCodeStats,
            );

            const result = await controller.getPromoCodeStats(id, query);

            expect(result).toEqual(mockPromoCodeStats);
            expect(mockAnalyticsService.getPromoCodeStats).toHaveBeenCalledWith(
                id,
                query.dateFrom,
                query.dateTo,
            );
        });

        it('should use default dates when not provided', async () => {
            const id = '507f1f77bcf86cd799439011';
            const query = {};

            mockAnalyticsService.getPromoCodeStats.mockResolvedValue(
                mockPromoCodeStats,
            );

            await controller.getPromoCodeStats(id, query);

            expect(mockAnalyticsService.getPromoCodeStats).toHaveBeenCalledWith(
                id,
                expect.any(Date),
                expect.any(Date),
            );
        });
    });

    describe('getUsersList', () => {
        it('should return paginated users analytics', async () => {
            const query = {
                page: 1,
                limit: 10,
            };

            mockAnalyticsService.getUsersList.mockResolvedValue(
                mockUserAnalytics,
            );

            const result = await controller.getUsersList(query);

            expect(result).toEqual(mockUserAnalytics);
            expect(mockAnalyticsService.getUsersList).toHaveBeenCalledWith(
                query,
            );
        });
    });

    describe('getPromoCodeUsageHistory', () => {
        it('should return paginated usage history', async () => {
            const query = {
                page: 1,
                limit: 10,
            };

            mockAnalyticsService.getPromoCodeUsageHistory.mockResolvedValue(
                mockUsageHistory,
            );

            const result = await controller.getPromoCodeUsageHistory(query);

            expect(result).toEqual(mockUsageHistory);
            expect(
                mockAnalyticsService.getPromoCodeUsageHistory,
            ).toHaveBeenCalledWith(query);
        });
    });
});
