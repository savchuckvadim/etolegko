import { ApiProperty } from '@nestjs/swagger';

/**
 * Простой статический DTO для пагинированного результата
 * Используется для Swagger документации
 */
export class PaginatedResultDto<T = any> {
    @ApiProperty({
        type: [Object],
        description: 'Array of items',
    })
    items: T[];

    @ApiProperty({ example: 100, description: 'Total number of items' })
    total: number;

    @ApiProperty({ example: 1, description: 'Current page number' })
    page: number;

    @ApiProperty({ example: 10, description: 'Items per page' })
    limit: number;

    @ApiProperty({ example: 10, description: 'Total number of pages' })
    totalPages: number;
}
