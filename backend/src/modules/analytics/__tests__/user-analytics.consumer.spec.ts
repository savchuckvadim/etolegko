import type { Job } from 'bull';
import { UserAnalyticsConsumer } from '@analytics/infrastructure/consumers/user-analytics.consumer';
import { OrderCreatedEvent } from '@orders/application/events/order-created.event';
import { PromoCodeAppliedEvent } from '@promo-codes/application/events/promo-code-applied.event';
import { Test, TestingModule } from '@nestjs/testing';
import { ClickHouseService } from '@shared/database/clickhouse/clickhouse.service';

describe('UserAnalyticsConsumer', () => {
    let consumer: UserAnalyticsConsumer;

    const mockClickHouseService = {
        insert: jest.fn(),
        query: jest.fn(),
    };

    beforeAll(() => {
        // Подавляем вывод Logger в тестах
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserAnalyticsConsumer,
                {
                    provide: ClickHouseService,
                    useValue: mockClickHouseService,
                },
            ],
        }).compile();

        consumer = module.get<UserAnalyticsConsumer>(UserAnalyticsConsumer);

        jest.clearAllMocks();
    });

    describe('handleOrderCreated', () => {
        it('should insert order data into users_analytics', async () => {
            const event = new OrderCreatedEvent(
                '507f1f77bcf86cd799439011',
                '507f1f77bcf86cd799439012',
                1000,
                '507f1f77bcf86cd799439013',
                200,
                new Date('2024-01-15T10:30:00Z'),
            );

            const mockJob = {
                data: event,
            } as Job<OrderCreatedEvent>;

            mockClickHouseService.insert.mockResolvedValue(undefined);

            await consumer.handleOrderCreated(mockJob);

            expect(mockClickHouseService.insert).toHaveBeenCalledWith(
                'users_analytics',
                {
                    event_date: '2024-01-15',
                    user_id: '507f1f77bcf86cd799439012',
                    orders_count: 1,
                    total_amount: 1000,
                    promo_codes_used: 1,
                },
            );
        });

        it('should set promo_codes_used to 0 when no promo code', async () => {
            const event = new OrderCreatedEvent(
                '507f1f77bcf86cd799439011',
                '507f1f77bcf86cd799439012',
                1000,
                undefined,
                0,
                new Date('2024-01-15T10:30:00Z'),
            );

            const mockJob = {
                data: event,
            } as Job<OrderCreatedEvent>;

            mockClickHouseService.insert.mockResolvedValue(undefined);

            await consumer.handleOrderCreated(mockJob);

            expect(mockClickHouseService.insert).toHaveBeenCalledWith(
                'users_analytics',
                expect.objectContaining({
                    promo_codes_used: 0,
                }),
            );
        });

        it('should throw error if ClickHouse insert fails', async () => {
            const event = new OrderCreatedEvent(
                '507f1f77bcf86cd799439011',
                '507f1f77bcf86cd799439012',
                1000,
                undefined,
                0,
                new Date('2024-01-15T10:30:00Z'),
            );

            const mockJob = {
                data: event,
            } as Job<OrderCreatedEvent>;

            const error = new Error('ClickHouse connection failed');
            mockClickHouseService.insert.mockRejectedValue(error);

            await expect(consumer.handleOrderCreated(mockJob)).rejects.toThrow(
                'ClickHouse connection failed',
            );
        });
    });

    describe('handlePromoCodeApplied', () => {
        it('should insert promo code usage data into users_analytics', async () => {
            const event = new PromoCodeAppliedEvent(
                '507f1f77bcf86cd799439013',
                'SUMMER2024',
                '507f1f77bcf86cd799439012',
                '507f1f77bcf86cd799439011',
                1000,
                100,
                new Date('2024-01-15T10:30:00Z'),
            );

            const mockJob = {
                data: event,
            } as Job<PromoCodeAppliedEvent>;

            mockClickHouseService.insert.mockResolvedValue(undefined);

            await consumer.handlePromoCodeApplied(mockJob);

            expect(mockClickHouseService.insert).toHaveBeenCalledWith(
                'users_analytics',
                {
                    event_date: '2024-01-15',
                    user_id: '507f1f77bcf86cd799439012',
                    orders_count: 0,
                    total_amount: 0,
                    promo_codes_used: 1,
                },
            );
        });

        it('should throw error if ClickHouse insert fails', async () => {
            const event = new PromoCodeAppliedEvent(
                '507f1f77bcf86cd799439013',
                'SUMMER2024',
                '507f1f77bcf86cd799439012',
                '507f1f77bcf86cd799439011',
                1000,
                100,
                new Date('2024-01-15T10:30:00Z'),
            );

            const mockJob = {
                data: event,
            } as Job<PromoCodeAppliedEvent>;

            const error = new Error('ClickHouse connection failed');
            mockClickHouseService.insert.mockRejectedValue(error);

            await expect(
                consumer.handlePromoCodeApplied(mockJob),
            ).rejects.toThrow('ClickHouse connection failed');
        });
    });
});
