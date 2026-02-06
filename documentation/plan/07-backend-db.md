# Backend: Database Architecture

## Назначение

Архитектура работы с базами данных: MongoDB (OLTP) и ClickHouse (OLAP). Разделение ответственности и синхронизация данных.

## Архитектурные принципы

### Двухуровневая архитектура

1. **MongoDB (OLTP)** — источник истины
   - Транзакционные операции
   - CRUD операции
   - Валидация данных
   - Нормализованная модель

2. **ClickHouse (OLAP)** — аналитика
   - Агрегация данных
   - Аналитические запросы
   - Денормализованная модель
   - Только INSERT (append-only)

### Event-Driven синхронизация

```
MongoDB (Write) 
    ↓
Application Service (Business Logic)
    ↓
Event Bus (Redis/BullMQ)
    ↓
ClickHouse Consumer
    ↓
ClickHouse (Analytics)
```

## Структура

```
src/
├── modules/
│   ├── shared/
│   │   ├── database/
│   │   │   ├── mongo/
│   │   │   │   ├── mongo.module.ts
│   │   │   │   └── mongo.service.ts
│   │   │   ├── clickhouse/
│   │   │   │   ├── clickhouse.module.ts
│   │   │   │   └── clickhouse.service.ts
│   │   │   └── interfaces/
│   │   │       ├── database.interface.ts
│   │   │       └── repository.interface.ts
```

## Интерфейсы

### Database Interface

**`modules/shared/database/interfaces/database.interface.ts`**
```typescript
export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
```

### Repository Interface

**`modules/shared/database/interfaces/repository.interface.ts`**
```typescript
export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: any): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
```

## Модель данных

### MongoDB Collections

1. **users**
   - Базовая информация пользователей
   - Пароли (хешированные)
   - Статус активности

2. **promo_codes**
   - Коды промокодов
   - Лимиты использования
   - Статус активности

3. **orders**
   - Заказы пользователей
   - Применённые промокоды
   - Суммы заказов

4. **promo_code_usages**
   - История использований
   - Связь с заказами
   - Рассчитанные скидки

### ClickHouse Tables

1. **promo_code_usages_analytics**
   - Денормализованные данные использований
   - Партиционирование по дате

2. **orders_analytics**
   - Денормализованные данные заказов
   - Партиционирование по дате

3. **users_analytics**
   - Агрегированная статистика пользователей
   - SummingMergeTree для агрегации

## Синхронизация данных

### Event-Based подход

1. **Доменные события** публикуются из Application Service
2. **Event Bus** (Redis/BullMQ) обрабатывает события асинхронно
3. **Consumers** записывают данные в ClickHouse

### Преимущества

- Асинхронность — не блокирует основную БД
- Отказоустойчивость — можно повторить обработку
- Масштабируемость — можно добавить другие consumers
- Разделение ответственности — OLTP и OLAP разделены

## Транзакции

### MongoDB транзакции

Используются для:
- Создания заказа с применением промокода
- Обновления лимитов промокода
- Создания записи использования

```typescript
const session = await this.connection.startSession();
try {
  await session.withTransaction(async () => {
    // Операции в транзакции
  });
} finally {
  await session.endSession();
}
```

### ClickHouse

- Не поддерживает транзакции
- Append-only модель
- Используется для аналитики (не для критичных операций)

## Миграции

### MongoDB

- Используется Mongoose для схем
- Миграции через скрипты или библиотеки (migrate-mongo)

### ClickHouse

- SQL миграции
- Автоматическая инициализация таблиц при старте
- Версионирование схем

## Индексы

### MongoDB

- Индексы на часто используемых полях
- Уникальные индексы (email, promo code)
- Составные индексы для запросов

### ClickHouse

- ORDER BY определяет первичный ключ
- Партиционирование по дате
- Оптимизация под аналитические запросы

## Конфигурация

**`.env`**
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/promo_code_manager
MONGODB_DB_NAME=promo_code_manager

# ClickHouse
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=analytics
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=

# Redis (для EventBus)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Health Checks

Проверка подключения к БД:

```typescript
@Get('health')
async healthCheck() {
  return {
    mongo: await this.mongoService.isConnected(),
    clickhouse: await this.clickhouseService.isConnected(),
    redis: await this.redisService.isConnected(),
  };
}
```

## Резервное копирование

### MongoDB

- Регулярные бэкапы через mongodump
- Репликация для высокой доступности

### ClickHouse

- Бэкапы через clickhouse-backup
- Можно пересоздать из событий (event sourcing)

## Мониторинг

- Метрики подключений
- Время выполнения запросов
- Количество операций
- Размер БД

## Тестирование

- Unit тесты для репозиториев
- Интеграционные тесты с тестовыми БД
- Тесты синхронизации данных

## Зависимости

- `@nestjs/mongoose`
- `mongoose`
- `@clickhouse/client`
- `ioredis` или `bullmq`
