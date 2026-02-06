# Promo Code Manager

Система управления промокодами с разделением на backend и frontend части.

## Структура проекта

```
project/
├── backend/          # NestJS Backend API
├── frontend/         # Next.js Frontend
└── documentation/    # Документация проекта
```

## Быстрый старт

### Backend

Документация по настройке и запуску backend находится в [backend/README.md](./backend/README.md).

**Основные команды:**
```bash
cd backend
pnpm install
pnpm start:dev
```

### Frontend

Документация по настройке и запуску frontend находится в [frontend/README.md](./frontend/README.md).

**Основные команды:**
```bash
cd frontend
pnpm install
pnpm dev
```

## Документация

Полная документация проекта, включая архитектуру, настройку баз данных и модули, находится в [documentation/README.md](./documentation/README.md).

## Технологии

### Backend
- **NestJS** - Progressive Node.js framework
- **MongoDB** - OLTP база данных (Mongoose)
- **ClickHouse** - OLAP база данных для аналитики
- **Redis** - Кэширование и очереди
- **TypeScript** - Типизированный JavaScript

### Frontend
- **Next.js** - React framework
- **TypeScript** - Типизированный JavaScript
- **Tailwind CSS** - Utility-first CSS framework

## Ссылки на документацию

- [Backend README](./backend/README.md) - Документация по backend
- [Frontend README](./frontend/README.md) - Документация по frontend
- [Documentation README](./documentation/README.md) - Общая документация проекта
