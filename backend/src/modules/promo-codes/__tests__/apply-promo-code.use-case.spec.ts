import { AnalyticsRepository } from '@analytics/infrastructure/repositories/analytics.repository';
import { Order } from '@orders/domain/entity/order.entity';
import { OrderRepository } from '@orders/infrastructure/repositories/order.repository';
import { PromoCodeAppliedEvent } from '@promo-codes/application/events/promo-code-applied.event';
import { PromoCodeService } from '@promo-codes/application/services/promo-code.service';
import { ApplyPromoCodeUseCase } from '@promo-codes/application/use-cases/apply-promo-code.use-case';
import { PromoCode } from '@promo-codes/domain/entity/promo-code.entity';
import { PromoCodeRepository } from '@promo-codes/infrastructure/repositories/promo-code.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('ApplyPromoCodeUseCase', () => {
    let useCase: ApplyPromoCodeUseCase;

    const createMockPromoCode = (overrides?: Partial<PromoCode>): PromoCode => {
        const now = new Date();
        const futureDate = new Date(now);
        futureDate.setFullYear(now.getFullYear() + 1); // Год в будущем

        return new PromoCode({
            id: '507f1f77bcf86cd799439011',
            code: 'SUMMER2024',
            discountPercent: 20,
            totalLimit: 100,
            perUserLimit: 1,
            usedCount: 0,
            isActive: true,
            startsAt: new Date(now.getTime() - 86400000), // Вчера
            endsAt: futureDate, // Год в будущем
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            ...overrides,
        });
    };

    const mockPromoCodeServiceValue = {
        findByCode: jest.fn(),
    };

    const mockPromoCodeRepositoryValue = {
        update: jest.fn(),
    };

    const mockOrderRepositoryValue = {
        update: jest.fn(),
    };

    const mockAnalyticsRepositoryValue = {
        getUserPromoCodeUsageCount: jest.fn(),
    };

    const mockEventBusValue = {
        publish: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApplyPromoCodeUseCase,
                {
                    provide: PromoCodeService,
                    useValue: mockPromoCodeServiceValue,
                },
                {
                    provide: PromoCodeRepository,
                    useValue: mockPromoCodeRepositoryValue,
                },
                {
                    provide: OrderRepository,
                    useValue: mockOrderRepositoryValue,
                },
                {
                    provide: AnalyticsRepository,
                    useValue: mockAnalyticsRepositoryValue,
                },
                {
                    provide: 'EventBus',
                    useValue: mockEventBusValue,
                },
            ],
        }).compile();

        useCase = module.get<ApplyPromoCodeUseCase>(ApplyPromoCodeUseCase);

        jest.clearAllMocks();
    });

    describe('execute', () => {
        const orderId = '507f1f77bcf86cd799439013';
        const promoCode = 'SUMMER2024';
        const userId = '507f1f77bcf86cd799439012';
        const orderAmount = 500;

        it('should apply promo code and publish event', async () => {
            const mockPromoCode = createMockPromoCode();
            const mockOrder = new Order({
                id: orderId,
                userId,
                amount: orderAmount,
                promoCodeId: mockPromoCode.id,
                discountAmount: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockPromoCodeServiceValue.findByCode.mockResolvedValue(
                mockPromoCode,
            );
            mockAnalyticsRepositoryValue.getUserPromoCodeUsageCount.mockResolvedValue(
                0,
            );
            mockOrderRepositoryValue.update.mockResolvedValue(mockOrder);
            const updatedPromoCode = createMockPromoCode({ usedCount: 1 });
            mockPromoCodeRepositoryValue.update.mockResolvedValue(
                updatedPromoCode,
            );
            mockEventBusValue.publish.mockResolvedValue(undefined);

            const result = await useCase.execute(
                orderId,
                promoCode,
                userId,
                orderAmount,
            );

            expect(mockPromoCodeServiceValue.findByCode).toHaveBeenCalledWith(
                promoCode,
            );
            expect(
                mockAnalyticsRepositoryValue.getUserPromoCodeUsageCount,
            ).toHaveBeenCalledWith(userId, mockPromoCode.id);
            expect(mockOrderRepositoryValue.update).toHaveBeenCalledWith(
                orderId,
                {
                    promoCodeId: mockPromoCode.id,
                    discountAmount: 100,
                },
            );
            expect(mockPromoCodeRepositoryValue.update).toHaveBeenCalledWith(
                mockPromoCode.id,
                { usedCount: 1 },
            );
            expect(mockEventBusValue.publish).toHaveBeenCalledWith(
                expect.any(PromoCodeAppliedEvent),
            );

            const firstCall = mockEventBusValue.publish.mock
                .calls[0] as unknown as [PromoCodeAppliedEvent];
            const publishedEvent = firstCall?.[0];
            expect(publishedEvent).toBeInstanceOf(PromoCodeAppliedEvent);
            expect(publishedEvent.promoCodeId).toBe(mockPromoCode.id);
            expect(publishedEvent.promoCode).toBe(mockPromoCode.code);
            expect(publishedEvent.userId).toBe(userId);
            expect(publishedEvent.orderId).toBe(orderId);
            expect(publishedEvent.orderAmount).toBe(orderAmount);
            expect(publishedEvent.discountAmount).toBe(100); // 20% of 500

            expect(result).toEqual({
                discountAmount: 100,
                finalAmount: 400,
                promoCode: 'SUMMER2024',
            });
        });

        it('should calculate discount correctly', async () => {
            const promoCodeWith30Percent = createMockPromoCode({
                discountPercent: 30,
            });
            const mockOrder = new Order({
                id: orderId,
                userId,
                amount: orderAmount,
                promoCodeId: promoCodeWith30Percent.id,
                discountAmount: 150,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockPromoCodeServiceValue.findByCode.mockResolvedValue(
                promoCodeWith30Percent,
            );
            mockAnalyticsRepositoryValue.getUserPromoCodeUsageCount.mockResolvedValue(
                0,
            );
            mockOrderRepositoryValue.update.mockResolvedValue(mockOrder);
            const updatedPromoCode = createMockPromoCode({
                discountPercent: 30,
                usedCount: 1,
            });
            mockPromoCodeRepositoryValue.update.mockResolvedValue(
                updatedPromoCode,
            );
            mockEventBusValue.publish.mockResolvedValue(undefined);

            const result = await useCase.execute(
                orderId,
                promoCode,
                userId,
                orderAmount,
            );

            expect(result.discountAmount).toBe(150); // 30% of 500
            expect(result.finalAmount).toBe(350); // 500 - 150
        });

        it('should throw NotFoundException if promo code not found', async () => {
            mockPromoCodeServiceValue.findByCode.mockResolvedValue(null);

            await expect(
                useCase.execute(orderId, promoCode, userId, orderAmount),
            ).rejects.toThrow(NotFoundException);
            await expect(
                useCase.execute(orderId, promoCode, userId, orderAmount),
            ).rejects.toThrow(`Promo code ${promoCode} not found`);

            expect(mockEventBusValue.publish).not.toHaveBeenCalled();
            expect(mockOrderRepositoryValue.update).not.toHaveBeenCalled();
            expect(mockPromoCodeRepositoryValue.update).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if promo code validation fails', async () => {
            const inactivePromoCode = createMockPromoCode({ isActive: false });
            mockPromoCodeServiceValue.findByCode.mockResolvedValue(
                inactivePromoCode,
            );
            mockAnalyticsRepositoryValue.getUserPromoCodeUsageCount.mockResolvedValue(
                0,
            );

            await expect(
                useCase.execute(orderId, promoCode, userId, orderAmount),
            ).rejects.toThrow(BadRequestException);
            await expect(
                useCase.execute(orderId, promoCode, userId, orderAmount),
            ).rejects.toThrow('Promo code is not active');

            expect(mockEventBusValue.publish).not.toHaveBeenCalled();
            expect(mockOrderRepositoryValue.update).not.toHaveBeenCalled();
            expect(mockPromoCodeRepositoryValue.update).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if user limit exceeded', async () => {
            const mockPromoCode = createMockPromoCode({ perUserLimit: 1 });
            mockPromoCodeServiceValue.findByCode.mockResolvedValue(
                mockPromoCode,
            );
            mockAnalyticsRepositoryValue.getUserPromoCodeUsageCount.mockResolvedValue(
                1,
            );

            await expect(
                useCase.execute(orderId, promoCode, userId, orderAmount),
            ).rejects.toThrow(BadRequestException);
            await expect(
                useCase.execute(orderId, promoCode, userId, orderAmount),
            ).rejects.toThrow('User limit exceeded');

            expect(mockEventBusValue.publish).not.toHaveBeenCalled();
            expect(mockOrderRepositoryValue.update).not.toHaveBeenCalled();
            expect(mockPromoCodeRepositoryValue.update).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException if total limit exceeded', async () => {
            const mockPromoCode = createMockPromoCode({ usedCount: 100 });
            mockPromoCodeServiceValue.findByCode.mockResolvedValue(
                mockPromoCode,
            );
            mockAnalyticsRepositoryValue.getUserPromoCodeUsageCount.mockResolvedValue(
                0,
            );

            await expect(
                useCase.execute(orderId, promoCode, userId, orderAmount),
            ).rejects.toThrow(BadRequestException);
            await expect(
                useCase.execute(orderId, promoCode, userId, orderAmount),
            ).rejects.toThrow('Promo code total limit exceeded');

            expect(mockEventBusValue.publish).not.toHaveBeenCalled();
            expect(mockOrderRepositoryValue.update).not.toHaveBeenCalled();
            expect(mockPromoCodeRepositoryValue.update).not.toHaveBeenCalled();
        });

        it('should publish event with correct data structure', async () => {
            const mockPromoCode = createMockPromoCode();
            const mockOrder = new Order({
                id: orderId,
                userId,
                amount: orderAmount,
                promoCodeId: mockPromoCode.id,
                discountAmount: 100,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockPromoCodeServiceValue.findByCode.mockResolvedValue(
                mockPromoCode,
            );
            mockAnalyticsRepositoryValue.getUserPromoCodeUsageCount.mockResolvedValue(
                0,
            );
            mockOrderRepositoryValue.update.mockResolvedValue(mockOrder);
            const updatedPromoCode = createMockPromoCode({ usedCount: 1 });
            mockPromoCodeRepositoryValue.update.mockResolvedValue(
                updatedPromoCode,
            );
            mockEventBusValue.publish.mockResolvedValue(undefined);

            await useCase.execute(orderId, promoCode, userId, orderAmount);

            const firstCall = mockEventBusValue.publish.mock
                .calls[0] as unknown as [PromoCodeAppliedEvent];
            const publishedEvent = firstCall?.[0];
            expect(publishedEvent.promoCodeId).toBe(mockPromoCode.id);
            expect(publishedEvent.promoCode).toBe(mockPromoCode.code);
            expect(publishedEvent.userId).toBe(userId);
            expect(publishedEvent.orderId).toBe(orderId);
            expect(publishedEvent.orderAmount).toBe(orderAmount);
            expect(publishedEvent.discountAmount).toBe(100);
            expect(publishedEvent.createdAt).toBeInstanceOf(Date);
        });

        it('should handle zero discount correctly', async () => {
            const promoCodeWithZeroDiscount = createMockPromoCode({
                discountPercent: 0,
            });
            const mockOrder = new Order({
                id: orderId,
                userId,
                amount: orderAmount,
                promoCodeId: promoCodeWithZeroDiscount.id,
                discountAmount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            mockPromoCodeServiceValue.findByCode.mockResolvedValue(
                promoCodeWithZeroDiscount,
            );
            mockAnalyticsRepositoryValue.getUserPromoCodeUsageCount.mockResolvedValue(
                0,
            );
            mockOrderRepositoryValue.update.mockResolvedValue(mockOrder);
            const updatedPromoCode = createMockPromoCode({
                discountPercent: 0,
                usedCount: 1,
            });
            mockPromoCodeRepositoryValue.update.mockResolvedValue(
                updatedPromoCode,
            );
            mockEventBusValue.publish.mockResolvedValue(undefined);

            const result = await useCase.execute(
                orderId,
                promoCode,
                userId,
                orderAmount,
            );

            expect(result.discountAmount).toBe(0);
            expect(result.finalAmount).toBe(orderAmount);
        });
    });
});
