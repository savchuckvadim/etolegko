# Backend: Analytics Module

## Назначение

Модуль для получения аналитических данных из ClickHouse. Предоставляет агрегированную статистику по пользователям, промокодам и заказам.

## Структура

```
src/
├── modules/
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   ├── api/
│   │   │   ├── analytics.controller.ts
│   │   │   └── dto/
│   │   │       ├── analytics-query.dto.ts
│   │   │       ├── promo-code-stats.dto.ts
│   │   │       ├── user-stats.dto.ts
│   │   │       └── promo-code-usage-history.dto.ts
│   │   ├── application/
│   │   │   ├── analytics.service.ts
│   │   │   └── interfaces/
│   │   │       └── analytics-repository.interface.ts
│   │   └── consumers/
│   │       ├── promo-code-analytics.consumer.ts
│   │       ├── order-analytics.consumer.ts
│   │       └── user-analytics.consumer.ts
```

## Реализация

### 1. Analytics Service

**`modules/analytics/application/analytics.service.ts`**
```typescript
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly clickhouse: ClickHouseService,
  ) {}

  async getPromoCodeStats(
    promoCodeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<PromoCodeStatsDto> {
    const query = `
      SELECT
        count() as usage_count,
        sum(discount_amount) as total_discount,
        sum(order_amount) as total_revenue,
        uniq(user_id) as unique_users,
        avg(discount_amount) as avg_discount
      FROM promo_code_usages_analytics
      WHERE promo_code_id = {promoCodeId:String}
        AND event_date >= {dateFrom:Date}
        AND event_date <= {dateTo:Date}
    `;

    const result = await this.clickhouse.query<PromoCodeStatsDto>(query, {
      promoCodeId,
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
    });

    return result[0] || {
      usage_count: 0,
      total_discount: 0,
      total_revenue: 0,
      unique_users: 0,
      avg_discount: 0,
    };
  }

  async getPromoCodesList(
    query: PromoCodeAnalyticsQueryDto,
  ): Promise<PaginatedResult<PromoCodeAnalyticsDto>> {
    const { page, limit, dateFrom, dateTo, sortBy, sortOrder } = query;

    // Подзапрос для агрегации
    const subquery = `
      SELECT
        promo_code_id,
        promo_code,
        count() as usage_count,
        sum(discount_amount) as total_discount,
        sum(order_amount) as total_revenue,
        uniq(user_id) as unique_users
      FROM promo_code_usages_analytics
      WHERE event_date >= {dateFrom:Date}
        AND event_date <= {dateTo:Date}
      GROUP BY promo_code_id, promo_code
    `;

    // Общий запрос с пагинацией
    const countQuery = `SELECT count() FROM (${subquery})`;
    const dataQuery = `
      SELECT *
      FROM (${subquery})
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT {limit:UInt32} OFFSET {offset:UInt32}
    `;

    const [countResult, dataResult] = await Promise.all([
      this.clickhouse.query<{ count: number }>(countQuery, {
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: dateTo.toISOString().split('T')[0],
      }),
      this.clickhouse.query<PromoCodeAnalyticsDto>(dataQuery, {
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: dateTo.toISOString().split('T')[0],
        limit,
        offset: (page - 1) * limit,
      }),
    ]);

    return {
      items: dataResult,
      total: countResult[0]?.count || 0,
      page,
      limit,
    };
  }

  async getUsersList(
    query: UserAnalyticsQueryDto,
  ): Promise<PaginatedResult<UserAnalyticsDto>> {
    const { page, limit, dateFrom, dateTo, sortBy, sortOrder } = query;

    const subquery = `
      SELECT
        user_id,
        sum(orders_count) as orders_count,
        sum(total_amount) as total_amount,
        sum(promo_codes_used) as promo_codes_used
      FROM users_analytics
      WHERE event_date >= {dateFrom:Date}
        AND event_date <= {dateTo:Date}
      GROUP BY user_id
    `;

    const countQuery = `SELECT count() FROM (${subquery})`;
    const dataQuery = `
      SELECT *
      FROM (${subquery})
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT {limit:UInt32} OFFSET {offset:UInt32}
    `;

    const [countResult, dataResult] = await Promise.all([
      this.clickhouse.query<{ count: number }>(countQuery, {
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: dateTo.toISOString().split('T')[0],
      }),
      this.clickhouse.query<UserAnalyticsDto>(dataQuery, {
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: dateTo.toISOString().split('T')[0],
        limit,
        offset: (page - 1) * limit,
      }),
    ]);

    return {
      items: dataResult,
      total: countResult[0]?.count || 0,
      page,
      limit,
    };
  }

  async getPromoCodeUsageHistory(
    query: PromoCodeUsageHistoryQueryDto,
  ): Promise<PaginatedResult<PromoCodeUsageHistoryDto>> {
    const { page, limit, promoCodeId, dateFrom, dateTo, sortBy, sortOrder } = query;

    const whereClause = promoCodeId
      ? `promo_code_id = {promoCodeId:String} AND event_date >= {dateFrom:Date} AND event_date <= {dateTo:Date}`
      : `event_date >= {dateFrom:Date} AND event_date <= {dateTo:Date}`;

    const countQuery = `
      SELECT count()
      FROM promo_code_usages_analytics
      WHERE ${whereClause}
    `;

    const dataQuery = `
      SELECT
        promo_code,
        user_id,
        order_id,
        order_amount,
        discount_amount,
        created_at
      FROM promo_code_usages_analytics
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT {limit:UInt32} OFFSET {offset:UInt32}
    `;

    const params: any = {
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      limit,
      offset: (page - 1) * limit,
    };

    if (promoCodeId) {
      params.promoCodeId = promoCodeId;
    }

    const [countResult, dataResult] = await Promise.all([
      this.clickhouse.query<{ count: number }>(countQuery, params),
      this.clickhouse.query<PromoCodeUsageHistoryDto>(dataQuery, params),
    ]);

    return {
      items: dataResult,
      total: countResult[0]?.count || 0,
      page,
      limit,
    };
  }
}
```

