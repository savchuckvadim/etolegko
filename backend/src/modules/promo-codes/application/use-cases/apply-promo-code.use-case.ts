import type { EventBus } from '@shared/events/event-bus.interface';
import { ApplyPromoCodeResponseDto } from '@promo-codes/api/dto/apply-promo-code-response.dto';
import { PromoCodeAppliedEvent } from '@promo-codes/application/events/promo-code-applied.event';
import { PromoCodeService } from '@promo-codes/application/services/promo-code.service';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

/**
 * Use Case для применения промокода
 * Координирует работу сервиса и публикацию события
 */
@Injectable()
export class ApplyPromoCodeUseCase {
    constructor(
        private readonly promoCodeService: PromoCodeService,
        @Inject('EventBus') private readonly eventBus: EventBus,
    ) {}

    /**
     * Применить промокод к заказу
     * 1. Вызывает сервис для бизнес-логики
     * 2. Публикует событие для записи в ClickHouse
     */
    async execute(
        orderId: string,
        promoCode: string,
        userId: string,
        orderAmount: number,
    ): Promise<ApplyPromoCodeResponseDto> {
        // 1. Получаем промокод через сервис
        const promoCodeEntity =
            await this.promoCodeService.findByCode(promoCode);
        if (!promoCodeEntity) {
            throw new NotFoundException(`Promo code ${promoCode} not found`);
        }

        // 2. Рассчитываем скидку
        const discountAmount = promoCodeEntity.calculateDiscount(orderAmount);
        const finalAmount = orderAmount - discountAmount;

        // 3. Публикуем событие для записи в ClickHouse
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

        // 4. Возвращаем результат
        return {
            discountAmount,
            finalAmount,
            promoCode: promoCodeEntity.code,
        };
    }
}
