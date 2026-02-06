/**
 * Domain Entity - PromoCode
 * Чистая бизнес-логика, без зависимостей от Mongoose
 */
export class PromoCode {
    id: string;
    code: string;
    discountPercent: number;
    totalLimit: number;
    perUserLimit: number;
    usedCount: number;
    isActive: boolean;
    startsAt?: Date;
    endsAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    constructor(partial: Partial<PromoCode>) {
        Object.assign(this, partial);
    }
}
