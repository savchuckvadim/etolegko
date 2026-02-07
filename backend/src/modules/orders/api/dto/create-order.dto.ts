import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
    @ApiProperty({ example: 1000, minimum: 0 })
    @IsNumber()
    @Min(0)
    amount: number;
}
