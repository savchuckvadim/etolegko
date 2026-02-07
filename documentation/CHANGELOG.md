# Changelog - Database Setup

## Выполнено

### 1. Docker Compose конфигурация
- ✅ Создан `docker-compose.yml` для запуска MongoDB, ClickHouse и Redis
- ✅ Настроены health checks и персистентные volumes
- ✅ Все сервисы доступны на стандартных портах

### 2. Mongoose ODM с Production-архитектурой
- ✅ Настроен MongooseModule для подключения к MongoDB
- ✅ Созданы Domain Entities (User, PromoCode, Order, PromoCodeUsage)
- ✅ Созданы Mongoose Schemas с маппингом в Entity
- ✅ Созданы Repositories (BaseRepository, UserRepository, PromoCodeRepository)
- ✅ Всегда возвращаем Entity, никогда Document
- ✅ Строгая типизация TypeScript

### 3. ClickHouse Setup
- ✅ Настроен ClickHouseModule и ClickHouseService
- ✅ Создан ClickHouseMigrationService для ручного запуска миграций
- ✅ Созданы SQL миграции для аналитических таблиц
- ✅ Клиент инициализируется без блокирующих проверок подключения
- ✅ Миграции отключены автоматически (можно запустить вручную)

### 4. Users Module
- ✅ Создан модуль users с полной архитектурой (api, application, domain, infrastructure)
- ✅ Настроены TypeScript path aliases (@shared, @common, @users)
- ✅ User-специфичные файлы перенесены из shared/database в модуль users
- ✅ Созданы тесты (unit, e2e)
- ✅ Добавлен метод `findByEmailForAuth` для получения пользователя с паролем для аутентификации

### 5. Auth Module
- ✅ Создан модуль auth с полной архитектурой (api, application, domain, infrastructure)
- ✅ Реализована регистрация пользователей (POST /auth/register)
- ✅ Реализован вход пользователей (POST /auth/login) с Local Strategy
- ✅ Реализовано обновление токена (POST /auth/refresh)
- ✅ Реализовано получение текущего пользователя (GET /auth/me)
- ✅ Настроен JWT модуль с конфигурацией из переменных окружения
- ✅ Созданы Passport стратегии (JWT Strategy, Local Strategy)
- ✅ Созданы Guards (JwtAuthGuard, LocalAuthGuard)
- ✅ Созданы декораторы (@Public, @JwtAuth, @CurrentUser)
- ✅ Реализована генерация access и refresh токенов
- ✅ Добавлена валидация JWT payload
- ✅ Настроена Swagger документация для всех эндпоинтов
- ✅ Настроены TypeScript path aliases (@auth)

### 6. Common Decorators and Utilities
- ✅ Создан кастомный декоратор `@IsEmailWithLowerCase` для автоматического приведения email к нижнему регистру
- ✅ Созданы декораторы для Swagger документации (@ApiSuccessResponseDecorator, @ApiPaginatedResponse, @ApiErrorResponse)
- ✅ Создан ResponseInterceptor для обертки всех ответов в { result: ... }
- ✅ Создан GlobalExceptionFilter для обработки ошибок
- ✅ Настроена структура ответов API (успешные ответы и ошибки)

### 7. Code Quality
- ✅ Настроен Prettier с автоматической сортировкой импортов
- ✅ Настроен ESLint с удалением неиспользуемых импортов
- ✅ Исправлены все ошибки линтера
- ✅ Настроено форматирование через Shift+Alt+F и `pnpm format`

### 8. Конфигурация
- ✅ Создан `env.example` с настройками для локального MongoDB
- ✅ Настроен ConfigModule для работы с переменными окружения
- ✅ Добавлены переменные окружения для JWT (JWT_SECRET, JWT_ACCESS_TOKEN_EXPIRES_IN, JWT_REFRESH_TOKEN_EXPIRES_IN, JWT_REFRESH_SECRET)
- ✅ Обновлен AppModule для подключения всех модулей БД

### 9. Документация
- ✅ Создана документация по настройке БД
- ✅ Создана документация по Mongoose архитектуре
- ✅ Добавлены инструкции по запуску Docker и подключению к Compass
- ✅ Добавлены инструкции по проверке ClickHouse

### 10. Promo Codes Module
- ✅ Создан модуль promo-codes с полной архитектурой (api, application, domain, infrastructure)
- ✅ Реализованы CRUD операции для промокодов
- ✅ Реализовано применение промокодов к заказам (POST /promo-codes/apply)
- ✅ Создана Domain Entity PromoCode с бизнес-логикой (validateUsage, calculateDiscount, incrementUsage)
- ✅ Реализована валидация использования промокодов:
  - Проверка активности промокода
  - Проверка общего лимита использований
  - Проверка лимита использований на пользователя
  - Проверка сроков действия (startsAt, endsAt)
