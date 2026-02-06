import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Order } from '../entities/order.entity';

/**
 * Mongoose Schema - только для работы с БД
 * НЕ возвращаем Document напрямую, только через маппинг в Entity
 */
@Schema({ timestamps: true, collection: 'orders' })
export class OrderSchema {
    @Prop({ type: Types.ObjectId, ref: 'UserSchema', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ type: Types.ObjectId, ref: 'PromoCodeSchema' })
    promoCodeId?: Types.ObjectId;

    @Prop({ min: 0 })
    discountAmount?: number;
}

export const OrderSchemaFactory = SchemaFactory.createForClass(OrderSchema);

// Индексы
OrderSchemaFactory.index({ userId: 1, createdAt: -1 });
OrderSchemaFactory.index({ promoCodeId: 1 });

export type OrderDocument = HydratedDocument<OrderSchema> & {
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Маппер: Document -> Entity
 * Всегда используем этот маппер, никогда не возвращаем Document напрямую
 */
export function mapOrderDocumentToEntity(doc: OrderDocument): Order {
    return new Order({
        id: doc._id.toString(),
        userId: doc.userId.toString(),
        amount: doc.amount,
        promoCodeId: doc.promoCodeId?.toString(),
        discountAmount: doc.discountAmount,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    });
}
