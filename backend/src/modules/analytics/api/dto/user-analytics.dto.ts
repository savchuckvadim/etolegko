import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для аналитики пользователей
 */
export class UserAnalyticsDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: 'User ID',
    })
    user_id: string;

    @ApiProperty({ example: 25, description: 'Total orders count' })
    orders_count: number;

    @ApiProperty({ example: 15000.0, description: 'Total amount spent' })
    total_amount: number;

    @ApiProperty({ example: 5, description: 'Promo codes used count' })
    promo_codes_used: number;
}
