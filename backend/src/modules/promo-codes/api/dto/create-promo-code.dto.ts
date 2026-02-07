import { Type } from 'class-transformer';
import {
    IsDate,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    Max,
    Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromoCodeDto {
    @ApiProperty({ example: 'SUMMER2024' })
    @IsString()
    @Matches(/^[A-Z0-9]+$/, {
        message: 'Code must contain only uppercase letters and numbers',
    })
    code: string;

    @ApiProperty({ example: 20, minimum: 1, maximum: 100 })
    @IsNumber()
    @Min(1)
    @Max(100)
    discountPercent: number;

    @ApiProperty({ example: 100, minimum: 1 })
    @IsNumber()
    @Min(1)
    totalLimit: number;

    @ApiProperty({ example: 1, minimum: 1 })
    @IsNumber()
    @Min(1)
    perUserLimit: number;

    @ApiPropertyOptional()
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    startsAt?: Date;

    @ApiPropertyOptional()
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    endsAt?: Date;
}
