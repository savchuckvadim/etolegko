import type { EventBus } from '@shared/events/event-bus.interface';
import { CreateOrderDto } from '@orders/api/dto/create-order.dto';
import { OrderResponseDto } from '@orders/api/dto/order-response.dto';
import { OrderCreatedEvent } from '@orders/application/events/order-created.event';
import { OrderService } from '@orders/application/services/order.service';
import { CreateOrderUseCase } from '@orders/application/use-cases/create-order.use-case';
import { Test, TestingModule } from '@nestjs/testing';

describe('CreateOrderUseCase', () => {
    let useCase: CreateOrderUseCase;
    let mockOrderService: jest.Mocked<OrderService>;
    let mockEventBus: jest.Mocked<EventBus>;

    const mockOrderResponse: OrderResponseDto = {
        id: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        amount: 1000,
        finalAmount: 1000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };

    const mockOrderWithPromoCode: OrderResponseDto = {
        id: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        amount: 1000,
        promoCodeId: '507f1f77bcf86cd799439013',
        discountAmount: 200,
        finalAmount: 800,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };

    const mockOrderServiceValue = {
        create: jest.fn(),
    };

    const mockEventBusValue = {
        publish: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateOrderUseCase,
                {
                    provide: OrderService,
                    useValue: mockOrderServiceValue,
                },
                {
                    provide: 'EventBus',
                    useValue: mockEventBusValue,
                },
            ],
        }).compile();

        useCase = module.get<CreateOrderUseCase>(CreateOrderUseCase);
        mockOrderService =
            module.get<jest.Mocked<OrderService>>(OrderService);
        mockEventBus = module.get<jest.Mocked<EventBus>>('EventBus');

        jest.clearAllMocks();
    });

    describe('execute', () => {
        const createDto: CreateOrderDto = {
            amount: 1000,
        };
        const userId = '507f1f77bcf86cd799439012';

        it('should create order and publish event', async () => {
            mockOrderServiceValue.create.mockResolvedValue(mockOrderResponse);
            mockEventBusValue.publish.mockResolvedValue(undefined);

            const result = await useCase.execute(createDto, userId);

            expect(mockOrderServiceValue.create).toHaveBeenCalledWith(
                createDto,
                userId,
            );
            expect(mockEventBusValue.publish).toHaveBeenCalledWith(
                expect.any(OrderCreatedEvent),
            );
            expect(result).toEqual(mockOrderResponse);
        });

        it('should publish event with correct data structure', async () => {
            mockOrderServiceValue.create.mockResolvedValue(mockOrderResponse);
            mockEventBusValue.publish.mockResolvedValue(undefined);

            await useCase.execute(createDto, userId);

            const publishedEvent = mockEventBusValue.publish.mock
                .calls[0][0] as OrderCreatedEvent;
            expect(publishedEvent).toBeInstanceOf(OrderCreatedEvent);
            expect(publishedEvent.orderId).toBe(mockOrderResponse.id);
            expect(publishedEvent.userId).toBe(mockOrderResponse.userId);
            expect(publishedEvent.amount).toBe(mockOrderResponse.amount);
            expect(publishedEvent.promoCodeId).toBeUndefined();
            expect(publishedEvent.discountAmount).toBeUndefined();
            expect(publishedEvent.createdAt).toBeInstanceOf(Date);
        });

        it('should publish event with promo code data if present', async () => {
            mockOrderServiceValue.create.mockResolvedValue(
                mockOrderWithPromoCode,
            );
            mockEventBusValue.publish.mockResolvedValue(undefined);

            await useCase.execute(createDto, userId);

            const publishedEvent = mockEventBusValue.publish.mock
                .calls[0][0] as OrderCreatedEvent;
            expect(publishedEvent.promoCodeId).toBe(
                mockOrderWithPromoCode.promoCodeId,
            );
            expect(publishedEvent.discountAmount).toBe(
                mockOrderWithPromoCode.discountAmount,
            );
        });

        it('should handle service errors', async () => {
            mockOrderServiceValue.create.mockRejectedValue(
                new Error('Service error'),
            );

            await expect(useCase.execute(createDto, userId)).rejects.toThrow(
                'Service error',
            );
            expect(mockEventBusValue.publish).not.toHaveBeenCalled();
        });

        it('should handle event bus errors', async () => {
            mockOrderServiceValue.create.mockResolvedValue(mockOrderResponse);
            mockEventBusValue.publish.mockRejectedValue(
                new Error('Event bus error'),
            );

            await expect(useCase.execute(createDto, userId)).rejects.toThrow(
                'Event bus error',
            );
        });
    });
});
