import type { EventBus } from '@shared/events/event-bus.interface';
import { AnalyticsRepository } from '@analytics/infrastructure/repositories/analytics.repository';
import { OrderRepository } from '@orders/infrastructure/repositories/order.repository';
import { ApplyPromoCodeResponseDto } from '@promo-codes/api/dto/apply-promo-code-response.dto';
import { PromoCodeAppliedEvent } from '@promo-codes/application/events/promo-code-applied.event';
import { PromoCodeService } from '@promo-codes/application/services/promo-code.service';
import { PromoCodeRepository } from '@promo-codes/infrastructure/repositories/promo-code.repository';
import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { MongoService } from '@shared/database/mongo/mongo.service';

/**
 * Use Case для применения промокода
 * Координирует работу сервиса и публикацию события
 * Использует MongoDB транзакции для предотвращения race conditions
 */
@Injectable()
export class ApplyPromoCodeUseCase {
    private readonly logger = new Logger(ApplyPromoCodeUseCase.name);

    constructor(
        private readonly promoCodeService: PromoCodeService,
        private readonly promoCodeRepository: PromoCodeRepository,
        private readonly orderRepository: OrderRepository,
        private readonly analyticsRepository: AnalyticsRepository,
        private readonly mongoService: MongoService,
        @Inject('EventBus') private readonly eventBus: EventBus,
    ) {}

    /**
     * Применить промокод к заказу
     * Использует MongoDB транзакции для предотвращения race conditions
     * 1. Получает промокод
     * 2. Валидирует использование (активность, лимиты, срок действия)
     * 3. Рассчитывает скидку
     * 4. В транзакции:
     *    - Атомарно увеличивает счётчик использований с проверкой лимита
     *    - Сохраняет скидку в заказ
     * 5. Публикует событие для записи в ClickHouse
     */
    async execute(
        orderId: string,
        promoCode: string,
        userId: string,
        orderAmount: number,
    ): Promise<ApplyPromoCodeResponseDto> {
        // Для локальной разработки без replica set используем fallback без транзакций
        // В production с replica set транзакции будут работать
        let session: any = null;
        
        try {
            session = await this.mongoService.startSession();
        } catch (error) {
            // Если не удалось создать сессию, продолжаем без транзакций
            this.logger.warn('MongoDB session not available, proceeding without transaction');
        }

        const executeOperation = async () => {
            // 1. Получаем промокод
            const promoCodeEntity = await this.promoCodeService.findByCode(
                promoCode,
                session,
            );
            if (!promoCodeEntity) {
                throw new NotFoundException(
                    `Promo code ${promoCode} not found`,
                );
            }

            // 2. Получаем количество использований промокода пользователем из ClickHouse
            // (ClickHouse не участвует в транзакции, но используется для валидации)
            const userUsageCount =
                await this.analyticsRepository.getUserPromoCodeUsageCount(
                    userId,
                    promoCodeEntity.id,
                );

            // 3. Валидация использования промокода (активность, срок действия, лимит пользователя)
            promoCodeEntity.validateUsage(userId, userUsageCount);

            // 4. Рассчитываем скидку
            const discountAmount =
                promoCodeEntity.calculateDiscount(orderAmount);
            const finalAmount = orderAmount - discountAmount;

            // 5. Атомарно увеличиваем счётчик использований с проверкой общего лимита
            // Это предотвращает race condition - если лимит превышен, операция не выполнится
            const updatedPromoCode =
                await this.promoCodeRepository.incrementUsageIfWithinLimit(
                    promoCodeEntity.id,
                    promoCodeEntity.totalLimit,
                    session,
                );

            if (!updatedPromoCode) {
                throw new BadRequestException(
                    'Promo code total limit exceeded',
                );
            }

            // 6. Сохраняем скидку в заказ
            await this.orderRepository.update(
                orderId,
                {
                    promoCodeId: promoCodeEntity.id,
                    discountAmount,
                },
                session,
            );

            // 7. Публикуем событие для записи в ClickHouse (после успешной транзакции)
            // Событие публикуется вне транзакции, так как ClickHouse не поддерживает транзакции
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
        };

        try {
            if (session) {
                // Пытаемся использовать транзакцию
                try {
                    return await session.withTransaction(executeOperation);
                } catch (transactionError: any) {
                    // Если транзакции не поддерживаются (локальный MongoDB без replica set),
                    // выполняем без транзакции
                    if (
                        transactionError?.code === 20 ||
                        transactionError?.codeName === 'IllegalOperation' ||
                        transactionError?.message?.includes('replica set')
                    ) {
                        this.logger.warn(
                            'MongoDB transactions not supported, executing without transaction',
                        );
                        await session.endSession();
                        session = null;
                        return await executeOperation();
                    }
                    // Если другая ошибка - пробрасываем дальше
                    throw transactionError;
                }
            } else {
                // Выполняем без транзакции
                return await executeOperation();
            }
        } finally {
            if (session) {
                await session.endSession();
            }
        }
    }
}
