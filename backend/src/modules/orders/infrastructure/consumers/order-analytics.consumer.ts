import type { Job } from 'bull';
import { OrderCreatedEvent } from '@orders/application/events/order-created.event';
import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ClickHouseService } from '@shared/database/clickhouse/clickhouse.service';

/**
 * Consumer для обработки событий создания заказов
 * Записывает данные в таблицу orders_analytics
 */
@Processor('events')
@Injectable()
export class OrderAnalyticsConsumer {
    private readonly logger = new Logger(OrderAnalyticsConsumer.name);

    constructor(private readonly clickhouse: ClickHouseService) {}

    /**
     * Обработка события создания заказа
     * Записывает детальную информацию о заказе
     */
    @Process('OrderCreatedEvent')
    async handleOrderCreated(job: Job<OrderCreatedEvent>): Promise<void> {
        const event = job.data;
        // При сериализации через Bull/Redis Date превращается в строку
        const createdAt = event.createdAt instanceof Date 
            ? event.createdAt 
            : new Date(event.createdAt);
        const eventDate = createdAt;

        try {
            // Форматируем дату для ClickHouse DateTime: 'YYYY-MM-DD HH:MM:SS'
            const createdAtFormatted = createdAt.toISOString().replace('T', ' ').split('.')[0];
            
            await this.clickhouse.insert('orders_analytics', {
                event_date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD
                created_at: createdAtFormatted, // YYYY-MM-DD HH:MM:SS
                order_id: event.orderId,
                user_id: event.userId,
                amount: event.amount,
                promo_code_id: event.promoCodeId || null,
                discount_amount: event.discountAmount || 0,
            });

            this.logger.log(
                `Order recorded: ${event.orderId} for user ${event.userId}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to record order: ${event.orderId}`,
                error instanceof Error ? error.stack : error,
            );
            // Пробрасываем ошибку для повторной попытки
            throw error;
        }
    }
}
