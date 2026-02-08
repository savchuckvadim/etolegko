# Frontend - TanStack Query (React Query)

## Обзор

**TanStack Query** используется для управления серверным состоянием, кэширования запросов и синхронизации данных с backend.

## Конфигурация

**Файл:** `app/providers/query-provider.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Не обновлять при фокусе
      retry: 1,                     // Одна повторная попытка
      staleTime: 5 * 60 * 1000,    // 5 минут
    },
  },
});
```

## Использование с Orval

Orval автоматически генерирует React Query hooks:

```typescript
// Сгенерированный хук
const { data, isLoading, isError } = useUsersFindAll(params, {
  query: {
    enabled: true,
  },
});
```

## Инвалидация кэша

### После мутаций

```typescript
const createMutation = useUsersCreate({
  mutation: {
    onSuccess: (response) => {
      if (isSuccessResponse(response)) {
        // Инвалидируем список пользователей
        void queryClient.invalidateQueries({ queryKey: ['/users'] });
      }
    },
  },
});
```

### После применения промокода

```typescript
const applyMutation = usePromoCodesApply({
  mutation: {
    onSuccess: () => {
      // Инвалидируем и промокоды, и заказы
      void queryClient.invalidateQueries({ queryKey: ['/promo-codes'] });
      void queryClient.invalidateQueries({ queryKey: ['/orders'] });
    },
  },
});
```

## Хуки для работы с данными

### useUsers, usePromoCodes, useOrders

**Назначение:** Обёртки над Orval hooks с автоматической инвалидацией.

```typescript
export const useUsers = (params?: UsersFindAllParams) => {
  const queryClient = useQueryClient();
  
  const findAllQuery = useUsersFindAll(params, {
    query: { enabled: true },
  });
  
  const createMutation = useUsersCreate({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['/users'] });
      },
    },
  });
  
  return {
    findAll: findAllQuery,
    create: createMutation,
    update: updateMutation,
    remove: removeMutation,
  };
};
```

**Преимущества:**
- Единый интерфейс для работы с сущностью
- Автоматическая инвалидация после мутаций
- Типобезопасность через Orval

## Состояния запросов

### Query состояния

```typescript
const { data, isLoading, isError, error } = useUsersFindAll(params);
```

- `isLoading` — идёт загрузка
- `isError` — произошла ошибка
- `data` — данные ответа (типизированы через Orval)

### Mutation состояния

```typescript
const { mutate, isPending, isError, error } = useUsersCreate();
```

- `isPending` — мутация выполняется
- `isError` — произошла ошибка
- `mutate` — функция для вызова мутации

## Кэширование

### Stale Time

Данные считаются свежими 5 минут, запросы не выполняются повторно.

### Query Keys

Используются для инвалидации:
- `['/users']` — все запросы пользователей
- `['/promo-codes']` — все запросы промокодов
- `['/orders']` — все запросы заказов

## Преимущества

1. **Кэширование** — данные кэшируются автоматически
2. **Синхронизация** — автоматическая инвалидация после мутаций
3. **Оптимистичные обновления** — можно обновлять UI до ответа сервера
4. **Retry** — автоматические повторные попытки при ошибках
5. **Типобезопасность** — интеграция с Orval

## Связанные документы

- [Кодогенерация Orval](./frontend-orval-codegen.md) — Генерация hooks
- [Обработка ошибок](./frontend-error-handling.md) — Обработка ошибок запросов
- [Оптимизация производительности](./frontend-performance.md) — Оптимизация рендеров
