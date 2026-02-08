# Frontend - Обработка ошибок через Interceptors

## Обзор

Централизованная обработка ошибок через Axios interceptors обеспечивает единообразную обработку ошибок API, автоматический refresh token и корректное отображение ошибок пользователю.

## Структура обработки ошибок

### Request Interceptor

**Файл:** `shared/api/interceptors/request.interceptor.ts`

**Назначение:** Добавление access token в заголовки запросов.

```typescript
axiosInstance.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
```

### Response Interceptor

**Файл:** `shared/api/interceptors/response.interceptor.ts`

**Назначение:**
1. Извлечение `result` из ответа `{ result: ... }`
2. Автоматический refresh token при 401
3. Редирект на `/login` при истечении refresh token

**Логика обработки:**

```typescript
// Успешный ответ
if (response.data?.result) {
  return { ...response, data: response.data.result };
}

// Ошибка 401 - попытка refresh token
if (response.status === 401 && !isRefreshRequest) {
  try {
    await refreshAccessToken();
    // Повтор оригинального запроса
    return axiosInstance(originalRequest);
  } catch {
    // Refresh token истёк - редирект на /login
    tokenStorage.clearTokens();
    window.location.href = '/login';
  }
}
```

## Утилиты обработки ошибок

### extractErrorData

**Файл:** `shared/lib/utils/error.utils.ts`

**Назначение:** Извлечение данных об ошибке из различных форматов.

```typescript
export const extractErrorData = (error: unknown): ApiErrorResponseDto | null => {
  // Обработка Orval ошибок
  if (error && typeof error === 'object' && 'data' in error) {
    return error.data as ApiErrorResponseDto;
  }
  
  // Обработка Axios ошибок
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    return axiosError.response?.data as ApiErrorResponseDto;
  }
  
  return null;
};
```

### getErrorMessage

**Назначение:** Извлечение сообщения об ошибке с приоритетом.

**Приоритет:**
1. `errors` массив (валидационные ошибки)
2. `message` массив
3. `message` строка
4. Дефолтное сообщение

```typescript
export const getErrorMessage = (
  errorData: ApiErrorResponseDto | null,
  defaultMessage: string,
): string => {
  if (!errorData) return defaultMessage;
  
  // Приоритет 1: errors массив
  if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
    return errorData.errors[0];
  }
  
  // Приоритет 2: message массив
  if (Array.isArray(errorData.message) && errorData.message.length > 0) {
    return errorData.message[0];
  }
  
  // Приоритет 3: message строка
  if (typeof errorData.message === 'string') {
    return errorData.message;
  }
  
  return defaultMessage;
};
```

## Использование в формах

### Пример с react-hook-form

```typescript
const { mutate: login } = useAuthLogin({
  mutation: {
    onError: (error: unknown) => {
      const errorData = extractErrorData(error);
      const errorMessage = getErrorMessage(errorData, 'Ошибка при входе');
      setFormError('root', { message: errorMessage });
    },
  },
});
```

**Результат:**
- Пользователь видит конкретное сообщение об ошибке
- Валидационные ошибки отображаются приоритетно
- Единообразная обработка во всех формах

## Автоматический Refresh Token

### Механизм работы

1. **Запрос с истёкшим access token** → 401 ошибка
2. **Response interceptor** перехватывает 401
3. **Вызов refresh token** через `/auth/refresh`
4. **Сохранение новых токенов** в localStorage
5. **Повтор оригинального запроса** с новым токеном
6. **При ошибке refresh** → редирект на `/login`

### Защита от бесконечного цикла

```typescript
// Проверка, что это не запрос на refresh
const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');

// Проверка флага _retry
if (originalRequest._retry) {
  // Уже пытались refresh - не повторяем
  return Promise.reject(error);
}
```

## Типизация ошибок

Все ошибки типизированы через `ApiErrorResponseDto` от Orval:

```typescript
interface ApiErrorResponseDto {
  statusCode: number;
  message: string | string[];
  error: string;
  errors?: string[];
}
```

## Преимущества

1. **Централизация** — вся обработка в одном месте
2. **Автоматизация** — refresh token работает прозрачно
3. **Единообразие** — одинаковый формат ошибок везде
4. **UX** — пользователь видит понятные сообщения
5. **Типобезопасность** — ошибки типизированы

## Связанные документы

- [Архитектура FSD](./frontend-architecture.md) — Структура проекта
- [TanStack Query](./frontend-tanstack-query.md) — Управление состоянием
- [Кодогенерация Orval](./frontend-orval-codegen.md) — API клиенты