### 2. Consumers

**`modules/analytics/consumers/promo-code-analytics.consumer.ts`**
```typescript
@Processor('events')
@Injectable()
export class PromoCodeAnalyticsConsumer {
  private readonly logger = new Logger(PromoCodeAnalyticsConsumer.name);

  constructor(private readonly clickhouse: ClickHouseService) {}

  @Process('PromoCodeAppliedEvent')
  async handlePromoCodeApplied(job: Job<PromoCodeAppliedEvent>) {
    const event = job.data;
    const eventDate = new Date(event.createdAt);

    try {
      await this.clickhouse.insert('promo_code_usages_analytics', {
        event_date: eventDate.toISOString().split('T')[0],
        created_at: event.createdAt.toISOString(),
        promo_code: event.promoCode,
        promo_code_id: event.promoCodeId,
        user_id: event.userId,
        order_id: event.orderId,
        order_amount: event.orderAmount,
        discount_amount: event.discountAmount,
      });

      this.logger.log(`Promo code usage recorded: ${event.promoCode}`);
    } catch (error) {
      this.logger.error('Failed to record promo code usage:', error);
      throw error; // Retry job
    }
  }
}
```

**`modules/analytics/consumers/order-analytics.consumer.ts`**
```typescript
@Processor('events')
@Injectable()
export class OrderAnalyticsConsumer {
  private readonly logger = new Logger(OrderAnalyticsConsumer.name);

  constructor(private readonly clickhouse: ClickHouseService) {}

  @Process('OrderCreatedEvent')
  async handleOrderCreated(job: Job<OrderCreatedEvent>) {
    const event = job.data;
    const eventDate = new Date(event.createdAt);

    try {
      await this.clickhouse.insert('orders_analytics', {
        event_date: eventDate.toISOString().split('T')[0],
        created_at: event.createdAt.toISOString(),
        order_id: event.orderId,
        user_id: event.userId,
        amount: event.amount,
        promo_code: event.promoCode || '',
      });

      this.logger.log(`Order recorded: ${event.orderId}`);
    } catch (error) {
      this.logger.error('Failed to record order:', error);
      throw error;
    }
  }
}
```

