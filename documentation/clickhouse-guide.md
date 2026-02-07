# ClickHouse: Инициализация и Просмотр Данных

## Автоматическая Инициализация

ClickHouse инициализируется через **init-контейнер**, который:
1. Ждёт готовности ClickHouse
2. Создаёт базу данных `analytics`
3. Применяет миграции (создаёт таблицы)

### Как это работает

**Docker Compose:**
```yaml
clickhouse-init:
  image: curlimages/curl:latest
  depends_on:
    clickhouse:
      condition: service_healthy
  entrypoint: ["/bin/sh", "/schema/init-http.sh"]
  restart: "no"  # Запускается один раз
```

**Init-скрипт** (`clickhouse/init/init-http.sh`):
- Ждёт доступности ClickHouse через HTTP API
- Применяет SQL-миграции из `clickhouse/init/001-create-tables.sql`

### Запуск

```bash
# Запустить все контейнеры (включая init)
docker-compose up -d

# Проверить логи init-контейнера
docker logs promo_code_manager_clickhouse_init

# Проверить, что таблицы созданы
docker exec promo_code_manager_clickhouse clickhouse-client --database=analytics --query "SHOW TABLES"
```

### Важно

- ✅ Init-контейнер запускается **один раз** при первом старте
- ✅ Используется `IF NOT EXISTS` для идемпотентности
- ✅ Нет гонок — init ждёт готовности ClickHouse
- ✅ Можно версионировать миграции (001, 002, 003...)
- ⚠️ **Для применения изменений в init-скрипте нужно пересоздать контейнер:**
  ```bash
  docker-compose stop clickhouse-init
  docker-compose rm -f clickhouse-init
  docker-compose up -d clickhouse-init
  ```

## Просмотр Данных в ClickHouse

### 1. Через Docker CLI

**Подключиться к ClickHouse:**
```bash
docker exec -it promo_code_manager_clickhouse clickhouse-client --database=analytics
```

**Полезные команды:**
```sql
-- Показать все таблицы
SHOW TABLES;

-- Посмотреть структуру таблицы
DESCRIBE TABLE promo_code_usages_analytics;

-- Выбрать все данные из таблицы
SELECT * FROM promo_code_usages_analytics LIMIT 10;

-- Посчитать записи
SELECT COUNT(*) FROM promo_code_usages_analytics;

-- Выбрать данные за последние 7 дней
SELECT * FROM promo_code_usages_analytics 
WHERE event_date >= today() - 7
ORDER BY created_at DESC;

-- Статистика по промокодам
SELECT 
    promo_code,
    COUNT(*) as usage_count,
    SUM(discount_amount) as total_discount,
    SUM(order_amount) as total_orders
FROM promo_code_usages_analytics
GROUP BY promo_code
ORDER BY usage_count DESC;

-- Статистика по заказам
SELECT 
    event_date,
    COUNT(*) as orders_count,
    SUM(amount) as total_amount,
    COUNT(DISTINCT user_id) as unique_users
FROM orders_analytics
GROUP BY event_date
ORDER BY event_date DESC;

-- Статистика по пользователям
SELECT 
    user_id,
    SUM(orders_count) as total_orders,
    SUM(total_amount) as total_spent,
    SUM(promo_codes_used) as promo_codes_used
FROM users_analytics
GROUP BY user_id
ORDER BY total_spent DESC
LIMIT 10;
```

### 2. Через HTTP API

**Проверка подключения:**
```bash
curl http://localhost:8123/ping
```

**Выполнение запроса:**
```bash
curl -G 'http://localhost:8123/' \
  --data-urlencode "database=analytics" \
  --data-urlencode "query=SELECT COUNT(*) FROM promo_code_usages_analytics"
```

**Форматированный вывод (JSON):**
```bash
curl -G 'http://localhost:8123/' \
  --data-urlencode "database=analytics" \
  --data-urlencode "query=SELECT * FROM promo_code_usages_analytics LIMIT 5 FORMAT JSON"
```

### 3. Через ClickHouse Web UI (опционально)

