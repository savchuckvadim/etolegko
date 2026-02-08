# Frontend - TypeScript и типизация

## Обзор

Проект полностью типизирован через TypeScript с использованием сквозной типизации от API до UI через Orval и Zod.

## Сквозная типизация

### Backend → Frontend

```
Backend (NestJS)
    ↓ DTO
Swagger/OpenAPI
    ↓ Orval генерация
Frontend типы (TypeScript)
    ↓ satisfies
Zod схемы (Runtime валидация)
    ↓ z.infer
React Hook Form типы
```

### Пример цепочки типизации

```typescript
// 1. Backend DTO (генерируется Orval)
type LoginDto = {
  email: string;
  password: string;
};

// 2. Zod схема (типизирована через DTO)
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
}) satisfies z.ZodType<LoginDto>;

// 3. Тип формы (выводится из схемы)
export type LoginFormData = z.infer<typeof loginSchema>;

// 4. Использование в хуке
const useLoginForm = () => {
  const { register } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
};
```

## Типизация API

### Orval генерирует

1. **Типы DTO:**
   ```typescript
   type LoginDto = { email: string; password: string; };
   type AuthResponseDto = { accessToken: string; refreshToken: string; };
   ```

2. **Типы ответов:**
   ```typescript
   type BackendSuccessResponse<T> = {
     status: 200 | 201;
     data: T;
   };
   ```

3. **Типы ошибок:**
   ```typescript
   type ApiErrorResponseDto = {
     statusCode: number;
     message: string | string[];
     errors?: string[];
   };
   ```

### Использование в коде

```typescript
// Типизированный хук
const { data, isLoading } = useAuthLogin();

// data типизирован как BackendSuccessResponse<AuthResponseDto> | ApiErrorResponseDto
if (isSuccessResponse(data)) {
  // TypeScript знает, что data.data содержит AuthResponseDto
  const { accessToken, refreshToken } = data.data;
}
```

## Типизация форм

### React Hook Form + Zod

```typescript
// Схема с типизацией
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
}) satisfies z.ZodType<LoginDto>;

// Тип формы
type LoginFormData = z.infer<typeof loginSchema>;

// Использование
const { register, handleSubmit } = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
});

// register типизирован
register('email'); // ✅ TypeScript знает, что это string
register('invalid'); // ❌ TypeScript ошибка
```

## Типизация компонентов

### Props типизация

```typescript
interface PromoCodesAnalyticsTabProps {
  query: ReturnType<typeof usePromoCodesAnalytics>;
  params: AnalyticsGetPromoCodesListParams;
  onParamsChange: (params: AnalyticsGetPromoCodesListParams) => void;
  // ...
}

export const PromoCodesAnalyticsTab = memo(({
  query,
  params,
  onParamsChange,
}: PromoCodesAnalyticsTabProps) => {
  // ...
});
```

### Event handlers типизация

```typescript
// Типизация через OnChangeFn от @tanstack/react-table
const handlePaginationChange: OnChangeFn<MRT_PaginationState> = useCallback(
  (updaterOrValue) => {
    // TypeScript знает типы updaterOrValue
  },
  [dependencies],
);
```

## Type Guards

### isSuccessResponse

```typescript
export const isSuccessResponse = <T>(
  response: BackendSuccessResponse<T> | ApiErrorResponseDto | null,
): response is BackendSuccessResponse<T> => {
  return (
    response !== null &&
    'status' in response &&
    (response.status === 200 || response.status === 201)
  );
};
```

**Использование:**

```typescript
const response = query.data;
if (isSuccessResponse(response)) {
  // TypeScript знает, что response это BackendSuccessResponse
  const data = response.data; // ✅ Типизировано
} else {
  // TypeScript знает, что response это ApiErrorResponseDto или null
}
```

## Path Aliases

Для удобства импортов настроены алиасы:

```typescript
// tsconfig.json или vite.config.ts
{
  "@app": "./src/app",
  "@shared": "./src/shared",
  "@entities": "./src/entities",
  "@features": "./src/features",
  "@widgets": "./src/widgets",
  "@pages": "./src/pages",
  "@processes": "./src/processes",
}
```

**Использование:**

```typescript
import { useAuth } from '@processes/auth';
import { useUsers } from '@features/users';
import type { LoginDto } from '@entities/auth';
```

## Преимущества типизации

1. **Безопасность типов** — ошибки обнаруживаются на этапе компиляции
2. **Автодополнение** — IDE подсказывает доступные свойства и методы
3. **Рефакторинг** — переименование безопасно
4. **Документация** — типы служат документацией
5. **Сквозная типизация** — от API до UI

## Связанные документы

- [Кодогенерация Orval](./frontend-orval-codegen.md) — Генерация типов
- [Архитектура FSD](./frontend-architecture.md) — Структура проекта
- [Обработка ошибок](./frontend-error-handling.md) — Типизация ошибок
