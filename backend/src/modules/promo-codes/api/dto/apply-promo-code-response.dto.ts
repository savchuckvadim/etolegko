import { ApiProperty } from '@nestjs/swagger';

export class ApplyPromoCodeResponseDto {
    @ApiProperty({ example: 100.5 })
    discountAmount: number;

    @ApiProperty({ example: 400.5 })
    finalAmount: number;

    @ApiProperty({ example: 'SUMMER2024' })
    promoCode: string;
}
