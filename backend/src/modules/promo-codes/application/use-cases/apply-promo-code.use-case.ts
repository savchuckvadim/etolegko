import type { EventBus } from '@shared/events/event-bus.interface';
import { AnalyticsRepository } from '@analytics/infrastructure/repositories/analytics.repository';
import { OrderRepository } from '@orders/infrastructure/repositories/order.repository';
import { ApplyPromoCodeResponseDto } from '@promo-codes/api/dto/apply-promo-code-response.dto';
import { PromoCodeAppliedEvent } from '@promo-codes/application/events/promo-code-applied.event';
import { PromoCodeService } from '@promo-codes/application/services/promo-code.service';
import { PromoCodeRepository } from '@promo-codes/infrastructure/repositories/promo-code.repository';
import { PromoCodeDocument } from '@promo-codes/infrastructure/schemas/promo-code.schema';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

/**
 * Use Case для применения промокода
 * Координирует работу сервиса и публикацию события
 */
@Injectable()
export class ApplyPromoCodeUseCase {
    constructor(
        private readonly promoCodeService: PromoCodeService,
        private readonly promoCodeRepository: PromoCodeRepository,
        private readonly orderRepository: OrderRepository,
        private readonly analyticsRepository: AnalyticsRepository,
        @Inject('EventBus') private readonly eventBus: EventBus,
    ) {}

    /**
     * Применить промокод к заказу
     * 1. Получает промокод
     * 2. Валидирует использование (активность, лимиты, срок действия)
     * 3. Рассчитывает скидку
     * 4. Сохраняет скидку в заказ в MongoDB
     * 5. Увеличивает счётчик использований промокода
     * 6. Публикует событие для записи в ClickHouse
     */
    async execute(
        orderId: string,
        promoCode: string,
        userId: string,
        orderAmount: number,
    ): Promise<ApplyPromoCodeResponseDto> {
        // 1. Получаем промокод
        const promoCodeEntity =
            await this.promoCodeService.findByCode(promoCode);
        if (!promoCodeEntity) {
            throw new NotFoundException(`Promo code ${promoCode} not found`);
        }

        // 2. Получаем количество использований промокода пользователем из ClickHouse
        const userUsageCount =
            await this.analyticsRepository.getUserPromoCodeUsageCount(
                userId,
                promoCodeEntity.id,
            );

        // 3. Валидация использования промокода
        promoCodeEntity.validateUsage(userId, userUsageCount);

        // 4. Рассчитываем скидку
        const discountAmount = promoCodeEntity.calculateDiscount(orderAmount);
        const finalAmount = orderAmount - discountAmount;

        // 5. Сохраняем скидку в заказ в MongoDB
        await this.orderRepository.update(orderId, {
            promoCodeId: promoCodeEntity.id,
            discountAmount,
        });

        // 6. Увеличиваем счётчик использований промокода
        promoCodeEntity.incrementUsage();
        await this.promoCodeRepository.update(promoCodeEntity.id, {
            usedCount: promoCodeEntity.usedCount,
        } as Partial<PromoCodeDocument>);

        // 7. Публикуем событие для записи в ClickHouse
        await this.eventBus.publish(
            new PromoCodeAppliedEvent(
                promoCodeEntity.id,
                promoCodeEntity.code,
                userId,
                orderId,
                orderAmount,
                discountAmount,
                new Date(),
            ),
        );

        // 8. Возвращаем результат
        return {
            discountAmount,
            finalAmount,
            promoCode: promoCodeEntity.code,
        };
    }
}
