# План реализации проекта PromoCode Manager

Этот план содержит детальное описание реализации всех компонентов проекта.

## Структура плана

### Общий обзор
- `00-overview.md` - общий план и архитектура проекта

### Backend

#### Инфраструктура
- `01-backend-filters.md` - Exception filters
- `02-backend-interceptors.md` - Interceptors (logging, transform)
- `03-backend-auth.md` - Система аутентификации
- `04-backend-passport.md` - Passport конфигурация
- `05-backend-decorators.md` - Custom decorators
- `06-backend-guards.md` - Guards (auth, roles)
- `07-backend-db.md` - Архитектура БД
- `08-backend-mongo.md` - MongoDB настройка
- `09-backend-clickhouse.md` - ClickHouse настройка
- `22-event-bus.md` - Event Bus реализация

#### Модули
- `10-backend-module-users.md` - Модуль Users
- `11-backend-module-promocodes.md` - Модуль PromoCodes
- `12-backend-module-orders.md` - Модуль Orders
- `13-backend-module-analytics.md` - Модуль Analytics

#### Утилиты
- `14-backend-pagination.md` - Пагинация, сортировка, фильтрация
- `15-backend-tests.md` - Стратегия тестирования
- `16-backend-docker.md` - Docker Compose
- `23-backend-swagger.md` - Swagger документация

### Frontend
- `17-frontend-next.md` - Next.js настройка
- `18-frontend-shadcn.md` - Shadcn/ui компоненты
- `19-frontend-orval.md` - Orval конфигурация
- `20-frontend-modules.md` - Frontend модули
- `21-frontend-tests.md` - Frontend тесты

## Порядок реализации

1. **Инфраструктура** (Docker, БД)
2. **Backend Core** (filters, interceptors, auth)
3. **Backend Модули** (Users, PromoCodes, Orders, Analytics)
4. **Event Bus** (синхронизация данных)
5. **Frontend** (Next.js, компоненты, интеграция)

## Ключевые принципы

- Event-driven архитектура для синхронизации данных
- Разделение слоёв: api, application, domain, infrastructure
- Строгая типизация TypeScript
- Server-side пагинация для аналитики
- Двухуровневая архитектура БД (MongoDB + ClickHouse)
