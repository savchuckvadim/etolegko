import type { Job } from 'bull';
import { OrderCreatedEvent } from '@orders/application/events/order-created.event';
import { OrderAnalyticsConsumer } from '@orders/infrastructure/consumers/order-analytics.consumer';
import { Test, TestingModule } from '@nestjs/testing';
import { ClickHouseService } from '@shared/database/clickhouse/clickhouse.service';

describe('OrderAnalyticsConsumer', () => {
    let consumer: OrderAnalyticsConsumer;

    const mockClickHouseServiceValue = {
        insert: jest.fn(),
    };

    /**
     * Подавляем вывод Logger в тестах, чтобы не засорять консоль
     *
     * Почему это нужно:
     * - В тесте "should throw error if ClickHouse insert fails" мы намеренно вызываем ошибку
     *   для проверки обработки ошибок в consumer
     * - Consumer логирует ошибку через logger.error() перед тем как пробросить её дальше
     *   (это правильное поведение - ошибки должны логироваться)
     * - NestJS Logger выводит ошибки в консоль через console.log/error, что создает "шум" в выводе тестов
     * - Тест проходит успешно, но консоль засоряется сообщениями об ошибках
     *
     * Решение:
     * - Подавляем console.log и console.error в тестах, чтобы убрать шум из вывода
     * - NestJS Logger использует console.log для форматированного вывода ошибок
     * - Логика теста не меняется - мы все еще проверяем, что ошибка обрабатывается правильно
     * - В production Logger будет работать нормально и выводить ошибки в консоль
     */
    beforeAll(() => {
        // NestJS Logger использует console.log для вывода форматированных сообщений
        jest.spyOn(console, 'log').mockImplementation(() => {
            // Подавляем вывод логов в консоль
        });
        jest.spyOn(console, 'error').mockImplementation(() => {
            // Подавляем вывод ошибок в консоль
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const mockEvent: OrderCreatedEvent = {
        orderId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        amount: 1000,
        createdAt: new Date('2024-01-15T10:00:00Z'),
    };

    const mockEventWithPromoCode: OrderCreatedEvent = {
        orderId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        amount: 1000,
        promoCodeId: '507f1f77bcf86cd799439013',
        discountAmount: 200,
        createdAt: new Date('2024-01-15T10:00:00Z'),
    };

    const mockJob = {
        data: mockEvent,
    } as unknown as Job<OrderCreatedEvent>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrderAnalyticsConsumer,
                {
                    provide: ClickHouseService,
                    useValue: mockClickHouseServiceValue,
                },
            ],
        }).compile();

        consumer = module.get<OrderAnalyticsConsumer>(OrderAnalyticsConsumer);

        jest.clearAllMocks();
    });

    describe('handleOrderCreated', () => {
        it('should insert data into ClickHouse', async () => {
            mockClickHouseServiceValue.insert.mockResolvedValue(undefined);

            await consumer.handleOrderCreated(mockJob);

            expect(mockClickHouseServiceValue.insert).toHaveBeenCalledWith(
                'orders_analytics',
                {
                    event_date: '2024-01-15',
                    created_at: '2024-01-15T10:00:00.000Z',
                    order_id: '507f1f77bcf86cd799439011',
                    user_id: '507f1f77bcf86cd799439012',
                    amount: 1000,
                    promo_code_id: null,
                    discount_amount: 0,
                },
            );
        });

        it('should format event_date as YYYY-MM-DD', async () => {
            const eventWithDifferentDate: OrderCreatedEvent = {
                ...mockEvent,
                createdAt: new Date('2024-12-25T15:30:00Z'),
            };

            const jobWithDifferentDate = {
                data: eventWithDifferentDate,
            } as unknown as Job<OrderCreatedEvent>;

            mockClickHouseServiceValue.insert.mockResolvedValue(undefined);

            await consumer.handleOrderCreated(jobWithDifferentDate);

            expect(mockClickHouseServiceValue.insert).toHaveBeenCalledWith(
                'orders_analytics',
                expect.objectContaining({
                    event_date: '2024-12-25',
                }),
            );
        });

        it('should format created_at as ISO string', async () => {
            mockClickHouseServiceValue.insert.mockResolvedValue(undefined);

            await consumer.handleOrderCreated(mockJob);

            expect(mockClickHouseServiceValue.insert).toHaveBeenCalledWith(
                'orders_analytics',
                expect.objectContaining({
                    created_at: '2024-01-15T10:00:00.000Z',
                }),
            );
        });

        it('should handle promo code data correctly', async () => {
            const jobWithPromoCode = {
                data: mockEventWithPromoCode,
            } as unknown as Job<OrderCreatedEvent>;

            mockClickHouseServiceValue.insert.mockResolvedValue(undefined);

            await consumer.handleOrderCreated(jobWithPromoCode);

            expect(mockClickHouseServiceValue.insert).toHaveBeenCalledWith(
                'orders_analytics',
                expect.objectContaining({
                    promo_code_id: '507f1f77bcf86cd799439013',
                    discount_amount: 200,
                }),
            );
        });

        it('should throw error if ClickHouse insert fails', async () => {
            const error = new Error('ClickHouse connection failed');
            mockClickHouseServiceValue.insert.mockRejectedValue(error);

            await expect(consumer.handleOrderCreated(mockJob)).rejects.toThrow(
                'ClickHouse connection failed',
            );

            expect(mockClickHouseServiceValue.insert).toHaveBeenCalled();
        });

        it('should handle all event fields correctly', async () => {
            mockClickHouseServiceValue.insert.mockResolvedValue(undefined);

            await consumer.handleOrderCreated(mockJob);

            const insertCall = mockClickHouseServiceValue.insert.mock
                .calls[0] as [string, Record<string, unknown>] | undefined;
            const insertedData = insertCall?.[1] ?? {};

            expect(insertedData.order_id).toBe(mockEvent.orderId);
            expect(insertedData.user_id).toBe(mockEvent.userId);
            expect(insertedData.amount).toBe(mockEvent.amount);
        });
    });
});
