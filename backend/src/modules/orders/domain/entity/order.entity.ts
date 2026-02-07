/**
 * Domain Entity - Order
 * Чистая бизнес-логика, без зависимостей от Mongoose
 */
export class Order {
    id: string;
    userId: string;
    amount: number;
    promoCodeId?: string;
    discountAmount?: number;
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<Order>) {
        Object.assign(this, partial);
    }

    /**
     * Применить промокод к заказу
     */
    applyPromoCode(promoCodeId: string, discountAmount: number): void {
        this.promoCodeId = promoCodeId;
        this.discountAmount = discountAmount;
    }

    /**
     * Получить итоговую сумму заказа
     */
    getFinalAmount(): number {
        return this.amount - (this.discountAmount || 0);
    }
}
