import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderResponseDto {
    @ApiProperty({ example: '507f1f77bcf86cd799439011' })
    id: string;

    @ApiProperty({ example: '507f1f77bcf86cd799439012' })
    userId: string;

    @ApiProperty({ example: 1000 })
    amount: number;

    @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013' })
    promoCodeId?: string;

    @ApiPropertyOptional({ example: 200 })
    discountAmount?: number;

    @ApiProperty({ example: 800, description: 'Final amount after discount' })
    finalAmount: number;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
    updatedAt: Date;
}
