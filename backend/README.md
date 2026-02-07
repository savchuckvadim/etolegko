<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Database Setup

Проект использует три базы данных:
- **MongoDB** (OLTP) - транзакционная БД, используется Mongoose ODM
- **ClickHouse** (OLAP) - аналитическая БД
- **Redis** - для EventBus и кеширования

### Запуск баз данных

```bash
# Запуск всех БД через Docker Compose
docker-compose up -d

# Проверка статуса
docker-compose ps

# Остановка
docker-compose down
```

### Подключение к MongoDB через Compass

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

### Настройка окружения

1. Скопируйте файл с примером конфигурации:
```bash
cp env.example .env
```

2. Настройте параметры подключения в `.env` файле (уже настроено для локального MongoDB)

Подробная документация: [Database Setup](../../documentation/database-setup.md)

### Проверка ClickHouse

ClickHouse запускается через Docker Compose, но миграции отключены автоматически.

**Проверка работы:**
```bash
# Проверка через Docker
docker exec -it promo_code_manager_clickhouse clickhouse-client --query "SELECT 1"

# Проверка HTTP интерфейса
curl http://localhost:8123/ping
```

**Запуск миграций:**
Миграции можно запустить вручную через `ClickHouseMigrationService.runMigrations()` когда ClickHouse настроен.

## Модули

### Users Module
- ✅ CRUD операции для пользователей
- ✅ Пагинация и фильтрация
- ✅ Валидация данных
- ✅ Полное покрытие тестами

### Auth Module
- ✅ Регистрация пользователей (POST /auth/register)
- ✅ Вход пользователей (POST /auth/login)
- ✅ Обновление токена (POST /auth/refresh)
- ✅ Получение текущего пользователя (GET /auth/me)
- ✅ JWT аутентификация с access и refresh токенами
- ✅ Swagger документация

### Promo Codes Module
- ✅ CRUD операции для промокодов
- ✅ Применение промокодов к заказам (POST /promo-codes/apply)
- ✅ Валидация использования промокодов (лимиты, сроки действия)
- ✅ Event-driven архитектура для записи аналитики в ClickHouse
- ✅ Use Cases для координации бизнес-логики
- ✅ Полное покрытие тестами (service, controller, use case, consumer)

**API Endpoints:**
- `POST /promo-codes` - Создание промокода
- `GET /promo-codes` - Список промокодов с пагинацией
- `GET /promo-codes/:id` - Получение промокода по ID
- `PATCH /promo-codes/:id` - Обновление промокода
- `DELETE /promo-codes/:id` - Удаление промокода
- `POST /promo-codes/apply` - Применение промокода к заказу

**Event-Driven Analytics:**
Применение промокода автоматически публикует событие `PromoCodeAppliedEvent` в очередь Redis/Bull, которое обрабатывается Consumer'ом и записывается в ClickHouse для аналитики.

Подробнее: [Event Bus & Queue System](../../documentation/event-bus-queue-clickhouse.md)

### Orders Module
- ✅ CRUD операции для заказов
- ✅ Применение промокодов к заказам (через Promo Codes Module)
- ✅ Защита данных: пользователи видят только свои заказы
- ✅ Фильтрация по пользователю и диапазону дат
- ✅ Event-driven архитектура для записи аналитики в ClickHouse
- ✅ Use Cases для координации бизнес-логики

**API Endpoints:**
- `POST /orders` - Создание заказа
- `GET /orders` - Список заказов с пагинацией (только свои)
- `GET /orders/:id` - Получение заказа по ID (только свой)
- `PATCH /orders/:id` - Обновление заказа (только свой)
- `DELETE /orders/:id` - Удаление заказа (только свой)

**Event-Driven Analytics:**
Создание заказа автоматически публикует событие `OrderCreatedEvent` в очередь Redis/Bull, которое обрабатывается Consumer'ом и записывается в ClickHouse для аналитики.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```
