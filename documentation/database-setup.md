# Database Setup Documentation

## Обзор

Настроены базы данных для проекта: MongoDB (OLTP) и ClickHouse (OLAP). Используется Mongoose ODM для MongoDB с production-стандартной архитектурой и нативный клиент для ClickHouse.

## Быстрый старт

### 1. Запуск баз данных через Docker Compose

```bash
cd project/backend
docker-compose up -d
```

Проверка статуса:
```bash
docker-compose ps
```

Остановка:
```bash
docker-compose down
```

### 2. Подключение к MongoDB через Compass

1. Установите [MongoDB Compass](https://www.mongodb.com/try/download/compass) (если еще не установлен)
2. Откройте MongoDB Compass
3. Вставьте connection string:
   ```
   mongodb://admin:admin123@localhost:27017/promo_code_manager?authSource=admin
   ```
4. Нажмите "Connect"

**Реквизиты для подключения:**
- **Host:** `localhost`
- **Port:** `27017`
- **Username:** `admin`
- **Password:** `admin123`
- **Database:** `promo_code_manager`
- **Auth Source:** `admin`

### 3. Настройка окружения

Скопируйте `env.example` в `.env`:

```bash
cd project/backend
cp env.example .env
```

Файл `.env` уже содержит правильные настройки для локального MongoDB.

### 4. Запуск приложения

```bash
cd project/backend
pnpm install
pnpm start:dev
```

## Архитектура

### Production-стандарт с Mongoose

Проект использует production-стандартную архитектуру:

- ✅ **Domain Entities** - чистая бизнес-логика, без зависимостей от Mongoose
- ✅ **Mongoose Schemas** - только для работы с БД
- ✅ **Маппинг Document -> Entity** - всегда возвращаем Entity, никогда Document
- ✅ **Repositories** - абстракция над Mongoose, скрывает детали реализации

Подробнее: [Mongoose Architecture](./mongoose-architecture.md)

## Структура

### Docker Compose

Создан `docker-compose.yml` с тремя сервисами:

- **MongoDB** (порт 27017) - основная транзакционная БД
- **ClickHouse** (порты 8123, 9000) - аналитическая БД
- **Redis** (порт 6379) - для EventBus

Все сервисы настроены с health checks и персистентными volumes.

### Mongoose Setup

#### Domain Entities
Созданы domain entities (чистая бизнес-логика):

- **User** - пользователи системы
- **PromoCode** - промокоды
- **Order** - заказы
- **PromoCodeUsage** - история использований промокодов

#### Mongoose Schemas
Созданы Mongoose схемы с маппингом в Entity:

- Всегда возвращаем Entity, никогда Document
- Мапперы для преобразования Document -> Entity
- Индексы для оптимизации запросов

#### Repositories
Созданы репозитории с маппингом:

- `BaseRepository` - базовый репозиторий с маппингом
- `UserRepository` - репозиторий для пользователей
- `PromoCodeRepository` - репозиторий для промокодов

#### Модули
- `MongoModule` - глобальный модуль для Mongoose
- `MongoService` - сервис для работы с MongoDB

### ClickHouse Setup

#### Модули
- `ClickHouseModule` - глобальный модуль для ClickHouse
- `ClickHouseService` - сервис для работы с ClickHouse
- `ClickHouseMigrationService` - автоматическая инициализация таблиц

#### Таблицы
- `promo_code_usages_analytics` - аналитика использований промокодов
- `orders_analytics` - аналитика заказов
- `users_analytics` - агрегированная статистика пользователей

## Структура файлов

```
project/backend/
├── docker-compose.yml
├── env.example
├── src/
│   ├── modules/
│   │   └── shared/
│   │       └── database/
│   │           ├── entities/          # Domain Entities
│   │           ├── schemas/           # Mongoose Schemas
│   │           ├── repositories/      # Repositories
│   │           ├── mongo/             # Mongoose модуль
│   │           ├── clickhouse/        # ClickHouse модуль
│   │           └── interfaces/
│   └── app.module.ts
```

## Ссылки на планы

- [07-backend-db.md](./plan/07-backend-db.md) - Архитектура БД
- [08-backend-mongo.md](./plan/08-backend-mongo.md) - Настройка MongoDB
- [09-backend-clickhouse.md](./plan/09-backend-clickhouse.md) - Настройка ClickHouse
