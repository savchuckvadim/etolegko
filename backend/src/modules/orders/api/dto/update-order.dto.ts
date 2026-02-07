import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderDto {
    @ApiPropertyOptional({ example: 1500, minimum: 0 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    amount?: number;
}
