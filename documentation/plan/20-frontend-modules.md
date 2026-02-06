# Frontend: Modules Implementation

## Назначение

Реализация frontend модулей: Auth, Users, PromoCodes, Analytics.

## Структура

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   └── register-form.tsx
│   │   └── hooks/
│   │       └── use-auth.ts
│   ├── users/
│   │   ├── components/
│   │   │   ├── users-table.tsx
│   │   │   └── user-form.tsx
│   │   └── hooks/
│   │       └── use-users.ts
│   ├── promo-codes/
│   │   ├── components/
│   │   │   ├── promo-codes-table.tsx
│   │   │   └── promo-code-form.tsx
│   │   └── hooks/
│   │       └── use-promo-codes.ts
│   └── analytics/
│       ├── components/
│       │   ├── analytics-table.tsx
│       │   └── date-range-picker.tsx
│       └── hooks/
│           └── use-analytics.ts
```

## Реализация

### Auth Module

**`features/auth/hooks/use-auth.ts`**
- `useLogin()` - вход
- `useRegister()` - регистрация
- `useLogout()` - выход
- `useAuth()` - текущий пользователь

**`features/auth/components/login-form.tsx`**
- Форма входа
- Валидация
- Обработка ошибок

### Users Module

**`features/users/components/users-table.tsx`**
- Таблица с пагинацией
- Сортировка
- Фильтрация
- Действия (создать, обновить, удалить)

**`features/users/hooks/use-users.ts`**
- `useUsers()` - список пользователей
- `useCreateUser()` - создание
- `useUpdateUser()` - обновление
- `useDeleteUser()` - удаление

### PromoCodes Module

**`features/promo-codes/components/promo-codes-table.tsx`**
- Таблица промокодов
- Статусы (активен/неактивен)
- Применение промокода

### Analytics Module

**`features/analytics/components/analytics-table.tsx`**
- Таблица аналитики из ClickHouse
- Фильтр по датам
- Пресеты дат (сегодня, 7 дней, 30 дней)
- Агрегированные метрики

**`features/analytics/components/date-range-picker.tsx`**
- Выбор диапазона дат
- Пресеты
- Кастомный диапазон

## Material React Table

Для аналитических таблиц используется Material React Table:

```tsx
import { useMaterialReactTable } from 'material-react-table';

const table = useMaterialReactTable({
  data: analyticsData,
  columns: columns,
  enablePagination: true,
  enableSorting: true,
  enableFiltering: true,
  manualPagination: true,
  manualSorting: true,
  onPaginationChange: setPagination,
  onSortingChange: setSorting,
});
```

## Зависимости

- `@tanstack/react-query`
- `material-react-table`
- `react-hook-form`
- `zod` (валидация)
