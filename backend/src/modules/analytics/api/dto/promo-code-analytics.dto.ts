import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для аналитики промокодов (список)
 */
export class PromoCodeAnalyticsDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: 'Promo code ID',
    })
    promo_code_id: string;

    @ApiProperty({ example: 'SUMMER2024', description: 'Promo code' })
    promo_code: string;

    @ApiProperty({ example: 150, description: 'Usage count' })
    usage_count: number;

    @ApiProperty({ example: 5000.0, description: 'Total discount amount' })
    total_discount: number;

    @ApiProperty({ example: 50000.0, description: 'Total revenue' })
    total_revenue: number;

    @ApiProperty({ example: 45, description: 'Number of unique users' })
    unique_users: number;
}