**`modules/analytics/consumers/user-analytics.consumer.ts`**
```typescript
@Processor('events')
@Injectable()
export class UserAnalyticsConsumer {
  private readonly logger = new Logger(UserAnalyticsConsumer.name);

  constructor(private readonly clickhouse: ClickHouseService) {}

  @Process('OrderCreatedEvent')
  async handleOrderCreated(job: Job<OrderCreatedEvent>) {
    const event = job.data;
    const eventDate = new Date(event.createdAt);

    try {
      await this.clickhouse.insert('users_analytics', {
        event_date: eventDate.toISOString().split('T')[0],
        user_id: event.userId,
        orders_count: 1,
        total_amount: event.amount,
        promo_codes_used: event.promoCode ? 1 : 0,
      });

      this.logger.log(`User analytics updated: ${event.userId}`);
    } catch (error) {
      this.logger.error('Failed to update user analytics:', error);
      throw error;
    }
  }

  @Process('PromoCodeAppliedEvent')
  async handlePromoCodeApplied(job: Job<PromoCodeAppliedEvent>) {
    const event = job.data;
    const eventDate = new Date(event.createdAt);

    try {
      // Обновляем статистику использования промокодов
      await this.clickhouse.insert('users_analytics', {
        event_date: eventDate.toISOString().split('T')[0],
        user_id: event.userId,
        orders_count: 0,
        total_amount: 0,
        promo_codes_used: 1,
      });

      this.logger.log(`User promo code usage updated: ${event.userId}`);
    } catch (error) {
      this.logger.error('Failed to update user promo code usage:', error);
      throw error;
    }
  }
}
```

### 3. Controller

**`modules/analytics/api/analytics.controller.ts`**
```typescript
@Controller('analytics')
@ApiTags('Analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('promo-codes')
  @ApiPagination(PromoCodeAnalyticsDto)
  @ApiDateRange()
  @ApiOperation({ summary: 'Get promo codes analytics' })
  async getPromoCodesList(
    @Query() query: PromoCodeAnalyticsQueryDto,
  ): Promise<PaginatedResult<PromoCodeAnalyticsDto>> {
    return this.analyticsService.getPromoCodesList(query);
  }

  @Get('promo-codes/:id/stats')
  @ApiDateRange()
  @ApiOperation({ summary: 'Get promo code statistics' })
  async getPromoCodeStats(
    @Param('id') id: string,
    @Query() query: DateRangeQueryDto,
  ): Promise<PromoCodeStatsDto> {
    return this.analyticsService.getPromoCodeStats(
      id,
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('users')
  @ApiPagination(UserAnalyticsDto)
  @ApiDateRange()
  @ApiOperation({ summary: 'Get users analytics' })
  async getUsersList(
    @Query() query: UserAnalyticsQueryDto,
  ): Promise<PaginatedResult<UserAnalyticsDto>> {
    return this.analyticsService.getUsersList(query);
  }

  @Get('promo-code-usages')
  @ApiPagination(PromoCodeUsageHistoryDto)
  @ApiDateRange()
  @ApiOperation({ summary: 'Get promo code usage history' })
  async getPromoCodeUsageHistory(
    @Query() query: PromoCodeUsageHistoryQueryDto,
  ): Promise<PaginatedResult<PromoCodeUsageHistoryDto>> {
    return this.analyticsService.getPromoCodeUsageHistory(query);
  }
}
```

## Оптимизация запросов

- Использование партиционирования по дате
- Агрегация через SummingMergeTree для users_analytics
- Индексы через ORDER BY
- Кеширование часто запрашиваемых данных

## Тестирование

- Unit тесты для AnalyticsService
- Тесты consumers
- Интеграционные тесты с ClickHouse
- Тесты пагинации и фильтрации

## Зависимости

- `@clickhouse/client`
- `@nestjs/bull` (для consumers)
- `bull` или `bullmq`
