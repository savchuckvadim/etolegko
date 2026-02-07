import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для истории использований промокодов
 */
export class PromoCodeUsageHistoryDto {
    @ApiProperty({ example: 'SUMMER2024', description: 'Promo code' })
    promo_code: string;

    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: 'User ID',
    })
    user_id: string;

    @ApiProperty({
        example: '507f1f77bcf86cd799439012',
        description: 'Order ID',
    })
    order_id: string;

    @ApiProperty({ example: 1000.0, description: 'Order amount' })
    order_amount: number;

    @ApiProperty({ example: 100.0, description: 'Discount amount' })
    discount_amount: number;

    @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Created at' })
    created_at: string;
}
