import { Type } from 'class-transformer';
import { IsDate, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@common/paginate/dto/pagination.dto';

export class OrderQueryDto extends PaginationDto {
    @ApiPropertyOptional({ description: 'Filter by user ID' })
    @IsString()
    @IsOptional()
    @IsMongoId()
    userId?: string;

    @ApiPropertyOptional({ description: 'Filter by date from' })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateFrom?: Date;

    @ApiPropertyOptional({ description: 'Filter by date to' })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    dateTo?: Date;
}
