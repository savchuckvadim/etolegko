# Frontend - Паттерны работы с Hooks

## Обзор

Проект использует кастомные хуки для инкапсуляции бизнес-логики, управления формами и работы с данными.

## Типы хуков

### 1. Хуки форм (Form Hooks)

**Назначение:** Инкапсуляция логики форм с react-hook-form и валидацией.

**Пример:** `features/auth/hooks/use-login-form.ts`

```typescript
export const useLoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const { mutate: login } = useAuthLogin({
    mutation: {
      onSuccess: (response) => {
        if (isSuccessResponse(response)) {
          tokenStorage.setTokens(response.data.accessToken, response.data.refreshToken);
        }
      },
      onError: (error) => {
        const errorData = extractErrorData(error);
        const errorMessage = getErrorMessage(errorData, 'Ошибка при входе');
        setFormError('root', { message: errorMessage });
      },
    },
  });

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    isSubmitting,
  };
};
```

**Преимущества:**
- Разделение UI и бизнес-логики
- Переиспользуемость
- Тестируемость
- Типобезопасность

### 2. Хуки данных (Data Hooks)

**Назначение:** Обёртки над Orval hooks с автоматической инвалидацией кэша.

**Пример:** `features/users/hooks/use-users.ts`

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
- Автоматическая инвалидация
- Типобезопасность

### 3. Хуки состояния (State Hooks)

**Назначение:** Управление сложным состоянием страницы.

**Пример:** `features/analytics/hooks/use-analytics-page.ts`

```typescript
export const useAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [promoCodesParams, setPromoCodesParams] = useState({ ... });
  
  const handleTabChange = useCallback((_, newValue) => {
    setActiveTab(newValue);
  }, []);

  const calculateDatesForPreset = useCallback((preset: DatePreset) => {
    // Вычисление дат
  }, []);

  return {
    activeTab,
    handleTabChange,
    promoCodesParams,
    // ... другие значения
  };
};
```

**Преимущества:**
- Инкапсуляция сложной логики
- Оптимизация через useCallback/useMemo
- Переиспользуемость

## Паттерны использования

### Разделение ответственности

```
Widget (UI)
    ↓ использует
Feature Hook (бизнес-логика)
    ↓ использует
Entity Hook (API)
```

**Пример:**

```typescript
// Widget
const LoginForm = () => {
  const { register, handleSubmit, errors } = useLoginForm(); // ← Feature hook
  // Только UI логика
};

// Feature hook
const useLoginForm = () => {
  const { mutate } = useAuthLogin(); // ← Entity hook
  // Бизнес-логика формы
};

// Entity hook (Orval)
const useAuthLogin = () => {
  // API запрос
};
```

### Callback onSuccess

Хуки форм поддерживают опциональный `onSuccess` callback:

```typescript
const useCreateUserForm = (onSuccess?: () => void) => {
  const { mutate: createUser } = useUsersCreate({
    mutation: {
      onSuccess: (response) => {
        if (isSuccessResponse(response)) {
          reset();
          onSuccess?.(); // ← Вызов callback
        }
      },
    },
  });
};
```

**Использование:**

```typescript
const { ... } = useCreateUserForm(() => {
  onClose(); // Закрыть диалог после успешного создания
});
```

## TypeScript и хуки

### Типизация через Orval DTO

```typescript
// Схема валидации типизирована через DTO
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
}) satisfies z.ZodType<LoginDto>; // ← DTO от Orval

// Форма типизирована через схему
type LoginFormData = z.infer<typeof loginSchema>;

// Хук использует типы формы
const useLoginForm = () => {
  const { register } = useForm<LoginFormData>({ ... });
};
```

**Преимущества:**
- Сквозная типизация от API до UI
- Соответствие API контракту
- Автодополнение в IDE

## Связанные документы

- [Архитектура FSD](./frontend-architecture.md) — Структура проекта
- [Кодогенерация Orval](./frontend-orval-codegen.md) — Генерация hooks
- [TanStack Query](./frontend-tanstack-query.md) — Управление состоянием
- [Тестирование](./frontend-testing.md) — Тестирование хуков
