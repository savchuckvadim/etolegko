# Общий план реализации проекта PromoCode Manager

## Описание проекта

Fullstack приложение для управления промокодами с аналитикой. Использует двухуровневую архитектуру данных:
- **MongoDB** — источник истины для CRUD операций
- **ClickHouse** — аналитическая БД для отчётов и таблиц
- **Redis** — EventBus для асинхронной синхронизации данных

## Технический стек

### Backend
- NestJS, TypeScript
- Mongoose (MongoDB)
- @clickhouse/client
- BullMQ (Redis) для EventBus
- Passport.js для аутентификации
- JWT токены

### Frontend
- Next.js, TypeScript
- Shadcn/ui компоненты
- Orval для генерации API клиента
- Material React Table для аналитических таблиц
- React Hook Form для форм

### Инфраструктура
- Docker Compose
- MongoDB
- ClickHouse
- Redis

## Архитектурные принципы

### Event-Driven Architecture
- Доменные события публикуются из Application Service
- События обрабатываются асинхронно через Redis EventBus
- ClickHouse обновляется через consumers событий

### Слоистая архитектура модулей
```
module/
├── api/          # DTO, Controllers
├── application/  # Services, Events, Interfaces
├── domain/       # Entities, Value Objects, Constants
└── infrastructure/ # Schemas, Repositories, External clients
```

### Разделение типов
- **DTO** — только в api/ (вход/выход HTTP)
- **Entity** — в domain/ (бизнес-логика)
- **ReadModel** — в application/ (форма для чтения)
- **Schema** — в infrastructure/ (персистентность)

## Структура плана

### Backend планы
1. `01-backend-filters.md` — Exception filters, Validation filters
2. `02-backend-interceptors.md` — Logging, Transform interceptors
3. `03-backend-auth.md` — JWT стратегия, регистрация, вход
4. `04-backend-passport.md` — Passport конфигурация
5. `05-backend-decorators.md` — Custom decorators (User, Roles)
6. `06-backend-guards.md` — Auth guards, Role guards
7. `07-backend-db.md` — Общая архитектура БД
8. `08-backend-mongo.md` — MongoDB подключение, схемы
9. `09-backend-clickhouse.md` — ClickHouse подключение, таблицы
10. `10-backend-module-users.md` — Модуль Users
11. `11-backend-module-promocodes.md` — Модуль PromoCodes
12. `12-backend-module-orders.md` — Модуль Orders
13. `13-backend-module-analytics.md` — Модуль Analytics
14. `14-backend-pagination.md` — Пагинация, сортировка, фильтрация
15. `15-backend-tests.md` — Unit и E2E тесты
16. `16-backend-docker.md` — Docker Compose конфигурация

### Frontend планы
17. `17-frontend-next.md` — Next.js настройка, структура
18. `18-frontend-shadcn.md` — Shadcn/ui компоненты
19. `19-frontend-orval.md` — Orval конфигурация, API клиент
20. `20-frontend-modules.md` — Frontend модули (Auth, PromoCodes, Analytics)
21. `21-frontend-tests.md` — Frontend тесты

## Порядок реализации

### Этап 1: Инфраструктура
1. Docker Compose настройка
2. MongoDB подключение и схемы
3. ClickHouse подключение и таблицы
4. Redis настройка

### Этап 2: Backend Core
1. Exception filters
2. Interceptors
3. Auth система (Passport, JWT)
4. Guards и Decorators

### Этап 3: Backend Модули
1. Users модуль
2. PromoCodes модуль
3. Orders модуль
4. Analytics модуль
5. EventBus и Consumers

### Этап 4: Frontend
1. Next.js настройка
2. Orval интеграция
3. Shadcn/ui компоненты
4. Модули (Auth, CRUD, Analytics)

### Этап 5: Тестирование
1. Backend тесты
2. Frontend тесты
3. E2E тесты

## Ключевые требования

### Функциональность
- ✅ Регистрация и авторизация (JWT)
- ✅ CRUD для Users и PromoCodes
- ✅ Применение промокодов с валидацией
- ✅ Аналитические таблицы из ClickHouse
- ✅ Server-side пагинация, сортировка, фильтрация
- ✅ Глобальный фильтр по диапазону дат

### Технические требования
- ✅ Event-driven синхронизация MongoDB → ClickHouse
- ✅ Строгая типизация TypeScript
- ✅ Валидация DTO
- ✅ Обработка ошибок
- ✅ Swagger документация
- ✅ Обработка race conditions при применении промокода

## Бонусные задачи
- Unit тесты
- Оптимистичный UI
- Автоматическая инициализация ClickHouse таблиц
