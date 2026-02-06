# Backend: Pagination, Sorting, Filtering

## Назначение

Универсальная система пагинации, сортировки и фильтрации для всех модулей. Поддержка server-side пагинации для MongoDB и ClickHouse.

## Структура

```
src/
├── common/
│   ├── dto/
│   │   ├── pagination.dto.ts
│   │   ├── sort.dto.ts
│   │   └── filter.dto.ts
│   ├── interfaces/
│   │   └── paginated-result.interface.ts
│   └── utils/
│       ├── pagination.util.ts
│       └── query-builder.util.ts
```

## Реализация

### 1. Base Pagination DTO

**`common/dto/pagination.dto.ts`**
```typescript
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
```

### 2. Date Range DTO

**`common/dto/date-range.dto.ts`**
```typescript
import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class DateRangeQueryDto extends DateRangeDto {
  @ApiPropertyOptional({ 
    enum: ['today', 'last7days', 'last30days', 'custom'],
    default: 'last30days'
  })
  @IsOptional()
  @IsEnum(['today', 'last7days', 'last30days', 'custom'])
  datePreset?: 'today' | 'last7days' | 'last30days' | 'custom' = 'last30days';
}
```

### 3. Paginated Result Interface

**`common/interfaces/paginated-result.interface.ts`**
```typescript
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

### 4. Pagination Utility

**`common/utils/pagination.util.ts`**
```typescript
export class PaginationUtil {
  static createPaginatedResult<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static getSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static getDateRange(preset?: string): { dateFrom: Date; dateTo: Date } {
    const now = new Date();
    const dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    let dateFrom: Date;

    switch (preset) {
      case 'today':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'last7days':
        dateFrom = new Date(dateTo);
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'last30days':
        dateFrom = new Date(dateTo);
        dateFrom.setDate(dateFrom.getDate() - 30);
        break;
      default:
        dateFrom = new Date(dateTo);
        dateFrom.setDate(dateFrom.getDate() - 30);
    }

    return { dateFrom, dateTo };
  }

  static parseDateRange(
    preset?: string,
    dateFrom?: string,
    dateTo?: string,
  ): { dateFrom: Date; dateTo: Date } {
    if (preset && preset !== 'custom') {
      return this.getDateRange(preset);
    }

    const now = new Date();
    const to = dateTo ? new Date(dateTo) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const from = dateFrom ? new Date(dateFrom) : new Date(to);
    if (!dateFrom) {
      from.setDate(from.getDate() - 30);
    }

    return { dateFrom: from, dateTo: to };
  }
}
```

### 5. MongoDB Query Builder

**`common/utils/mongo-query-builder.util.ts`**
```typescript
import { Model, FilterQuery } from 'mongoose';
import { PaginationDto } from '../dto/pagination.dto';

export class MongoQueryBuilder<T> {
  private query: any;
  private model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
    this.query = model.find();
  }

  where(filter: FilterQuery<T>): this {
    this.query = this.query.where(filter);
    return this;
  }

  search(fields: string[], searchTerm: string): this {
    if (!searchTerm) return this;

    const searchRegex = { $regex: searchTerm, $options: 'i' };
    const orConditions = fields.map((field) => ({ [field]: searchRegex }));

    this.query = this.query.or(orConditions);
    return this;
  }

  paginate(pagination: PaginationDto): this {
    const skip = PaginationUtil.getSkip(pagination.page || 1, pagination.limit || 10);
    this.query = this.query.skip(skip).limit(pagination.limit || 10);
    return this;
  }

  sort(sortBy: string, sortOrder: 'asc' | 'desc'): this {
    this.query = this.query.sort({ [sortBy]: sortOrder });
    return this;
  }

  async execute(): Promise<{ items: T[]; total: number }> {
    const countQuery = this.model.countDocuments(this.query.getQuery());
    const dataQuery = this.query.exec();

    const [total, items] = await Promise.all([countQuery, dataQuery]);

    return { items, total };
  }
}
```

### 6. ClickHouse Query Builder

**`common/utils/clickhouse-query-builder.util.ts`**
```typescript
import { ClickHouseService } from '../../modules/shared/database/clickhouse/clickhouse.service';
import { PaginationDto } from '../dto/pagination.dto';

export class ClickHouseQueryBuilder {
  private selectClause: string = '';
  private fromClause: string = '';
  private whereClause: string = '';
  private groupByClause: string = '';
  private orderByClause: string = '';
  private limitClause: string = '';
  private params: Record<string, any> = {};

  constructor(private readonly clickhouse: ClickHouseService) {}

  select(fields: string[]): this {
    this.selectClause = `SELECT ${fields.join(', ')}`;
    return this;
  }