- ✅ Создан Use Case `ApplyPromoCodeUseCase` для координации бизнес-логики и публикации событий
- ✅ Реализована Event-Driven архитектура:
  - EventBus через Redis/Bull для асинхронной обработки событий
  - Consumer `PromoCodeAnalyticsConsumer` для записи аналитики в ClickHouse
  - Событие `PromoCodeAppliedEvent` при применении промокода
- ✅ Настроена Swagger документация для всех эндпоинтов
- ✅ Настроены TypeScript path aliases (@promo-codes)
- ✅ Созданы тесты для всех компонентов:
  - Unit тесты для сервиса (19 тестов)
  - Unit тесты для контроллера (6 тестов)
  - Unit тесты для use case (5 тестов)
  - Unit тесты для consumer (11 тестов)
- ✅ Все тесты проходят успешно (41 тест)
- ✅ Исправлены все ошибки ESLint и TypeScript

### 11. Event Bus & Queue System
- ✅ Реализован EventBus через Redis/Bull для асинхронной обработки событий
- ✅ Создан интерфейс `EventBus` для абстракции публикации событий
- ✅ Реализован `RedisEventBus` с настройками очереди:
  - Повторные попытки (3 attempts)
  - Exponential backoff (2 секунды)
  - Ограничение хранения завершенных/неудачных задач
- ✅ Настроен `EventBusModule` с интеграцией Bull/Redis
- ✅ Реализован Consumer для обработки событий применения промокодов
- ✅ Автоматическая запись аналитики в ClickHouse через очередь
- ✅ Обработка ошибок с логированием и повторными попытками
- ✅ Создана документация по системе Event Bus & Queue

## Структура

```
project/backend/
├── docker-compose.yml          # Конфигурация для запуска БД
├── env.example                  # Пример конфигурации
├── .prettierrc                  # Настройки Prettier с сортировкой импортов
├── .prettierignore              # Игнорируемые файлы
├── .vscode/settings.json        # Настройки VS Code для форматирования
├── src/
│   ├── modules/
│   │   ├── shared/database/    # Core БД функциональность
│   │   │   ├── entities/       # Domain Entities (Order, PromoCode, PromoCodeUsage)
│   │   │   ├── schemas/        # Mongoose Schemas
│   │   │   ├── repositories/   # Repositories (BaseRepository, PromoCodeRepository)
│   │   │   ├── mongo/          # Mongoose модуль
│   │   │   └── clickhouse/     # ClickHouse модуль
│   │   ├── users/               # Модуль пользователей
│   │   │   ├── api/            # Контроллеры и DTO
│   │   │   ├── application/    # Бизнес-логика и сервисы
│   │   │   ├── domain/         # Доменные сущности и константы
│   │   │   ├── infrastructure/ # Репозитории и схемы
│   │   │   └── __tests__/      # Тесты
│   │   ├── auth/                # Модуль аутентификации
│   │   │   ├── api/            # Контроллеры и DTO
│   │   │   ├── application/    # Бизнес-логика и сервисы
│   │   │   ├── domain/         # Интерфейсы (JWT payload)
│   │   │   └── infrastructure/ # Стратегии и Guards
│   │   ├── promo-codes/         # Модуль промокодов
│   │   │   ├── api/            # Контроллеры и DTO
│   │   │   ├── application/    # Бизнес-логика, сервисы, use cases, события
│   │   │   ├── domain/         # Доменные сущности и константы
│   │   │   ├── infrastructure/ # Репозитории, схемы, consumers
│   │   │   └── __tests__/      # Тесты
│   │   └── shared/              # Общие модули
│   │       ├── database/        # MongoDB, ClickHouse
│   │       └── events/          # EventBus (Redis/Bull)
│   └── common/                  # Общие утилиты
│       ├── decorators/         # Декораторы (auth, response, dto)
│       ├── dto/                # Общие DTO (api-success-response, api-error-response)
│       ├── filters/            # Exception filters
│       ├── interceptors/       # Response interceptors
│       └── paginate/            # Пагинация
```

## Быстрый старт

1. Запустить БД: `docker-compose up -d`
2. Подключиться к Compass: `mongodb://admin:admin123@localhost:27017/promo_code_manager?authSource=admin`
3. Настроить `.env`: `cp env.example .env`
4. Запустить приложение: `pnpm start:dev`

## Проверка работы ClickHouse

ClickHouse клиент инициализируется при старте, но миграции отключены автоматически.

**Проверка через Docker:**
```bash
# Проверка статуса контейнера
docker ps | grep clickhouse

# Проверка через clickhouse-client
docker exec -it promo_code_manager_clickhouse clickhouse-client --query "SELECT 1"

# Проверка HTTP интерфейса
curl http://localhost:8123/ping
```

**Проверка через приложение:**
```typescript
// В контроллере или сервисе
await this.clickhouseService.ping(); // Проверка подключения
const isConnected = this.clickhouseService.isConnected(); // Проверка наличия клиента
```

**Запуск миграций:**
Миграции можно запустить вручную через `ClickHouseMigrationService.runMigrations()` когда ClickHouse настроен.
