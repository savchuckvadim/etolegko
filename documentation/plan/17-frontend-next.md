# Frontend: Next.js Setup

## Назначение

Настройка Next.js приложения с TypeScript, структура проекта, роутинг.

## Структура

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── users/
│   │   │   ├── promo-codes/
│   │   │   └── analytics/
│   │   └── api/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── types/
├── public/
├── next.config.js
├── tsconfig.json
└── package.json
```

## Реализация

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
```

### Структура App Router

- `app/layout.tsx` - корневой layout
- `app/(auth)/login/page.tsx` - страница входа
- `app/(auth)/register/page.tsx` - страница регистрации
- `app/(dashboard)/users/page.tsx` - список пользователей
- `app/(dashboard)/promo-codes/page.tsx` - список промокодов
- `app/(dashboard)/analytics/page.tsx` - аналитика

### Providers

**`src/providers/auth-provider.tsx`**
- Контекст аутентификации
- Хранение токена
- Проверка авторизации

**`src/providers/query-provider.tsx`**
- React Query setup
- Настройка кеширования

### Middleware

**`src/middleware.ts`**
- Проверка авторизации
- Редиректы для защищённых роутов

## Зависимости

- `next`
- `react`
- `react-dom`
- `typescript`
- `@tanstack/react-query`
