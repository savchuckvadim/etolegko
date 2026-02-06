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
}
