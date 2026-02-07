import { IsBoolean, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePromoCodeDto {
    @ApiPropertyOptional({ example: 25, minimum: 1, maximum: 100 })
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(100)
    discountPercent?: number;

    @ApiPropertyOptional({ example: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