Можно использовать внешние инструменты:
- **Tabix** (https://tabix.io/) — веб-интерфейс для ClickHouse
- **DBeaver** — универсальный SQL-клиент
- **DataGrip** — IDE от JetBrains

**Подключение:**
- Host: `localhost`
- Port: `8123` (HTTP) или `9000` (Native)
- Database: `analytics`
- User: `default` (без пароля для Docker)

### 4. Через NestJS Service

**В коде приложения:**
```typescript
import { ClickHouseService } from '@shared/database/clickhouse/clickhouse.service';

// В контроллере или сервисе
constructor(private readonly clickhouse: ClickHouseService) {}

// Получить данные
async getAnalytics() {
  const data = await this.clickhouse.query<{
    promo_code: string;
    usage_count: number;
  }>(`
    SELECT 
      promo_code,
      COUNT(*) as usage_count
    FROM promo_code_usages_analytics
    GROUP BY promo_code
  `);
  
  return data;
}
```

## Структура Таблиц

### promo_code_usages_analytics

История использований промокодов.

**Поля:**
- `event_date` (Date) — дата события
- `created_at` (DateTime) — точное время создания
- `promo_code` (String) — код промокода
- `promo_code_id` (String) — ID промокода
- `user_id` (String) — ID пользователя
- `order_id` (String) — ID заказа
- `order_amount` (Float64) — сумма заказа
- `discount_amount` (Float64) — сумма скидки

**Индексы:**
- `PARTITION BY toYYYYMM(event_date)` — партиционирование по месяцам
- `ORDER BY (promo_code_id, event_date)` — сортировка для быстрого поиска

### orders_analytics

Аналитика заказов.

**Поля:**
- `event_date` (Date) — дата заказа
- `created_at` (DateTime) — время создания
- `order_id` (String) — ID заказа
- `user_id` (String) — ID пользователя
- `amount` (Float64) — сумма заказа
- `promo_code` (String) — применённый промокод (если есть)

**Индексы:**
- `PARTITION BY toYYYYMM(event_date)`
- `ORDER BY (event_date, user_id)`

### users_analytics

Агрегированная статистика по пользователям.

**Поля:**
- `event_date` (Date) — дата
- `user_id` (String) — ID пользователя
- `orders_count` (UInt32) — количество заказов
- `total_amount` (Float64) — общая сумма
- `promo_codes_used` (UInt32) — использовано промокодов

**Движок:** `SummingMergeTree` — автоматически суммирует дубликаты

## Типичные Запросы

### Топ промокодов по использованию

```sql
SELECT 
    promo_code,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(discount_amount) as total_discount,
    AVG(discount_amount) as avg_discount
FROM promo_code_usages_analytics
GROUP BY promo_code
ORDER BY usage_count DESC
LIMIT 10;
```

### Статистика по дням

```sql
SELECT 
    event_date,
    COUNT(*) as events_count,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(order_amount) as total_revenue
FROM orders_analytics
WHERE event_date >= today() - 30
GROUP BY event_date
ORDER BY event_date DESC;
```

### Эффективность промокодов

```sql
SELECT 
    p.promo_code,
    COUNT(*) as times_used,
    SUM(p.discount_amount) as total_discount_given,
    SUM(o.amount) as total_revenue,
    SUM(p.discount_amount) / SUM(o.amount) * 100 as discount_percentage
FROM promo_code_usages_analytics p
JOIN orders_analytics o ON p.order_id = o.order_id
GROUP BY p.promo_code
ORDER BY total_revenue DESC;
```

## Отладка

### Проверить подключение

```bash
# Через Docker
docker exec promo_code_manager_clickhouse clickhouse-client --query "SELECT 1"

# Через HTTP
curl http://localhost:8123/ping
```

### Проверить логи

```bash
# Логи ClickHouse
docker logs promo_code_manager_clickhouse

# Логи init-контейнера
docker logs promo_code_manager_clickhouse_init
```

### Проверить таблицы

```bash
docker exec promo_code_manager_clickhouse clickhouse-client --database=analytics --query "SHOW TABLES"
```

### Очистить данные (⚠️ осторожно!)

```sql
-- Очистить таблицу (не удаляя структуру)
TRUNCATE TABLE promo_code_usages_analytics;
TRUNCATE TABLE orders_analytics;
TRUNCATE TABLE users_analytics;
```

## Проблемы и Решения

### Таблицы не создаются

1. Проверить логи init-контейнера:
   ```bash
   docker logs promo_code_manager_clickhouse_init
   ```

2. Пересоздать init-контейнер:
   ```bash
   docker-compose rm -f clickhouse-init
   docker-compose up clickhouse-init
   ```

3. Применить миграции вручную:
   ```bash
   docker exec -i promo_code_manager_clickhouse clickhouse-client --database=analytics < clickhouse/init/001-create-tables.sql
   ```

### Ошибка подключения

1. Проверить, что ClickHouse запущен:
   ```bash
   docker ps | grep clickhouse
   ```

2. Проверить healthcheck:
   ```bash
   docker inspect promo_code_manager_clickhouse | grep -A 10 Health
   ```

3. Проверить порты:
   ```bash
   netstat -an | grep 8123
   ```

### Данные не записываются

1. Проверить, что EventBus работает:
   ```bash
   # Проверить Redis очередь
   docker exec promo_code_manager_redis redis-cli LLEN bull:events:waiting
   ```

2. Проверить логи Consumer'ов в приложении

3. Проверить, что таблицы существуют:
   ```sql
   SHOW TABLES;
   ```
