import type { Job } from 'bull';
import { PromoCodeAppliedEvent } from '@promo-codes/application/events/promo-code-applied.event';
import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ClickHouseService } from '@shared/database/clickhouse/clickhouse.service';

/**
 * Consumer для обработки событий применения промокодов
 * Записывает данные в ClickHouse для аналитики
 */
@Processor('events')
@Injectable()
export class PromoCodeAnalyticsConsumer {
    private readonly logger = new Logger(PromoCodeAnalyticsConsumer.name);

    constructor(private readonly clickhouse: ClickHouseService) {}

    /**
     * Обработка события применения промокода
     * Записывает данные в таблицу promo_code_usages_analytics
     */
    @Process('PromoCodeAppliedEvent')
    async handlePromoCodeApplied(
        job: Job<PromoCodeAppliedEvent>,
    ): Promise<void> {
        const event = job.data;
        const eventDate = new Date(event.createdAt);

        try {
            await this.clickhouse.insert('promo_code_usages_analytics', {
                event_date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD
                created_at: event.createdAt.toISOString(),
                promo_code: event.promoCode,
                promo_code_id: event.promoCodeId,
                user_id: event.userId,
                order_id: event.orderId,
                order_amount: event.orderAmount,
                discount_amount: event.discountAmount,
            });

            this.logger.log(
                `Promo code usage recorded: ${event.promoCode} for user ${event.userId}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to record promo code usage: ${event.promoCode}`,
                error instanceof Error ? error.stack : error,
            );
            // Пробрасываем ошибку для повторной попытки
            throw error;
        }
    }
}
