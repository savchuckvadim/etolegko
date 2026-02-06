import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PromoCodeUsage } from '../entities/promo-code-usage.entity';

/**
 * Mongoose Schema - только для работы с БД
 * НЕ возвращаем Document напрямую, только через маппинг в Entity
 */
@Schema({ timestamps: true, collection: 'promo_code_usages' })
export class PromoCodeUsageSchema {
    @Prop({ type: Types.ObjectId, ref: 'PromoCodeSchema', required: true })
    promoCodeId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'UserSchema', required: true })
    userId: Types.ObjectId;

    @Prop({
        type: Types.ObjectId,
        ref: 'OrderSchema',
        required: true,
        unique: true,
    })
    orderId: Types.ObjectId;

    @Prop({ required: true, min: 0 })
    discountAmount: number;
}

export const PromoCodeUsageSchemaFactory =
    SchemaFactory.createForClass(PromoCodeUsageSchema);

// Индексы
PromoCodeUsageSchemaFactory.index({ promoCodeId: 1, userId: 1 });
PromoCodeUsageSchemaFactory.index({ orderId: 1 }, { unique: true });
PromoCodeUsageSchemaFactory.index({ createdAt: -1 });

export type PromoCodeUsageDocument = HydratedDocument<PromoCodeUsageSchema> & {
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Маппер: Document -> Entity
 * Всегда используем этот маппер, никогда не возвращаем Document напрямую
 */
export function mapPromoCodeUsageDocumentToEntity(
    doc: PromoCodeUsageDocument,
): PromoCodeUsage {
    return new PromoCodeUsage({
        id: doc._id.toString(),
        promoCodeId: doc.promoCodeId.toString(),
        userId: doc.userId.toString(),
        orderId: doc.orderId.toString(),
        discountAmount: doc.discountAmount,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    });
}
