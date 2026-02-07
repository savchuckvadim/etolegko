import type { EventBus } from '@shared/events/event-bus.interface';
import { PromoCodeAppliedEvent } from '@promo-codes/application/events/promo-code-applied.event';
import { PromoCodeService } from '@promo-codes/application/services/promo-code.service';
import { ApplyPromoCodeUseCase } from '@promo-codes/application/use-cases/apply-promo-code.use-case';
import { PromoCode } from '@promo-codes/domain/entity/promo-code.entity';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('ApplyPromoCodeUseCase', () => {
    let useCase: ApplyPromoCodeUseCase;
    let mockPromoCodeService: jest.Mocked<PromoCodeService>;
    let mockEventBus: jest.Mocked<EventBus>;

    const createMockPromoCode = (overrides?: Partial<PromoCode>): PromoCode => {
        return new PromoCode({
            id: '507f1f77bcf86cd799439011',
            code: 'SUMMER2024',
            discountPercent: 20,
            totalLimit: 100,
            perUserLimit: 1,
            usedCount: 0,
            isActive: true,
            startsAt: new Date('2024-01-01'),
            endsAt: new Date('2024-12-31'),
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            ...overrides,
        });
    };

    const mockPromoCodeServiceValue = {
        findByCode: jest.fn(),
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
                    provide: 'EventBus',
                    useValue: mockEventBusValue,
                },
            ],
        }).compile();

        useCase = module.get<ApplyPromoCodeUseCase>(ApplyPromoCodeUseCase);
        mockPromoCodeService =
            module.get<jest.Mocked<PromoCodeService>>(PromoCodeService);
        mockEventBus = module.get<jest.Mocked<EventBus>>('EventBus');

        jest.clearAllMocks();
    });

    describe('execute', () => {
        const orderId = '507f1f77bcf86cd799439013';
        const promoCode = 'SUMMER2024';
        const userId = '507f1f77bcf86cd799439012';
        const orderAmount = 500;

        it('should apply promo code and publish event', async () => {
            const mockPromoCode = createMockPromoCode();
            mockPromoCodeService.findByCode.mockResolvedValue(mockPromoCode);
            mockEventBus.publish.mockResolvedValue(undefined);

            const result = await useCase.execute(
                orderId,
                promoCode,
                userId,
                orderAmount,
            );

            expect(mockPromoCodeServiceValue.findByCode).toHaveBeenCalledWith(
                promoCode,
            );
            expect(mockEventBusValue.publish).toHaveBeenCalledWith(
                expect.any(PromoCodeAppliedEvent),
            );

            const publishedEvent = mockEventBus.publish.mock
                .calls[0][0] as PromoCodeAppliedEvent;
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

            mockPromoCodeService.findByCode.mockResolvedValue(
                promoCodeWith30Percent,
            );
            mockEventBus.publish.mockResolvedValue(undefined);

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
            mockPromoCodeService.findByCode.mockResolvedValue(null);

            await expect(
                useCase.execute(orderId, promoCode, userId, orderAmount),
            ).rejects.toThrow(NotFoundException);
            await expect(
                useCase.execute(orderId, promoCode, userId, orderAmount),
            ).rejects.toThrow(`Promo code ${promoCode} not found`);

            expect(mockEventBusValue.publish).not.toHaveBeenCalled();
        });

        it('should publish event with correct data structure', async () => {
            const mockPromoCode = createMockPromoCode();
            mockPromoCodeService.findByCode.mockResolvedValue(mockPromoCode);
            mockEventBus.publish.mockResolvedValue(undefined);

            await useCase.execute(orderId, promoCode, userId, orderAmount);

            const publishedEvent = mockEventBus.publish.mock
                .calls[0][0] as PromoCodeAppliedEvent;
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

            mockPromoCodeService.findByCode.mockResolvedValue(
                promoCodeWithZeroDiscount,
            );
            mockEventBus.publish.mockResolvedValue(undefined);

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
