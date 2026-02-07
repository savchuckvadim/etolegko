import { OrdersController } from '@orders/api/controllers/orders.controller';
import { CreateOrderDto } from '@orders/api/dto/create-order.dto';
import { OrderQueryDto } from '@orders/api/dto/order-query.dto';
import { OrderResponseDto } from '@orders/api/dto/order-response.dto';
import { UpdateOrderDto } from '@orders/api/dto/update-order.dto';
import { CreateOrderUseCase } from '@orders/application/use-cases/create-order.use-case';
import { OrderService } from '@orders/application/services/order.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginatedResult } from '@common/paginate/interfaces/paginated-result.interface';
import { User } from '@users/domain/entity/user.entity';

describe('OrdersController', () => {
    let controller: OrdersController;

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

    const mockPaginatedResult: PaginatedResult<OrderResponseDto> = {
        items: [mockOrderResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
    };

    const mockUser: User = {
        id: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
        passwordHash: 'hash',
        name: 'Test User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockOtherUser: User = {
        id: '507f1f77bcf86cd799439099',
        email: 'other@example.com',
        passwordHash: 'hash',
        name: 'Other User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockOrderService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockCreateOrderUseCase = {
        execute: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrdersController],
            providers: [
                {
                    provide: OrderService,
                    useValue: mockOrderService,
                },
                {
                    provide: CreateOrderUseCase,
                    useValue: mockCreateOrderUseCase,
                },
            ],
        }).compile();

        controller = module.get<OrdersController>(OrdersController);

        jest.clearAllMocks();
    });

    describe('create', () => {
        const createDto: CreateOrderDto = {
            amount: 1000,
        };

        it('should create an order', async () => {
            mockCreateOrderUseCase.execute.mockResolvedValue(mockOrderResponse);

            const result = await controller.create(createDto, mockUser);

            expect(mockCreateOrderUseCase.execute).toHaveBeenCalledWith(
                createDto,
                mockUser.id,
            );
            expect(result).toEqual(mockOrderResponse);
        });

        it('should handle service errors', async () => {
            mockCreateOrderUseCase.execute.mockRejectedValue(
                new Error('Service error'),
            );

            await expect(
                controller.create(createDto, mockUser),
            ).rejects.toThrow('Service error');
        });
    });

    describe('findAll', () => {
        const queryDto: OrderQueryDto = {
            page: 1,
            limit: 10,
        };

        it('should return paginated orders for user', async () => {
            mockOrderService.findAll.mockResolvedValue(mockPaginatedResult);

            const result = await controller.findAll(queryDto, mockUser);

            expect(mockOrderService.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUser.id,
                }),
            );
            expect(result).toEqual(mockPaginatedResult);
        });

        it('should throw ForbiddenException if userId does not match', async () => {
            const queryWithOtherUser: OrderQueryDto = {
                ...queryDto,
                userId: mockOtherUser.id,
            };

            await expect(
                controller.findAll(queryWithOtherUser, mockUser),
            ).rejects.toThrow(ForbiddenException);
            await expect(
                controller.findAll(queryWithOtherUser, mockUser),
            ).rejects.toThrow('You can only view your own orders');
        });

        it('should set userId from current user', async () => {
            mockOrderService.findAll.mockResolvedValue(mockPaginatedResult);

            await controller.findAll(queryDto, mockUser);

            expect(mockOrderService.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: mockUser.id,
                }),
            );
        });
    });

    describe('findById', () => {
        it('should return order by id for owner', async () => {
            mockOrderService.findById.mockResolvedValue(mockOrderResponse);

            const result = await controller.findById(
                mockOrderResponse.id,
                mockUser,
            );

            expect(mockOrderService.findById).toHaveBeenCalledWith(
                mockOrderResponse.id,
            );
            expect(result).toEqual(mockOrderResponse);
        });

        it('should throw ForbiddenException if order belongs to another user', async () => {
            const otherUserOrder: OrderResponseDto = {
                ...mockOrderResponse,
                userId: mockOtherUser.id,
            };

            mockOrderService.findById.mockResolvedValue(otherUserOrder);

            await expect(
                controller.findById(otherUserOrder.id, mockUser),
            ).rejects.toThrow(ForbiddenException);
            await expect(
                controller.findById(otherUserOrder.id, mockUser),
            ).rejects.toThrow('You can only view your own orders');
        });

        it('should throw NotFoundException if order not found', async () => {
            mockOrderService.findById.mockRejectedValue(
                new NotFoundException('Order not found'),
            );

            await expect(
                controller.findById('nonexistent', mockUser),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        const updateDto: UpdateOrderDto = {
            amount: 1500,
        };

        it('should update order for owner', async () => {
            const updatedOrder: OrderResponseDto = {
                ...mockOrderResponse,
                amount: updateDto.amount,
            };

            mockOrderService.findById.mockResolvedValue(mockOrderResponse);
            mockOrderService.update.mockResolvedValue(updatedOrder);

            const result = await controller.update(
                mockOrderResponse.id,
                updateDto,
                mockUser,
            );

            expect(mockOrderService.update).toHaveBeenCalledWith(
                mockOrderResponse.id,
                updateDto,
            );
            expect(result).toEqual(updatedOrder);
        });

        it('should throw ForbiddenException if order belongs to another user', async () => {
            const otherUserOrder: OrderResponseDto = {
                ...mockOrderResponse,
                userId: mockOtherUser.id,
            };

            mockOrderService.findById.mockResolvedValue(otherUserOrder);

            await expect(
                controller.update(otherUserOrder.id, updateDto, mockUser),
            ).rejects.toThrow(ForbiddenException);
            await expect(
                controller.update(otherUserOrder.id, updateDto, mockUser),
            ).rejects.toThrow('You can only update your own orders');
        });
    });

    describe('remove', () => {
        it('should delete order for owner', async () => {
            mockOrderService.findById.mockResolvedValue(mockOrderResponse);
            mockOrderService.delete.mockResolvedValue(undefined);

            await controller.remove(mockOrderResponse.id, mockUser);

            expect(mockOrderService.findById).toHaveBeenCalledWith(
                mockOrderResponse.id,
            );
            expect(mockOrderService.delete).toHaveBeenCalledWith(
                mockOrderResponse.id,
            );
        });

        it('should throw ForbiddenException if order belongs to another user', async () => {
            const otherUserOrder: OrderResponseDto = {
                ...mockOrderResponse,
                userId: mockOtherUser.id,
            };

            mockOrderService.findById.mockResolvedValue(otherUserOrder);

            await expect(
                controller.remove(otherUserOrder.id, mockUser),
            ).rejects.toThrow(ForbiddenException);
            await expect(
                controller.remove(otherUserOrder.id, mockUser),
            ).rejects.toThrow('You can only delete your own orders');
        });
    });
});
