import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PromoCodeQueryDto {
    @ApiPropertyOptional({ example: 1, default: 1 })
    @Type(() => Number)
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({ example: 10, default: 10 })
    @Type(() => Number)
    @IsOptional()
    limit?: number;

    @ApiPropertyOptional({ example: 'createdAt' })
    @IsString()
    @IsOptional()
    sortBy?: string;

    @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
    @IsString()
    @IsOptional()
    sortOrder?: 'asc' | 'desc';

    @ApiPropertyOptional({ example: true })
    @Type(() => Boolean)
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ example: 'SUMMER' })
    @IsString()
    @IsOptional()
    search?: string;
}
