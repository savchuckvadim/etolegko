import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto, SortOrder } from '@common/paginate/dto/pagination.dto';

/**
 * Пресеты дат для аналитики
 */
export enum DatePreset {
    TODAY = 'today',
    LAST_7_DAYS = 'last7days',
    LAST_30_DAYS = 'last30days',
    CUSTOM = 'custom',
}

/**
 * Базовый DTO для аналитических запросов с диапазоном дат
 */
export class DateRangeQueryDto {
    @ApiPropertyOptional({
        description: 'Date preset for filtering',
        enum: DatePreset,
        example: DatePreset.LAST_30_DAYS,
    })
    @IsEnum(DatePreset)
    @IsOptional()
    datePreset?: DatePreset = DatePreset.LAST_30_DAYS;

    @ApiPropertyOptional({
        description:
            'Start date for filtering (used when datePreset is "custom")',
        example: '2024-01-01',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateFrom?: Date;

    @ApiPropertyOptional({
        description:
            'End date for filtering (used when datePreset is "custom")',
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
        description: 'Date preset for filtering',
        enum: DatePreset,
        example: DatePreset.LAST_30_DAYS,
    })
    @IsEnum(DatePreset)
    @IsOptional()
    datePreset?: DatePreset = DatePreset.LAST_30_DAYS;

    @ApiPropertyOptional({
        description:
            'Start date for filtering (used when datePreset is "custom")',
        example: '2024-01-01',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateFrom?: Date;

    @ApiPropertyOptional({
        description:
            'End date for filtering (used when datePreset is "custom")',
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
        description: 'Date preset for filtering',
        enum: DatePreset,
        example: DatePreset.LAST_30_DAYS,
    })
    @IsEnum(DatePreset)
    @IsOptional()
    datePreset?: DatePreset = DatePreset.LAST_30_DAYS;

    @ApiPropertyOptional({
        description:
            'Start date for filtering (used when datePreset is "custom")',
        example: '2024-01-01',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateFrom?: Date;

    @ApiPropertyOptional({
        description:
            'End date for filtering (used when datePreset is "custom")',
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
        description: 'Date preset for filtering',
        enum: DatePreset,
        example: DatePreset.LAST_30_DAYS,
    })
    @IsEnum(DatePreset)
    @IsOptional()
    datePreset?: DatePreset = DatePreset.LAST_30_DAYS;

    @ApiPropertyOptional({
        description:
            'Start date for filtering (used when datePreset is "custom")',
        example: '2024-01-01',
        type: String,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateFrom?: Date;

    @ApiPropertyOptional({
        description:
            'End date for filtering (used when datePreset is "custom")',
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
