/**
 * Событие применения промокода
 * Используется для публикации в EventBus и записи в ClickHouse
 */
export class PromoCodeAppliedEvent {
    constructor(
        public readonly promoCodeId: string,
        public readonly promoCode: string,
        public readonly userId: string,
        public readonly orderId: string,
        public readonly orderAmount: number,
        public readonly discountAmount: number,
        public readonly createdAt: Date,
    ) {}
}
