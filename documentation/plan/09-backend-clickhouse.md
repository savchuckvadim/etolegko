# Backend: ClickHouse Setup

## Назначение

Настройка ClickHouse как аналитической БД для хранения денормализованных данных и выполнения аналитических запросов.

## Структура

```
src/
├── modules/
│   ├── shared/
│   │   ├── database/
│   │   │   ├── clickhouse/
│   │   │   │   ├── clickhouse.module.ts
│   │   │   │   ├── clickhouse.service.ts
│   │   │   │   └── clickhouse.config.ts
│   │   │   └── migrations/
│   │   │       ├── 001-create-tables.sql
│   │   │       └── migration.service.ts
```

## Реализация

### 1. ClickHouse Module

**`modules/shared/database/clickhouse/clickhouse.module.ts`**
```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClickHouseService } from './clickhouse.service';
import { ClickHouseMigrationService } from './migration.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ClickHouseService, ClickHouseMigrationService],
  exports: [ClickHouseService],
})
export class ClickHouseModule {
  constructor(
    private readonly migrationService: ClickHouseMigrationService,
  ) {}

  async onModuleInit() {
    // Автоматическая инициализация таблиц
    await this.migrationService.runMigrations();
  }
}
```

### 2. ClickHouse Service

**`modules/shared/database/clickhouse/clickhouse.service.ts`**
```typescript
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class ClickHouseService implements OnModuleInit {
  private readonly logger = new Logger(ClickHouseService.name);
  private client: ClickHouseClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      host: this.configService.get<string>('CLICKHOUSE_HOST'),
      port: parseInt(this.configService.get<string>('CLICKHOUSE_PORT') || '8123'),
      database: this.configService.get<string>('CLICKHOUSE_DATABASE'),
      username: this.configService.get<string>('CLICKHOUSE_USER', 'default'),
      password: this.configService.get<string>('CLICKHOUSE_PASSWORD', ''),
    });

    // Проверка подключения
    await this.ping();
    this.logger.log('ClickHouse connected');
  }

  async ping(): Promise<void> {
    await this.client.ping();
  }

  async insert(table: string, data: Record<string, any> | Record<string, any>[]): Promise<void> {
    const rows = Array.isArray(data) ? data : [data];
    
    await this.client.insert({
      table,
      values: rows,
      format: 'JSONEachRow',
    });
  }

  async query<T = any>(query: string, params?: Record<string, any>): Promise<T[]> {
    const result = await this.client.query({
      query,
      query_params: params,
      format: 'JSONEachRow',
    });

    const data = await result.json<T>();
    return data as T[];
  }

  async execute(query: string): Promise<void> {
    await this.client.exec({
      query,
    });
  }

  isConnected(): boolean {
    return !!this.client;
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
```

### 3. Таблицы ClickHouse

**`modules/shared/database/clickhouse/migrations/001-create-tables.sql`**

#### promo_code_usages_analytics

```sql
CREATE TABLE IF NOT EXISTS promo_code_usages_analytics (
  event_date Date,
  created_at DateTime,
  
  promo_code String,
  promo_code_id String,
  
  user_id String,
  order_id String,
  
  order_amount Float64,
  discount_amount Float64
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (promo_code_id, event_date)
SETTINGS index_granularity = 8192;
```

#### orders_analytics

```sql
CREATE TABLE IF NOT EXISTS orders_analytics (
  event_date Date,
  created_at DateTime,
  
  order_id String,
  user_id String,
  
  amount Float64,
  promo_code String
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, user_id)
SETTINGS index_granularity = 8192;
```

#### users_analytics

```sql
CREATE TABLE IF NOT EXISTS users_analytics (
  event_date Date,
  user_id String,
  
  orders_count UInt32,
  total_amount Float64,
  promo_codes_used UInt32
)
ENGINE = SummingMergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (user_id, event_date)
SETTINGS index_granularity = 8192;
```

### 4. Migration Service

**`modules/shared/database/clickhouse/migration.service.ts`**
```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ClickHouseService } from './clickhouse.service';

@Injectable()
export class ClickHouseMigrationService implements OnModuleInit {
  private readonly logger = new Logger(ClickHouseMigrationService.name);
  private readonly migrationsPath = join(__dirname, 'migrations');

  constructor(private readonly clickhouseService: ClickHouseService) {}

  async onModuleInit() {
    await this.runMigrations();
  }

  async runMigrations(): Promise<void> {
    try {
      const files = readdirSync(this.migrationsPath)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of files) {
        this.logger.log(`Running migration: ${file}`);
        const sql = readFileSync(join(this.migrationsPath, file), 'utf-8');
        await this.clickhouseService.execute(sql);
        this.logger.log(`Migration completed: ${file}`);
      }
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }
}
```

### 5. Использование в Consumers

**`modules/analytics/consumers/promo-code-analytics.consumer.ts`**
```typescript
import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ClickHouseService } from '../../shared/database/clickhouse/clickhouse.service';
import { PromoCodeAppliedEvent } from '../../promo-codes/application/events/promo-code-applied.event';

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
        event_date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD
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

### 6. Аналитические запросы

**`modules/analytics/analytics.service.ts`**
```typescript
@Injectable()
export class AnalyticsService {
  constructor(private readonly clickhouse: ClickHouseService) {}

  async getPromoCodeStats(
    promoCodeId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<PromoCodeStats> {
    const query = `
      SELECT
        count() as usage_count,
        sum(discount_amount) as total_discount,
        sum(order_amount) as total_revenue,
        uniq(user_id) as unique_users
      FROM promo_code_usages_analytics
      WHERE promo_code_id = {promoCodeId:String}
        AND event_date >= {dateFrom:Date}
        AND event_date <= {dateTo:Date}
    `;

    const result = await this.clickhouse.query<PromoCodeStats>(query, {
      promoCodeId,
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
    });

    return result[0] || {
      usage_count: 0,
      total_discount: 0,
      total_revenue: 0,
      unique_users: 0,
    };
  }

  async getUserStats(
    userId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<UserStats> {
    const query = `
      SELECT
        sum(orders_count) as orders_count,
        sum(total_amount) as total_amount,
        sum(promo_codes_used) as promo_codes_used
      FROM users_analytics
      WHERE user_id = {userId:String}
        AND event_date >= {dateFrom:Date}
        AND event_date <= {dateTo:Date}
    `;

    const result = await this.clickhouse.query<UserStats>(query, {
      userId,
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
    });

    return result[0] || {
      orders_count: 0,
      total_amount: 0,
      promo_codes_used: 0,
    };
  }
}
```

## Оптимизация запросов

### Партиционирование

- Партиционирование по месяцу (`toYYYYMM(event_date)`)
- Ускоряет запросы по диапазону дат
- Упрощает удаление старых данных

### ORDER BY

- Определяет первичный ключ
- Оптимизирует запросы с фильтрами по этим полям

### Индексы

ClickHouse автоматически создаёт индексы на основе ORDER BY. Дополнительные индексы не нужны.

## Конфигурация

**`.env`**
```env
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=analytics
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```

## Health Check

```typescript
@Get('health/clickhouse')
async clickhouseHealth() {
  try {
    await this.clickhouseService.ping();
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

## Тестирование

- Unit тесты для ClickHouseService
- Интеграционные тесты с тестовым ClickHouse
- Тесты миграций
- Тесты аналитических запросов

## Зависимости

- `@clickhouse/client`
