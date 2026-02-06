import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { PromoCode } from '../entities/promo-code.entity';

/**
 * Mongoose Schema - только для работы с БД
 * НЕ возвращаем Document напрямую, только через маппинг в Entity
 */
@Schema({ timestamps: true, collection: 'promo_codes' })
export class PromoCodeSchema {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, min: 0, max: 100 })
  discountPercent: number;

  @Prop({ required: true, min: 0 })
  totalLimit: number;

  @Prop({ required: true, min: 0 })
  perUserLimit: number;

  @Prop({ default: 0, min: 0 })
  usedCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  startsAt?: Date;

  @Prop()
  endsAt?: Date;
}

export const PromoCodeSchemaFactory = SchemaFactory.createForClass(PromoCodeSchema);

// Индексы
PromoCodeSchemaFactory.index({ code: 1 }, { unique: true });
PromoCodeSchemaFactory.index({ isActive: 1 });
PromoCodeSchemaFactory.index({ startsAt: 1, endsAt: 1 });

export type PromoCodeDocument = HydratedDocument<PromoCodeSchema> & {
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Маппер: Document -> Entity
 * Всегда используем этот маппер, никогда не возвращаем Document напрямую
 */
export function mapPromoCodeDocumentToEntity(doc: PromoCodeDocument): PromoCode {
  return new PromoCode({
    id: doc._id.toString(),
    code: doc.code,
    discountPercent: doc.discountPercent,
    totalLimit: doc.totalLimit,
    perUserLimit: doc.perUserLimit,
    usedCount: doc.usedCount,
    isActive: doc.isActive,
    startsAt: doc.startsAt,
    endsAt: doc.endsAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}
