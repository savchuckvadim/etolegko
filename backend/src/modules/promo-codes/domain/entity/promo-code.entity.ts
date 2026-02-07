import { BadRequestException } from '@nestjs/common';

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

    /**
     * Валидация использования промокода
     */
    validateUsage(userId: string, userUsageCount: number): void {
        if (!this.isActive) {
            throw new BadRequestException('Promo code is not active');
        }

        if (this.usedCount >= this.totalLimit) {
            throw new BadRequestException('Promo code total limit exceeded');
        }

        if (userUsageCount >= this.perUserLimit) {
            throw new BadRequestException('User limit exceeded');
        }

        const now = new Date();
        if (this.startsAt && now < this.startsAt) {
            throw new BadRequestException('Promo code has not started yet');
        }

        if (this.endsAt && now > this.endsAt) {
            throw new BadRequestException('Promo code has expired');
        }
    }

    /**
     * Расчёт суммы скидки
     */
    calculateDiscount(amount: number): number {
        return (amount * this.discountPercent) / 100;
    }

    /**
     * Увеличить счётчик использований
     */
    incrementUsage(): void {
        this.usedCount += 1;
    }

    /**
     * Деактивировать промокод
     */
    deactivate(): void {
        this.isActive = false;
    }

    /**
     * Активировать промокод
     */
    activate(): void {
        this.isActive = true;
    }
}
