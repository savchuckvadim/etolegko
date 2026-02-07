import type { Job } from 'bull';
import { PromoCodeAppliedEvent } from '@promo-codes/application/events/promo-code-applied.event';
import { PromoCodeAnalyticsConsumer } from '@promo-codes/infrastructure/consumers/promo-code-analytics.consumer';
import { Test, TestingModule } from '@nestjs/testing';
import { ClickHouseService } from '@shared/database/clickhouse/clickhouse.service';

describe('PromoCodeAnalyticsConsumer', () => {
    let consumer: PromoCodeAnalyticsConsumer;
    let mockClickHouseService: jest.Mocked<ClickHouseService>;

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
     * - NestJS Logger выводит ошибки в консоль, что создает "шум" в выводе тестов
     * - Тест проходит успешно, но консоль засоряется сообщениями об ошибках
     *
     * Решение:
     * - Подавляем console.error в тестах, чтобы убрать шум из вывода
     * - Логика теста не меняется - мы все еще проверяем, что ошибка обрабатывается правильно
     * - В production Logger будет работать нормально и выводить ошибки в консоль
     */
    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {
            // Подавляем вывод ошибок в консоль
        });
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    const mockEvent: PromoCodeAppliedEvent = {
        promoCodeId: '507f1f77bcf86cd799439011',
        promoCode: 'SUMMER2024',
        userId: '507f1f77bcf86cd799439012',
        orderId: '507f1f77bcf86cd799439013',
        orderAmount: 500,
        discountAmount: 100,
        createdAt: new Date('2024-01-15T10:00:00Z'),
    };

    const mockJob = {
        data: mockEvent,
    } as unknown as Job<PromoCodeAppliedEvent>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PromoCodeAnalyticsConsumer,
                {
                    provide: ClickHouseService,
                    useValue: mockClickHouseServiceValue,
                },
            ],
        }).compile();

        consumer = module.get<PromoCodeAnalyticsConsumer>(
            PromoCodeAnalyticsConsumer,
        );
        mockClickHouseService =
            module.get<jest.Mocked<ClickHouseService>>(ClickHouseService);

        jest.clearAllMocks();
    });

    describe('handlePromoCodeApplied', () => {
        it('should insert data into ClickHouse', async () => {
            mockClickHouseService.insert.mockResolvedValue(undefined);

            await consumer.handlePromoCodeApplied(mockJob);

            expect(mockClickHouseServiceValue.insert).toHaveBeenCalledWith(
                'promo_code_usages_analytics',
                {
                    event_date: '2024-01-15',
                    created_at: '2024-01-15T10:00:00.000Z',
                    promo_code: 'SUMMER2024',
                    promo_code_id: '507f1f77bcf86cd799439011',
                    user_id: '507f1f77bcf86cd799439012',
                    order_id: '507f1f77bcf86cd799439013',
                    order_amount: 500,
                    discount_amount: 100,
                },
            );
        });

        it('should format event_date as YYYY-MM-DD', async () => {
            const eventWithDifferentDate: PromoCodeAppliedEvent = {
                ...mockEvent,
                createdAt: new Date('2024-12-25T15:30:00Z'),
            };

            const jobWithDifferentDate = {
                data: eventWithDifferentDate,
            } as unknown as Job<PromoCodeAppliedEvent>;

            mockClickHouseService.insert.mockResolvedValue(undefined);

            await consumer.handlePromoCodeApplied(jobWithDifferentDate);

            expect(mockClickHouseServiceValue.insert).toHaveBeenCalledWith(
                'promo_code_usages_analytics',
                expect.objectContaining({
                    event_date: '2024-12-25',
                }),
            );
        });

        it('should format created_at as ISO string', async () => {
            mockClickHouseService.insert.mockResolvedValue(undefined);

            await consumer.handlePromoCodeApplied(mockJob);

            expect(mockClickHouseServiceValue.insert).toHaveBeenCalledWith(
                'promo_code_usages_analytics',
                expect.objectContaining({
                    created_at: '2024-01-15T10:00:00.000Z',
                }),
            );
        });

        it('should throw error if ClickHouse insert fails', async () => {
            const error = new Error('ClickHouse connection failed');
            mockClickHouseService.insert.mockRejectedValue(error);

            await expect(
                consumer.handlePromoCodeApplied(mockJob),
            ).rejects.toThrow('ClickHouse connection failed');

            expect(mockClickHouseServiceValue.insert).toHaveBeenCalled();
        });

        it('should handle all event fields correctly', async () => {
            mockClickHouseService.insert.mockResolvedValue(undefined);

            await consumer.handlePromoCodeApplied(mockJob);

            const insertCall = mockClickHouseService.insert.mock.calls[0];
            const insertedData = insertCall[1] as Record<string, unknown>;

            expect(insertedData.promo_code).toBe(mockEvent.promoCode);
            expect(insertedData.promo_code_id).toBe(mockEvent.promoCodeId);
            expect(insertedData.user_id).toBe(mockEvent.userId);
            expect(insertedData.order_id).toBe(mockEvent.orderId);
            expect(insertedData.order_amount).toBe(mockEvent.orderAmount);
            expect(insertedData.discount_amount).toBe(mockEvent.discountAmount);
        });
    });
});
