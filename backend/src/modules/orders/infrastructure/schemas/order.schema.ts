import { Order } from '@orders/domain/entity/order.entity';
import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Mongoose Schema - только для работы с БД
 * НЕ возвращаем Document напрямую, только через маппинг в Entity
 */
@Schema({ timestamps: true, collection: 'orders' })
export class OrderSchema {
    @Prop({ required: true, type: String, ref: 'User' })
    userId: string;

    @Prop({ required: true, min: 0 })
    amount: number;

    @Prop({ type: String, ref: 'PromoCode' })
    promoCodeId?: string;

    @Prop({ min: 0 })
    discountAmount?: number;
}

export const OrderSchemaFactory = SchemaFactory.createForClass(OrderSchema);

// Индексы
OrderSchemaFactory.index({ userId: 1 });
OrderSchemaFactory.index({ createdAt: -1 });
OrderSchemaFactory.index({ userId: 1, createdAt: -1 });

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
        userId: doc.userId,
        amount: doc.amount,
        promoCodeId: doc.promoCodeId,
        discountAmount: doc.discountAmount,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    });
}
