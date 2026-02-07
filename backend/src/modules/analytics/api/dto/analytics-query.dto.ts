import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto, SortOrder } from '@common/paginate/dto/pagination.dto';

/**
 * Базовый DTO для аналитических запросов с диапазоном дат
 */
export class DateRangeQueryDto {
    @ApiPropertyOptional({
        description: 'Start date for filtering',
        example: '2024-01-01',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateFrom?: Date;

    @ApiPropertyOptional({
        description: 'End date for filtering',
        example: '2024-12-31',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateTo?: Date;
}

/**
 * DTO для запроса аналитики промокодов
 */
export class PromoCodeAnalyticsQueryDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Start date for filtering',
        example: '2024-01-01',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateFrom?: Date;

    @ApiPropertyOptional({
        description: 'End date for filtering',
        example: '2024-12-31',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateTo?: Date;

    @ApiPropertyOptional({ default: 'usage_count' })
    @IsString()
    @IsOptional()
    sortBy?: string = 'usage_count';

    @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
    @IsOptional()
    sortOrder?: SortOrder = SortOrder.DESC;
}

/**
 * DTO для запроса аналитики пользователей
 */
export class UserAnalyticsQueryDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Start date for filtering',
        example: '2024-01-01',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateFrom?: Date;

    @ApiPropertyOptional({
        description: 'End date for filtering',
        example: '2024-12-31',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateTo?: Date;

    @ApiPropertyOptional({ default: 'total_amount' })
    @IsString()
    @IsOptional()
    sortBy?: string = 'total_amount';

    @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
    @IsOptional()
    sortOrder?: SortOrder = SortOrder.DESC;
}

/**
 * DTO для запроса истории использований промокодов
 */
export class PromoCodeUsageHistoryQueryDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filter by promo code ID' })
    @IsString()
    @IsOptional()
    promoCodeId?: string;

    @ApiPropertyOptional({
        description: 'Start date for filtering',
        example: '2024-01-01',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateFrom?: Date;

    @ApiPropertyOptional({
        description: 'End date for filtering',
        example: '2024-12-31',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateTo?: Date;

    @ApiPropertyOptional({ default: 'created_at' })
    @IsString()
    @IsOptional()
    sortBy?: string = 'created_at';

    @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
    @IsOptional()
    sortOrder?: SortOrder = SortOrder.DESC;
}
