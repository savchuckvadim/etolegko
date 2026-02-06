# Project Documentation

Документация по проекту Promo Code Manager.

## Структура документации

### Backend

#### Базы данных
- [Database Setup](./database-setup.md) - Настройка баз данных (MongoDB, ClickHouse, Redis)
  - Docker Compose конфигурация
  - Mongoose setup для MongoDB
  - ClickHouse модуль и миграции
  - Инструкции по запуску и подключению
- [Mongoose Architecture](./mongoose-architecture.md) - Production-стандартная архитектура с Mongoose

## Планы разработки

Все планы разработки находятся в папке `plan/`:

### Backend
- [00-overview.md](./plan/00-overview.md) - Обзор проекта
- [07-backend-db.md](./plan/07-backend-db.md) - Архитектура баз данных
- [08-backend-mongo.md](./plan/08-backend-mongo.md) - Настройка MongoDB
- [09-backend-clickhouse.md](./plan/09-backend-clickhouse.md) - Настройка ClickHouse
- [10-backend-module-users.md](./plan/10-backend-module-users.md) - Модуль пользователей
- [11-backend-module-promocodes.md](./plan/11-backend-module-promocodes.md) - Модуль промокодов
- [12-backend-module-orders.md](./plan/12-backend-module-orders.md) - Модуль заказов
- [13-backend-module-analytics.md](./plan/13-backend-module-analytics.md) - Модуль аналитики
- [22-event-bus.md](./plan/22-event-bus.md) - Event Bus для синхронизации данных

### Frontend
- [17-frontend-next.md](./plan/17-frontend-next.md) - Next.js настройка
- [18-frontend-shadcn.md](./plan/18-frontend-shadcn.md) - Shadcn UI
- [19-frontend-orval.md](./plan/19-frontend-orval.md) - Orval для API клиента
- [20-frontend-modules.md](./plan/20-frontend-modules.md) - Модули фронтенда

## Быстрый старт

### 1. Запуск баз данных

```bash
cd project/backend
docker-compose up -d
```

### 2. Подключение к MongoDB через Compass

1. Откройте MongoDB Compass
2. Вставьте connection string:
   ```
   mongodb://admin:admin123@localhost:27017/promo_code_manager?authSource=admin
   ```
3. Нажмите "Connect"

### 3. Настройка окружения

Скопируйте `env.example` в `.env`:

```bash
cd project/backend
cp env.example .env
```

### 4. Запуск приложения

```bash
cd project/backend
pnpm install
pnpm start:dev
```

## Технологии

### Backend
- **NestJS** - фреймворк
- **Mongoose** - ODM для MongoDB
- **ClickHouse** - аналитическая БД
- **Redis** - EventBus и кеширование
- **MongoDB** - транзакционная БД

### Frontend
- **Next.js** - React фреймворк
- **Shadcn UI** - UI компоненты
- **Orval** - генерация API клиента

## Статус реализации

### ✅ Выполнено
- [x] Настройка баз данных (MongoDB, ClickHouse, Redis)
- [x] Docker Compose конфигурация
- [x] Mongoose схемы, entities и репозитории
- [x] ClickHouse модуль и миграции
- [x] Production-стандартная архитектура
- [x] Модуль пользователей (Users Module)
- [x] Модуль аутентификации (Auth Module)
  - [x] Регистрация пользователей
  - [x] Вход пользователей (JWT + Local Strategy)
  - [x] Обновление токенов
  - [x] Получение текущего пользователя
  - [x] Guards и декораторы для защиты роутов
- [x] Swagger документация
- [x] Response Interceptor и Exception Filter
- [x] Кастомные декораторы для валидации и документации

### 🚧 В процессе
- [ ] Репозитории для работы с моделями (Order, PromoCodeUsage)
- [ ] EventBus для синхронизации данных

### 📋 Запланировано
- [ ] Модуль промокодов
- [ ] Модуль заказов
- [ ] Модуль аналитики
- [ ] Frontend модули
- [ ] E2E тестирование

## Контакты

Для вопросов и предложений обращайтесь к команде разработки.
