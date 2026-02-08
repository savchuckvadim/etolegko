# Frontend - Тестирование

## Обзор

Проект использует **Vitest** и **React Testing Library** для unit тестирования компонентов, хуков и утилит.

## Тестовый стек

- **Vitest** — быстрый unit-тест раннер (альтернатива Jest)
- **@testing-library/react** — утилиты для тестирования React компонентов
- **@testing-library/react-hooks** — тестирование React хуков
- **happy-dom** — легковесная DOM реализация для тестов
- **@testing-library/jest-dom** — дополнительные матчеры

## Конфигурация

### vitest.config.ts

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // ... другие алиасы
    },
  },
});
```

### setup.ts

Глобальная настройка для всех тестов:
- Импорт `@testing-library/jest-dom`
- Очистка после каждого теста

## Покрытие тестами

### features/analytics (22 теста)

**Файлы:**
- `use-analytics.test.tsx` — 6 тестов
- `use-analytics-page.test.tsx` — 16 тестов

**Покрытие:**
- Инициализация состояния
- Обработчики событий (смена табов, фильтры дат)
- Интеграция с React Query
- Пагинация и параметры запросов

### features/auth (50 тестов)

**Файлы:**
- `login.schema.test.ts` — 9 тестов
- `register.schema.test.ts` — 17 тестов
- `use-login-form.test.tsx` — 11 тестов
- `use-register-form.test.tsx` — 13 тестов

**Покрытие:**
- Валидация полей (email, password, name, phone)
- Нормализация данных (trim, lowercase)
- Структура хуков форм
- Обработка ошибок

### features/orders (24 теста)

**Файлы:**
- `create-order.schema.test.ts` — 5 тестов
- `update-order.schema.test.ts` — 5 тестов
- `use-orders.test.tsx` — 4 теста
- `use-create-order-form.test.tsx` — 6 тестов
- `use-update-order-form.test.tsx` — 4 теста

**Покрытие:**
- Валидация amount
- CRUD операции
- Структура хуков форм

### features/promo-codes (38 тестов)

**Файлы:**
- `create-promo-code.schema.test.ts` — 16 тестов
- `update-promo-code.schema.test.ts` — 8 тестов
- `apply-promo-code.schema.test.ts` — 5 тестов
- `use-promo-codes.test.tsx` — 4 теста
- `use-create-promo-code-form.test.tsx` — 4 теста
- `use-update-promo-code-form.test.tsx` — 3 теста
- `use-apply-promo-code-form.test.tsx` — 3 теста

**Покрытие:**
- Валидация кода, процента скидки, лимитов
- Валидация дат (startsAt, endsAt)
- Применение промокода
- CRUD операции

### features/users (23 теста)

**Файлы:**
- `create-user.schema.test.ts` — 12 тестов
- `use-users.test.tsx` — 7 тестов
- `use-create-user-form.test.tsx` — 4 теста

**Покрытие:**
- Валидация полей пользователя
- CRUD операции
- Структура хуков форм

## Типы тестов

### 1. Тесты схем валидации (Zod)

**Пример:**

```typescript
describe('loginSchema', () => {
  it('должен валидировать формат email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });
});
```

**Покрытие:**
- Валидация обязательных полей
- Валидация форматов (email, password)
- Нормализация данных (trim, lowercase, uppercase)

### 2. Тесты хуков форм

**Пример:**

```typescript
describe('useLoginForm', () => {
  it('должен инициализироваться с пустыми значениями', () => {
    const { result } = renderHook(() => useLoginForm(), { wrapper });
    expect(result.current.errors).toEqual({});
  });
});
```

**Покрытие:**
- Инициализация состояния
- Структура возвращаемых значений
- Валидация форм
- Состояния загрузки

### 3. Тесты хуков данных

**Пример:**

```typescript
describe('useUsers', () => {
  it('должен вызывать useUsersFindAll с правильными params', () => {
    const { result } = renderHook(() => useUsers(mockParams), { wrapper });
    expect(usersApi.useUsersFindAll).toHaveBeenCalledWith(mockParams, {
      query: { enabled: true },
    });
  });
});
```

**Покрытие:**
- Вызовы API hooks
- Передача параметров
- Условное выполнение запросов

## Мокирование

### Моки API hooks

```typescript
vi.mock('@entities/users', () => ({
  useUsersFindAll: vi.fn(),
  useUsersCreate: vi.fn(),
}));
```

### Моки утилит

```typescript
vi.mock('@shared/lib/storage/token-storage', () => ({
  tokenStorage: {
    setTokens: vi.fn(),
  },
}));
```

## Команды

```bash
# Запуск тестов в watch режиме
pnpm test

# Запуск тестов с UI
pnpm test:ui

# Запуск тестов один раз (для CI/CD)
pnpm test:run

# Запуск тестов с покрытием
pnpm test:coverage

# Запуск конкретного файла
pnpm test src/features/auth/__tests__/login.schema.test.ts

# Запуск тестов для директории
pnpm test src/features/auth/__tests__/
```

## Статистика

**Всего тестов:** 162
- `features/analytics`: 22 теста
- `features/auth`: 50 тестов
- `features/orders`: 24 теста
- `features/promo-codes`: 38 тестов
- `features/users`: 23 теста

## Потенциал для улучшения

### Что можно добавить:

1. **Больше покрытия** — тесты для widgets и pages
2. **Интеграционные тесты** — тестирование взаимодействия компонентов
3. **E2E тесты** — Playwright/Cypress для полных сценариев
4. **Тесты производительности** — измерение времени рендеринга
5. **Визуальное тестирование** — Storybook + Chromatic

## Связанные документы

- [Архитектура FSD](./frontend-architecture.md) — Структура проекта
- [TanStack Query](./frontend-tanstack-query.md) — Тестирование запросов
- [Оптимизация производительности](./frontend-performance.md) — Тесты производительности
