# Frontend: Orval Configuration

## Назначение

Настройка Orval для автоматической генерации API клиента из OpenAPI/Swagger спецификации.

## Структура

```
orval.config.js
src/
├── api/
│   ├── generated/
│   │   ├── api.ts
│   │   ├── models.ts
│   │   └── hooks.ts
│   └── client.ts
```

## Реализация

### orval.config.js

```javascript
module.exports = {
  api: {
    input: {
      target: 'http://localhost:3000/api-json',
    },
    output: {
      target: './src/api/generated/api.ts',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: './src/api/client.ts',
          name: 'customInstance',
        },
      },
    },
  },
};
```

### API Client

**`src/api/client.ts`**
```typescript
import Axios, { AxiosError, AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = Axios.CancelToken.source();
  const token = localStorage.getItem('accessToken');

  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    headers: {
      ...config.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};
```

## Использование

```typescript
import { useGetUsers, useCreateUser } from '@/api/generated/hooks';

function UsersPage() {
  const { data, isLoading } = useGetUsers({ page: 1, limit: 10 });
  const createUser = useCreateUser();

  // ...
}
```

## Генерация

```bash
npm run generate:api
```

## Зависимости

- `orval`
- `axios`
- `@tanstack/react-query`
