import type { EventBus } from '@shared/events/event-bus.interface';
import { CreateOrderDto } from '@orders/api/dto/create-order.dto';
import { OrderResponseDto } from '@orders/api/dto/order-response.dto';
import { OrderCreatedEvent } from '@orders/application/events/order-created.event';
import { OrderService } from '@orders/application/services/order.service';
import { Inject, Injectable } from '@nestjs/common';

/**
 * Use Case для создания заказа
 * Координирует работу сервиса и публикацию события
 */
@Injectable()
export class CreateOrderUseCase {
    constructor(
        private readonly orderService: OrderService,
        @Inject('EventBus') private readonly eventBus: EventBus,
    ) {}

    /**
     * Создать заказ
     * 1. Вызывает сервис для создания заказа
     * 2. Публикует событие для записи в ClickHouse
     */
    async execute(
        dto: CreateOrderDto,
        userId: string,
    ): Promise<OrderResponseDto> {
        // 1. Создаем заказ через сервис
        const order = await this.orderService.create(dto, userId);

        // 2. Публикуем событие для записи в ClickHouse
        await this.eventBus.publish(
            new OrderCreatedEvent(
                order.id,
                order.userId,
                order.amount,
                order.promoCodeId,
                order.discountAmount,
                new Date(),
            ),
        );

        // 3. Возвращаем результат
        return order;
    }
}
