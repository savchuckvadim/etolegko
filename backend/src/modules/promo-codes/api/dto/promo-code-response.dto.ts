import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PromoCodeResponseDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    id: string;

    @ApiProperty({ example: 'SUMMER2024' })
    code: string;

    @ApiProperty({ example: 20 })
    discountPercent: number;

    @ApiProperty({ example: 100 })
    totalLimit: number;

    @ApiProperty({ example: 1 })
    perUserLimit: number;

    @ApiProperty({ example: 5 })
    usedCount: number;

    @ApiProperty({ example: true })
    isActive: boolean;

    @ApiPropertyOptional()
    startsAt?: Date;

    @ApiPropertyOptional()
    endsAt?: Date;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
    updatedAt: Date;
}
