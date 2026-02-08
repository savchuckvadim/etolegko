# Frontend - Кодогенерация API клиентов (Orval)

## Обзор

Проект использует **Orval** для автоматической генерации TypeScript типов и React Query hooks из Swagger/OpenAPI спецификации backend.

## Как это работает

### 1. Swagger документация

Backend предоставляет Swagger документацию по адресу:
- **JSON**: `http://localhost:3000/docs-json`
- **UI**: `http://localhost:3000/docs`

### 2. Генерация через Orval

**Конфигурация:** `orval.config.ts`

```typescript
export default {
  'promo-code-manager': {
    input: {
      target: 'http://localhost:3000/docs-json',
    },
    output: {
      mode: 'tags-split',
      target: './src/shared/api/generated',
      client: 'react-query',
      mock: false,
    },
    override: {
      mutator: {
        path: './src/shared/api/axios-instance.ts',
        name: 'customInstance',
      },
    },
  },
};
```

### 3. Результат генерации

Orval генерирует:
- **TypeScript типы** — DTO, параметры, ответы
- **React Query hooks** — `useAuthLogin`, `useUsersFindAll`, и т.д.
- **Типобезопасные запросы** — все параметры и ответы типизированы

## Структура сгенерированных файлов

```
shared/api/generated/
├── auth/
│   └── auth.ts          # Хуки и типы для аутентификации
├── users/
│   └── users.ts         # Хуки и типы для пользователей
├── promo-codes/
│   └── promo-codes.ts   # Хуки и типы для промокодов
├── orders/
│   └── orders.ts        # Хуки и типы для заказов
├── analytics/
│   └── analytics.ts     # Хуки и типы для аналитики
└── models.ts            # Общие типы (DTO, Response)
```

## Использование в entities/

Каждая entity re-export'ит сгенерированные хуки и типы:

```typescript
// entities/auth/api/auth.api.ts
export {
  useAuthLogin,
  useAuthRegister,
  useAuthRefresh,
  useAuthGetMe,
} from '@shared/api/generated/auth/auth';

export type {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  UserMeResponseDto,
} from '@shared/api/generated/auth/auth';
```

## Сквозная типизация DTO

### 1. Backend → Orval → Frontend

```
Backend DTO (NestJS)
    ↓
Swagger/OpenAPI
    ↓
Orval генерация
    ↓
Frontend типы (TypeScript)
```

### 2. Валидация форм

Zod схемы типизированы через `satisfies`:

```typescript
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
}) satisfies z.ZodType<LoginDto>;  // ← Тип из Orval
```

**Преимущества:**
- ✅ Runtime валидация через Zod
- ✅ Типобезопасность через DTO от Orval
- ✅ Соответствие API контракту гарантировано

### 3. Использование в хуках

```typescript
// features/auth/hooks/use-login-form.ts
import { useAuthLogin } from '@entities/auth';
import type { LoginDto } from '@entities/auth';

const onSubmit = (data: LoginFormData) => {
  const loginData: LoginDto = {
    email: data.email,
    password: data.password,
  };
  login({ data: loginData });
};
```

## Команды

```bash
# Генерация API клиентов
pnpm run generate:api

# Генерация с watch режимом (автоматически при изменении Swagger)
pnpm run generate:api:watch
```

## Custom Instance

Orval использует `customInstance` из `axios-instance.ts`:

```typescript
export const customInstance = async <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const axiosConfig = {
    ...config,
    ...options,
  };
  
  const response = await axiosInstance(axiosConfig);
  
  return {
    status: response.status,
    data: response.data,
    headers: response.headers,
  } as T;
};
```

**Особенности:**
- Автоматическая обработка `{ result: ... }` обёртки
- Интеграция с interceptors (refresh token)
- Поддержка отмены запросов

## Преимущества

1. **Типобезопасность** — все запросы типизированы
2. **Автоматизация** — не нужно писать API клиенты вручную
3. **Синхронизация** — изменения в backend автоматически отражаются во frontend
4. **Документация** — типы служат документацией API
5. **Рефакторинг** — переименование в backend автоматически обновляет frontend

## Связанные документы

- [Архитектура FSD](./frontend-architecture.md) — Структура проекта
- [Обработка ошибок](./frontend-error-handling.md) — Interceptors
- [TanStack Query](./frontend-tanstack-query.md) — Управление состоянием
