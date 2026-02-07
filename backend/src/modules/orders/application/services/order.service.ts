import { CreateOrderDto } from '@orders/api/dto/create-order.dto';
import { OrderQueryDto } from '@orders/api/dto/order-query.dto';
import { OrderResponseDto } from '@orders/api/dto/order-response.dto';
import { UpdateOrderDto } from '@orders/api/dto/update-order.dto';
import { Order } from '@orders/domain/entity/order.entity';
import { OrderRepository } from '@orders/infrastructure/repositories/order.repository';
import { OrderDocument } from '@orders/infrastructure/schemas/order.schema';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '@common/paginate/interfaces/paginated-result.interface';
import { PaginationUtil } from '@common/paginate/utils/pagination.util';

@Injectable()
export class OrderService {
    constructor(private readonly orderRepository: OrderRepository) {}

    /**
     * Создать заказ
     */
    async create(
        dto: CreateOrderDto,
        userId: string,
    ): Promise<OrderResponseDto> {
        // Создание entity
        const order = new Order({
            userId,
            amount: dto.amount,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Сохранение
        const savedOrder = await this.orderRepository.create(order);

        return this.toResponseDto(savedOrder);
    }

    /**
     * Получить все заказы с пагинацией
     */
    async findAll(
        query: OrderQueryDto,
    ): Promise<PaginatedResult<OrderResponseDto>> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = (query.sortOrder || 'desc') as 'asc' | 'desc';

        // Построение фильтра
        const filter: Record<string, unknown> = {};

        if (query.userId) {
            filter.userId = query.userId;
        }

        if (query.dateFrom || query.dateTo) {
            filter.createdAt = {};
            if (query.dateFrom) {
                filter.createdAt = {
                    ...(filter.createdAt as Record<string, unknown>),
                    $gte: query.dateFrom,
                };
            }
            if (query.dateTo) {
                filter.createdAt = {
                    ...(filter.createdAt as Record<string, unknown>),
                    $lte: query.dateTo,
                };
            }
        }

        // Получение данных с пагинацией
        const skip = PaginationUtil.getSkip(page, limit);
        const sort: Record<string, 1 | -1> = {
            [sortBy]: sortOrder === 'asc' ? 1 : -1,
        };

        // Используем прямой доступ к модели для пагинации
        const orderModel = this.orderRepository.getModel();
        const [docs, total] = await Promise.all([
            orderModel.find(filter).skip(skip).limit(limit).sort(sort).exec(),
            orderModel.countDocuments(filter).exec(),
        ]);

        const items = docs.map((doc: OrderDocument) => {
            const order = this.orderRepository.mapDocumentToEntity(doc);
            return this.toResponseDto(order);
        });

        return PaginationUtil.createPaginatedResult(items, total, page, limit);
    }

    /**
     * Получить заказ по ID
     */
    async findById(id: string): Promise<OrderResponseDto> {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }
        return this.toResponseDto(order);
    }

    /**
     * Получить заказы пользователя
     */
    async findByUserId(userId: string): Promise<OrderResponseDto[]> {
        const orders = await this.orderRepository.findByUserId(userId);
        return orders.map(order => this.toResponseDto(order));
    }

    /**
     * Обновить заказ
     */
    async update(id: string, dto: UpdateOrderDto): Promise<OrderResponseDto> {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        // Обновление полей
        const updateData: Partial<Order> = {};
        if (dto.amount !== undefined) {
            updateData.amount = dto.amount;
        }

        const updatedOrder = await this.orderRepository.update(
            id,
            updateData as Partial<OrderDocument>,
        );
        if (!updatedOrder) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        return this.toResponseDto(updatedOrder);
    }

    /**
     * Удалить заказ
     */
    async delete(id: string): Promise<void> {
        const order = await this.orderRepository.findById(id);
        if (!order) {
            throw new NotFoundException(`Order with ID ${id} not found`);
        }
        await this.orderRepository.delete(id);
    }

    /**
     * Преобразование Entity в Response DTO
     */
    private toResponseDto(order: Order): OrderResponseDto {
        return {
            id: order.id,
            userId: order.userId,
            amount: order.amount,
            promoCodeId: order.promoCodeId,
            discountAmount: order.discountAmount,
            finalAmount: order.getFinalAmount(),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }
}
