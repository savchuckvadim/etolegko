import { Order } from '@orders/domain/entity/order.entity';
import {
    mapOrderDocumentToEntity,
    OrderDocument,
} from '@orders/infrastructure/schemas/order.schema';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRepository } from '@shared/database/repositories/base.repository';

/**
 * Order Repository
 * Всегда возвращает Entity, никогда Document
 * Находится в infrastructure слое модуля orders
 */
@Injectable()
export class OrderRepository extends BaseRepository<OrderDocument, Order> {
    constructor(
        @InjectModel('OrderSchema')
        private readonly orderModel: Model<OrderDocument>,
    ) {
        super(orderModel);
    }

    protected mapToEntity(document: OrderDocument): Order {
        return mapOrderDocumentToEntity(document);
    }

    /**
     * Найти все заказы пользователя
     */
    async findByUserId(
        userId: string,
        session?: Parameters<typeof this.findAll>[1],
    ): Promise<Order[]> {
        return this.findAll({ userId }, session);
    }

    /**
     * Получить модель для прямого доступа (используется для пагинации)
     */
    getModel(): Model<OrderDocument> {
        return this.orderModel;
    }
}