  from(table: string): this {
    this.fromClause = `FROM ${table}`;
    return this;
  }

  where(conditions: Record<string, any>): this {
    const whereParts: string[] = [];
    
    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const paramKey = key.replace(/[^a-zA-Z0-9]/g, '_');
        this.params[paramKey] = value;
        whereParts.push(`${key} = {${paramKey}:String}`);
      }
    });

    if (whereParts.length > 0) {
      this.whereClause = `WHERE ${whereParts.join(' AND ')}`;
    }

    return this;
  }

  dateRange(dateFrom: Date, dateTo: Date): this {
    this.params.dateFrom = dateFrom.toISOString().split('T')[0];
    this.params.dateTo = dateTo.toISOString().split('T')[0];
    
    const existingWhere = this.whereClause ? `${this.whereClause} AND ` : 'WHERE ';
    this.whereClause = `${existingWhere}event_date >= {dateFrom:Date} AND event_date <= {dateTo:Date}`;
    
    return this;
  }

  groupBy(fields: string[]): this {
    this.groupByClause = `GROUP BY ${fields.join(', ')}`;
    return this;
  }

  orderBy(field: string, order: 'asc' | 'desc'): this {
    this.orderByClause = `ORDER BY ${field} ${order.toUpperCase()}`;
    return this;
  }

  paginate(pagination: PaginationDto): this {
    const limit = pagination.limit || 10;
    const offset = PaginationUtil.getSkip(pagination.page || 1, limit);
    
    this.params.limit = limit;
    this.params.offset = offset;
    this.limitClause = `LIMIT {limit:UInt32} OFFSET {offset:UInt32}`;
    
    return this;
  }

  async execute<T = any>(): Promise<{ items: T[]; total: number }> {
    // Count query
    const countQuery = `
      SELECT count() as count
      ${this.fromClause}
      ${this.whereClause}
      ${this.groupByClause ? `FROM (${this.selectClause} ${this.fromClause} ${this.whereClause} ${this.groupByClause})` : ''}
    `;

    // Data query
    const dataQuery = `
      ${this.selectClause}
      ${this.fromClause}
      ${this.whereClause}
      ${this.groupByClause}
      ${this.orderByClause}
      ${this.limitClause}
    `;

    const [countResult, dataResult] = await Promise.all([
      this.clickhouse.query<{ count: number }>(countQuery, this.params),
      this.clickhouse.query<T>(dataQuery, this.params),
    ]);

    return {
      items: dataResult,
      total: countResult[0]?.count || 0,
    };
  }
}
```

### 7. Использование в сервисах

**Пример для MongoDB:**
```typescript
async findAll(query: UserQueryDto): Promise<PaginatedResult<UserReadModel>> {
  const builder = new MongoQueryBuilder(this.userModel);

  if (query.search) {
    builder.search(['email', 'name'], query.search);
  }

  if (query.isActive !== undefined) {
    builder.where({ isActive: query.isActive });
  }

  const result = await builder
    .paginate(query)
    .sort(query.sortBy, query.sortOrder)
    .execute();

  return PaginationUtil.createPaginatedResult(
    result.items.map((user) => UserMapper.toReadModel(user)),
    result.total,
    query.page || 1,
    query.limit || 10,
  );
}
```

**Пример для ClickHouse:**
```typescript
async getPromoCodesList(
  query: PromoCodeAnalyticsQueryDto,
): Promise<PaginatedResult<PromoCodeAnalyticsDto>> {
  const { dateFrom, dateTo } = PaginationUtil.parseDateRange(
    query.datePreset,
    query.dateFrom,
    query.dateTo,
  );

  const builder = new ClickHouseQueryBuilder(this.clickhouse);

  const result = await builder
    .select([
      'promo_code_id',
      'promo_code',
      'count() as usage_count',
      'sum(discount_amount) as total_discount',
      'sum(order_amount) as total_revenue',
      'uniq(user_id) as unique_users',
    ])
    .from('promo_code_usages_analytics')
    .dateRange(dateFrom, dateTo)
    .groupBy(['promo_code_id', 'promo_code'])
    .orderBy(query.sortBy, query.sortOrder)
    .paginate(query)
    .execute<PromoCodeAnalyticsDto>();

  return PaginationUtil.createPaginatedResult(
    result.items,
    result.total,
    query.page || 1,
    query.limit || 10,
  );
}
```

## Тестирование

- Unit тесты для утилит пагинации
- Тесты query builders
- Тесты парсинга date range
- E2E тесты пагинации

## Зависимости

- `@nestjs/common`
- `mongoose` (для MongoDB)
- `@clickhouse/client` (для ClickHouse)
