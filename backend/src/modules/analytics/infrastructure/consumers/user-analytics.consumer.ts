import type { Job } from 'bull';
import { OrderCreatedEvent } from '@orders/application/events/order-created.event';
import { PromoCodeAppliedEvent } from '@promo-codes/application/events/promo-code-applied.event';
import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ClickHouseService } from '@shared/database/clickhouse/clickhouse.service';

/**
 * Consumer для обновления агрегированной статистики пользователей
 * Записывает данные в таблицу users_analytics
 */
@Processor('events')
@Injectable()
export class UserAnalyticsConsumer {
    private readonly logger = new Logger(UserAnalyticsConsumer.name);

    constructor(private readonly clickhouse: ClickHouseService) {}

    /**
     * Обработка события создания заказа
     * Обновляет статистику пользователя (заказы, суммы)
     */
    @Process('OrderCreatedEvent')
    async handleOrderCreated(job: Job<OrderCreatedEvent>): Promise<void> {
        const event = job.data;
        const eventDate = new Date(event.createdAt);

        try {
            await this.clickhouse.insert('users_analytics', {
                event_date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD
                user_id: event.userId,
                orders_count: 1,
                total_amount: event.amount,
                promo_codes_used: event.promoCodeId ? 1 : 0,
            });

            this.logger.log(
                `User analytics updated: ${event.userId} (order: ${event.orderId})`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to update user analytics: ${event.userId}`,
                error instanceof Error ? error.stack : error,
            );
            // Пробрасываем ошибку для повторной попытки
            throw error;
        }
    }

    /**
     * Обработка события применения промокода
     * Обновляет статистику использования промокодов пользователем
     */
    @Process('PromoCodeAppliedEvent')
    async handlePromoCodeApplied(
        job: Job<PromoCodeAppliedEvent>,
    ): Promise<void> {
        const event = job.data;
        const eventDate = new Date(event.createdAt);

        try {
            // Обновляем статистику использования промокодов
            // SummingMergeTree автоматически суммирует значения
            await this.clickhouse.insert('users_analytics', {
                event_date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD
                user_id: event.userId,
                orders_count: 0,
                total_amount: 0,
                promo_codes_used: 1,
            });

            this.logger.log(
                `User promo code usage updated: ${event.userId} (promo: ${event.promoCode})`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to update user promo code usage: ${event.userId}`,
                error instanceof Error ? error.stack : error,
            );
            // Пробрасываем ошибку для повторной попытки
            throw error;
        }
    }
}
