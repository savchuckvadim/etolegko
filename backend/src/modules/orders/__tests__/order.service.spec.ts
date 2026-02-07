import { CreateOrderDto } from '@orders/api/dto/create-order.dto';
import { OrderQueryDto } from '@orders/api/dto/order-query.dto';
import { UpdateOrderDto } from '@orders/api/dto/update-order.dto';
import { OrderService } from '@orders/application/services/order.service';
import { Order } from '@orders/domain/entity/order.entity';
import { OrderRepository } from '@orders/infrastructure/repositories/order.repository';
import { OrderDocument } from '@orders/infrastructure/schemas/order.schema';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('OrderService', () => {
    let service: OrderService;

    const mockOrder = new Order({
        id: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        amount: 1000,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    });

    const mockOrderWithPromoCode = new Order({
        id: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        amount: 1000,
        promoCodeId: '507f1f77bcf86cd799439013',
        discountAmount: 200,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    });

    const mockOrderDocument = {
        _id: { toString: () => mockOrder.id },
        userId: mockOrder.userId,
        amount: mockOrder.amount,
        promoCodeId: mockOrder.promoCodeId,
        discountAmount: mockOrder.discountAmount,
        createdAt: mockOrder.createdAt,
        updatedAt: mockOrder.updatedAt,
    } as unknown as OrderDocument;

    const mockOrderRepository = {
        create: jest.fn(),
        findById: jest.fn(),
        findByUserId: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        getModel: jest.fn(),
        mapDocumentToEntity: jest.fn(),
    };

    const mockModel = {
        find: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn(),
        countDocuments: jest.fn().mockReturnThis(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrderService,
                {
                    provide: OrderRepository,
                    useValue: mockOrderRepository,
                },
            ],
        }).compile();

        service = module.get<OrderService>(OrderService);

        jest.clearAllMocks();
        Object.values(mockOrderRepository).forEach(mock => {
            if (jest.isMockFunction(mock)) {
                mock.mockReset();
            }
        });
    });

    describe('create', () => {
        const createDto: CreateOrderDto = {
            amount: 1000,
        };
        const userId = '507f1f77bcf86cd799439012';

        it('should create an order successfully', async () => {
            mockOrderRepository.create.mockResolvedValue(mockOrder);

            const result = await service.create(createDto, userId);

            expect(mockOrderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId,
                    amount: createDto.amount,
                }),
            );
            expect(result.id).toBe(mockOrder.id);
            expect(result.userId).toBe(userId);
            expect(result.amount).toBe(createDto.amount);
            expect(result.finalAmount).toBe(createDto.amount);
        });

        it('should set createdAt and updatedAt', async () => {
            mockOrderRepository.create.mockResolvedValue(mockOrder);

            await service.create(createDto, userId);

            expect(mockOrderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdAt: expect.any(Date),
                    updatedAt: expect.any(Date),
                }),
            );
        });
    });

    describe('findAll', () => {
        const queryDto: OrderQueryDto = {
            page: 1,
            limit: 10,
        };

        it('should return paginated orders', async () => {
            mockOrderRepository.getModel.mockReturnValue(mockModel);
            mockModel.exec
                .mockResolvedValueOnce([mockOrderDocument])
                .mockResolvedValueOnce(1);
            mockOrderRepository.mapDocumentToEntity.mockReturnValue(mockOrder);

            const result = await service.findAll(queryDto);

            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.totalPages).toBe(1);
        });

        it('should filter by userId', async () => {
            const searchQuery: OrderQueryDto = {
                ...queryDto,
                userId: '507f1f77bcf86cd799439012',
            };

            mockOrderRepository.getModel.mockReturnValue(mockModel);
            mockModel.exec
                .mockResolvedValueOnce([mockOrderDocument])
                .mockResolvedValueOnce(1);
            mockOrderRepository.mapDocumentToEntity.mockReturnValue(mockOrder);

            await service.findAll(searchQuery);

            expect(mockModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: '507f1f77bcf86cd799439012',
                }) as Record<string, unknown>,
            );
        });

        it('should filter by date range', async () => {
            const dateQuery: OrderQueryDto = {
                ...queryDto,
                dateFrom: new Date('2024-01-01'),
                dateTo: new Date('2024-01-31'),
            };

            mockOrderRepository.getModel.mockReturnValue(mockModel);
            mockModel.exec
                .mockResolvedValueOnce([mockOrderDocument])
                .mockResolvedValueOnce(1);
            mockOrderRepository.mapDocumentToEntity.mockReturnValue(mockOrder);

            await service.findAll(dateQuery);

            expect(mockModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    createdAt: expect.objectContaining({
                        $gte: dateQuery.dateFrom,
                        $lte: dateQuery.dateTo,
                    }),
                }) as Record<string, unknown>,
            );
        });

        it('should use default pagination values', async () => {
            const emptyQuery: OrderQueryDto = {};

            mockOrderRepository.getModel.mockReturnValue(mockModel);
            mockModel.exec
                .mockResolvedValueOnce([mockOrderDocument])
                .mockResolvedValueOnce(1);
            mockOrderRepository.mapDocumentToEntity.mockReturnValue(mockOrder);

            const result = await service.findAll(emptyQuery);

            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });

        it('should sort by createdAt desc by default', async () => {
            mockOrderRepository.getModel.mockReturnValue(mockModel);
            mockModel.exec
                .mockResolvedValueOnce([mockOrderDocument])
                .mockResolvedValueOnce(1);
            mockOrderRepository.mapDocumentToEntity.mockReturnValue(mockOrder);

            await service.findAll(queryDto);

            expect(mockModel.sort).toHaveBeenCalledWith({
                createdAt: -1,
            });
        });
    });

    describe('findById', () => {
        it('should return order by id', async () => {
            mockOrderRepository.findById.mockResolvedValue(mockOrder);

            const result = await service.findById(mockOrder.id);

            expect(mockOrderRepository.findById).toHaveBeenCalledWith(
                mockOrder.id,
            );
            expect(result.id).toBe(mockOrder.id);
            expect(result.userId).toBe(mockOrder.userId);
            expect(result.amount).toBe(mockOrder.amount);
        });

        it('should throw NotFoundException if order not found', async () => {
            mockOrderRepository.findById.mockResolvedValue(null);

            await expect(service.findById('nonexistent')).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.findById('nonexistent')).rejects.toThrow(
                'Order with ID nonexistent not found',
            );
        });

        it('should calculate finalAmount correctly', async () => {
            mockOrderRepository.findById.mockResolvedValue(mockOrderWithPromoCode);

            const result = await service.findById(mockOrderWithPromoCode.id);

            expect(result.finalAmount).toBe(800); // 1000 - 200
        });
    });

    describe('findByUserId', () => {
        const userId = '507f1f77bcf86cd799439012';

        it('should return orders for user', async () => {
            mockOrderRepository.findByUserId.mockResolvedValue([mockOrder]);

            const result = await service.findByUserId(userId);

            expect(mockOrderRepository.findByUserId).toHaveBeenCalledWith(
                userId,
            );
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(mockOrder.id);
        });

        it('should return empty array if no orders', async () => {
            mockOrderRepository.findByUserId.mockResolvedValue([]);

            const result = await service.findByUserId(userId);

            expect(result).toHaveLength(0);
        });
    });

    describe('update', () => {
        const updateDto: UpdateOrderDto = {
            amount: 1500,
        };

        it('should update order successfully', async () => {
            const updatedOrder = new Order({
                ...mockOrder,
                amount: updateDto.amount,
            });

            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockOrderRepository.update.mockResolvedValue(updatedOrder);

            const result = await service.update(mockOrder.id, updateDto);

            expect(mockOrderRepository.update).toHaveBeenCalledWith(
                mockOrder.id,
                expect.objectContaining({
                    amount: updateDto.amount,
                }),
            );
            expect(result.amount).toBe(updateDto.amount);
        });

        it('should throw NotFoundException if order not found', async () => {
            mockOrderRepository.findById.mockResolvedValue(null);

            await expect(
                service.update('nonexistent', updateDto),
            ).rejects.toThrow(NotFoundException);
        });

        it('should update only provided fields', async () => {
            const partialDto: UpdateOrderDto = {
                amount: 2000,
            };

            const updatedOrder = new Order({
                ...mockOrder,
                amount: partialDto.amount,
            });

            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockOrderRepository.update.mockResolvedValue(updatedOrder);

            const result = await service.update(mockOrder.id, partialDto);

            expect(result.amount).toBe(partialDto.amount);
        });
    });

    describe('delete', () => {
        it('should delete order successfully', async () => {
            mockOrderRepository.findById.mockResolvedValue(mockOrder);
            mockOrderRepository.delete.mockResolvedValue(undefined);

            await service.delete(mockOrder.id);

            expect(mockOrderRepository.findById).toHaveBeenCalledWith(
                mockOrder.id,
            );
            expect(mockOrderRepository.delete).toHaveBeenCalledWith(
                mockOrder.id,
            );
        });

        it('should throw NotFoundException if order not found', async () => {
            mockOrderRepository.findById.mockResolvedValue(null);

            await expect(service.delete('nonexistent')).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.delete('nonexistent')).rejects.toThrow(
                'Order with ID nonexistent not found',
            );
        });
    });
});
