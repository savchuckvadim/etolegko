# Backend: Docker Compose Configuration

## Назначение

Docker Compose конфигурация для запуска всех сервисов: MongoDB, ClickHouse, Redis.

## Структура

```
docker-compose.yml
.env.example
```

## Реализация

### docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: promo_code_mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: promo_code_manager
    volumes:
      - mongodb_data:/data/db
    networks:
      - promo_code_network

  clickhouse:
    image: clickhouse/clickhouse-server:latest
    container_name: promo_code_clickhouse
    ports:
      - "8123:8123"
      - "9000:9000"
    environment:
      CLICKHOUSE_DB: analytics
      CLICKHOUSE_USER: default
      CLICKHOUSE_PASSWORD: ""
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    networks:
      - promo_code_network

  redis:
    image: redis:7-alpine
    container_name: promo_code_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - promo_code_network

volumes:
  mongodb_data:
  clickhouse_data:
  redis_data:

networks:
  promo_code_network:
    driver: bridge
```

### .env.example

```env
# MongoDB
MONGODB_URI=mongodb://mongodb:27017/promo_code_manager
MONGODB_DB_NAME=promo_code_manager

# ClickHouse
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=analytics
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
```

## Команды

```bash
# Запуск всех сервисов
docker-compose up -d

# Остановка
docker-compose down

# Просмотр логов
docker-compose logs -f

# Пересоздание
docker-compose up -d --force-recreate
```
