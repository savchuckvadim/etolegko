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
import { AnalyticsService } from '@analytics/application/services/analytics.service';
import { AnalyticsRepository } from '@analytics/infrastructure/repositories/analytics.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '@common/paginate/dto/pagination.dto';

describe('AnalyticsService', () => {
    let service: AnalyticsService;

    const mockAnalyticsRepository = {
        getPromoCodeStats: jest.fn(),
        getPromoCodesList: jest.fn(),
        getUsersList: jest.fn(),
        getPromoCodeUsageHistory: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsService,
                {
                    provide: AnalyticsRepository,
                    useValue: mockAnalyticsRepository,
                },
            ],
        }).compile();

        service = module.get<AnalyticsService>(AnalyticsService);

        jest.clearAllMocks();
    });

    describe('getPromoCodeStats', () => {
        it('should return promo code statistics', async () => {
            const promoCodeId = '507f1f77bcf86cd799439011';
            const dateFrom = new Date('2024-01-01');
            const dateTo = new Date('2024-12-31');

            const mockStats: PromoCodeStatsDto = {
                usage_count: 150,
                total_discount: 5000.0,
                total_revenue: 50000.0,
                unique_users: 45,
                avg_discount: 33.33,
            };

            mockAnalyticsRepository.getPromoCodeStats.mockResolvedValue(
                mockStats,
            );

            const result = await service.getPromoCodeStats(
                promoCodeId,
                dateFrom,
                dateTo,
            );

            expect(result).toEqual(mockStats);
            expect(
                mockAnalyticsRepository.getPromoCodeStats,
            ).toHaveBeenCalledWith(promoCodeId, '2024-01-01', '2024-12-31');
        });

        it('should return default values when no data found', async () => {
            const promoCodeId = '507f1f77bcf86cd799439011';
            const dateFrom = new Date('2024-01-01');
            const dateTo = new Date('2024-12-31');

            const defaultStats: PromoCodeStatsDto = {
                usage_count: 0,
                total_discount: 0,
                total_revenue: 0,
                unique_users: 0,
                avg_discount: 0,
            };

            mockAnalyticsRepository.getPromoCodeStats.mockResolvedValue(
                defaultStats,
            );

            const result = await service.getPromoCodeStats(
                promoCodeId,
                dateFrom,
                dateTo,
            );

            expect(result).toEqual({
                usage_count: 0,
                total_discount: 0,
                total_revenue: 0,
                unique_users: 0,
                avg_discount: 0,
            });
        });

        it('should handle errors', async () => {
            const promoCodeId = '507f1f77bcf86cd799439011';
            const dateFrom = new Date('2024-01-01');
            const dateTo = new Date('2024-12-31');

            const error = new Error('ClickHouse error');
            mockAnalyticsRepository.getPromoCodeStats.mockRejectedValue(error);

            await expect(
                service.getPromoCodeStats(promoCodeId, dateFrom, dateTo),
            ).rejects.toThrow('ClickHouse error');
        });
    });

    describe('getPromoCodesList', () => {
        it('should return paginated promo codes analytics', async () => {
            const query: PromoCodeAnalyticsQueryDto = {
                page: 1,
                limit: 10,
                datePreset: DatePreset.CUSTOM,
                dateFrom: new Date('2024-01-01'),
                dateTo: new Date('2024-12-31'),
                sortBy: 'usage_count',
                sortOrder: SortOrder.DESC,
            };

            const mockData: PromoCodeAnalyticsDto[] = [
                {
                    promo_code_id: '507f1f77bcf86cd799439011',
                    promo_code: 'SUMMER2024',
                    usage_count: 150,
                    total_discount: 5000.0,
                    total_revenue: 50000.0,
                    unique_users: 45,
                },
            ];

            const mockPaginatedResult = {
                items: mockData,
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            };

            mockAnalyticsRepository.getPromoCodesList.mockResolvedValue(
                mockPaginatedResult,
            );

            const result = await service.getPromoCodesList(query);

            expect(result).toEqual(mockPaginatedResult);
            expect(
                mockAnalyticsRepository.getPromoCodesList,
            ).toHaveBeenCalledWith(
                '2024-01-01',
                '2024-12-31',
                1,
                10,
                'usage_count',
                SortOrder.DESC,
            );
        });

        it('should use default dates when not provided', async () => {
            const query: PromoCodeAnalyticsQueryDto = {
                page: 1,
                limit: 10,
            };

            const mockPaginatedResult = {
                items: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            };

            mockAnalyticsRepository.getPromoCodesList.mockResolvedValue(
                mockPaginatedResult,
            );

            await service.getPromoCodesList(query);

            expect(
                mockAnalyticsRepository.getPromoCodesList,
            ).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                1,
                10,
                'usage_count',
                SortOrder.DESC,
            );
        });
    });

    describe('getUsersList', () => {
        it('should return paginated users analytics', async () => {
            const query: UserAnalyticsQueryDto = {
                page: 1,
                limit: 10,
                datePreset: DatePreset.CUSTOM,
                dateFrom: new Date('2024-01-01'),
                dateTo: new Date('2024-12-31'),
                sortBy: 'total_amount',
                sortOrder: SortOrder.DESC,
            };

            const mockData: UserAnalyticsDto[] = [
                {
                    user_id: '507f1f77bcf86cd799439012',
                    orders_count: 25,
                    total_amount: 15000.0,
                    promo_codes_used: 5,
                },
            ];

            const mockPaginatedResult = {
                items: mockData,
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            };

            mockAnalyticsRepository.getUsersList.mockResolvedValue(
                mockPaginatedResult,
            );

            const result = await service.getUsersList(query);

            expect(result).toEqual(mockPaginatedResult);
            expect(mockAnalyticsRepository.getUsersList).toHaveBeenCalledWith(
                '2024-01-01',
                '2024-12-31',
                1,
                10,
                'total_amount',
                SortOrder.DESC,
            );
        });
    });

    describe('getPromoCodeUsageHistory', () => {
        it('should return paginated usage history', async () => {
            const query: PromoCodeUsageHistoryQueryDto = {
                page: 1,
                limit: 10,
                datePreset: DatePreset.CUSTOM,
                dateFrom: new Date('2024-01-01'),
                dateTo: new Date('2024-12-31'),
                sortBy: 'created_at',
                sortOrder: SortOrder.DESC,
            };

            const mockData: PromoCodeUsageHistoryDto[] = [
                {
                    promo_code: 'SUMMER2024',
                    user_id: '507f1f77bcf86cd799439012',
                    order_id: '507f1f77bcf86cd799439013',
                    order_amount: 1000.0,
                    discount_amount: 100.0,
                    created_at: '2024-01-15T10:30:00Z',
                },
            ];

            const mockPaginatedResult = {
                items: mockData,
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            };

            mockAnalyticsRepository.getPromoCodeUsageHistory.mockResolvedValue(
                mockPaginatedResult,
            );

            const result = await service.getPromoCodeUsageHistory(query);

            expect(result).toEqual(mockPaginatedResult);
            expect(
                mockAnalyticsRepository.getPromoCodeUsageHistory,
            ).toHaveBeenCalledWith(
                '2024-01-01',
                '2024-12-31',
                undefined,
                1,
                10,
                'created_at',
                SortOrder.DESC,
            );
        });

        it('should filter by promoCodeId when provided', async () => {
            const query: PromoCodeUsageHistoryQueryDto = {
                page: 1,
                limit: 10,
                promoCodeId: '507f1f77bcf86cd799439011',
                datePreset: DatePreset.CUSTOM,
                dateFrom: new Date('2024-01-01'),
                dateTo: new Date('2024-12-31'),
            };

            const mockPaginatedResult = {
                items: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            };

            mockAnalyticsRepository.getPromoCodeUsageHistory.mockResolvedValue(
                mockPaginatedResult,
            );

            await service.getPromoCodeUsageHistory(query);

            expect(
                mockAnalyticsRepository.getPromoCodeUsageHistory,
            ).toHaveBeenCalledWith(
                '2024-01-01',
                '2024-12-31',
                '507f1f77bcf86cd799439011',
                1,
                10,
                'created_at',
                SortOrder.DESC,
            );
        });
    });
});
