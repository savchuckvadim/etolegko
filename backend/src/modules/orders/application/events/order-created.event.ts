/**
 * Событие создания заказа
 * Используется для публикации в EventBus и записи в ClickHouse
 */
export class OrderCreatedEvent {
    constructor(
        public readonly orderId: string,
        public readonly userId: string,
        public readonly amount: number,
        public readonly promoCodeId?: string,
        public readonly discountAmount?: number,
        public readonly createdAt: Date = new Date(),
    ) {}
}
