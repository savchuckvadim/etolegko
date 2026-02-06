/**
 * Domain Entity - PromoCodeUsage
 * Чистая бизнес-логика, без зависимостей от Mongoose
 */
export class PromoCodeUsage {
    id: string;
    promoCodeId: string;
    userId: string;
    orderId: string;
    discountAmount: number;
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<PromoCodeUsage>) {
        Object.assign(this, partial);
    }
}
