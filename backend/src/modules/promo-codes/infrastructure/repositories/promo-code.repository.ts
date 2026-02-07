import { PromoCode } from '@promo-codes/domain/entity/promo-code.entity';
import {
    mapPromoCodeDocumentToEntity,
    PromoCodeDocument,
} from '@promo-codes/infrastructure/schemas/promo-code.schema';
import { ClientSession, Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRepository } from '@shared/database/repositories/base.repository';

/**
 * PromoCode Repository
 * Всегда возвращает Entity, никогда Document
 * Находится в infrastructure слое модуля promo-codes
 */
@Injectable()
export class PromoCodeRepository extends BaseRepository<
    PromoCodeDocument,
    PromoCode
> {
    constructor(
        @InjectModel('PromoCodeSchema')
        private readonly promoCodeModel: Model<PromoCodeDocument>,
    ) {
        super(promoCodeModel);
    }

    protected mapToEntity(document: PromoCodeDocument): PromoCode {
        return mapPromoCodeDocumentToEntity(document);
    }

    /**
     * Найти по коду
     */
    async findByCode(
        code: string,
        session?: ClientSession,
    ): Promise<PromoCode | null> {
        return this.findOne({ code: code.toUpperCase() }, session);
    }

    /**
     * Атомарно увеличить счётчик использований с проверкой лимита
     * Используется для предотвращения race conditions
     */
    async incrementUsageIfWithinLimit(
        promoCodeId: string,
        totalLimit: number,
        session?: ClientSession,
    ): Promise<PromoCode | null> {
        const query = this.promoCodeModel.findOneAndUpdate(
            {
                _id: promoCodeId,
                usedCount: { $lt: totalLimit }, // Условие проверяется атомарно
            },
            { $inc: { usedCount: 1 } },
            { new: true },
        );

        if (session) {
            query.session(session);
        }

        const doc = await query.exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    /**
     * Проверить существование по коду
     */
    async existsByCode(code: string): Promise<boolean> {
        const promoCode = await this.promoCodeModel
            .findOne({ code: code.toUpperCase() })
            .exec();
        return !!promoCode;
    }

    /**
     * Получить модель для прямого доступа (используется для пагинации)
     */
    getModel(): Model<PromoCodeDocument> {
        return this.promoCodeModel;
    }
}
