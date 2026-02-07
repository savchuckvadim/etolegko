import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO для статистики промокода
 */
export class PromoCodeStatsDto {
    @ApiProperty({ example: 150, description: 'Total number of usages' })
    usage_count: number;

    @ApiProperty({ example: 5000.0, description: 'Total discount amount' })
    total_discount: number;

    @ApiProperty({ example: 50000.0, description: 'Total revenue' })
    total_revenue: number;

    @ApiProperty({ example: 45, description: 'Number of unique users' })
    unique_users: number;

    @ApiProperty({ example: 33.33, description: 'Average discount amount' })
    avg_discount: number;
}
