# Frontend - Оптимизация производительности

## Обзор

Приложение использует различные техники оптимизации React для минимизации перерендеров и улучшения производительности.

## Техники оптимизации

### 1. React.memo

**Назначение:** Предотвращение перерендеров компонентов при неизменных props.

**Примеры использования:**

#### Компоненты табов аналитики

```typescript
export const PromoCodesAnalyticsTab = memo(({ ... }) => {
  // Компонент не перерендерится, если props не изменились
});
```

#### Страница аналитики

```typescript
export const AnalyticsPage = memo(() => {
  // Страница мемоизирована
});
```

**Где используется:**
- `widgets/analytics/*-tab` — все табы аналитики
- `pages/analytics/analytics-page.tsx` — страница аналитики

### 2. useMemo

**Назначение:** Мемоизация вычисляемых значений.

**Примеры:**

#### Вычисление данных ответа

```typescript
const responseData = useMemo(() => {
  if (!query.data) return null;
  return isSuccessResponse(query.data) ? query.data.data : null;
}, [query.data]);
```

#### Списки табов

```typescript
const tabs = useMemo(
  () => [
    { label: 'Промокоды' },
    { label: 'Пользователи' },
    { label: 'История использований' },
  ],
  [],
);
```

**Где используется:**
- `widgets/analytics/*-tab` — вычисление данных ответа
- `pages/analytics/analytics-page.tsx` — списки табов

### 3. useCallback

**Назначение:** Мемоизация функций для стабильных ссылок.

**Примеры:**

#### Обработчики событий

```typescript
const handlePaginationChange: OnChangeFn<MRT_PaginationState> = useCallback(
  (updaterOrValue) => {
    const pagination = typeof updaterOrValue === 'function' 
      ? updaterOrValue({ pageIndex: page - 1, pageSize: limit })
      : updaterOrValue;
    onParamsChange({
      ...params,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    });
  },
  [params, onParamsChange],
);
```

#### Обработчики фильтров дат

```typescript
const handlePromoCodesDatePresetChange = useCallback((preset: DatePreset) => {
  setPromoCodesDatePreset(preset);
  const { dateFrom, dateTo } = calculateDatesForPreset(preset);
  // ...
}, [calculateDatesForPreset]);
```

**Где используется:**
- `features/analytics/hooks/use-analytics-page.ts` — все обработчики
- `widgets/analytics/*-tab` — обработчики пагинации и сортировки

## Страница аналитики - Пример оптимизации

### Проблема

Страница аналитики содержит:
- 3 таба с таблицами
- Фильтры по датам для каждого таба
- Server-side пагинация и сортировка
- Множество состояний

Без оптимизации это приводит к лишним перерендерам.

### Решение

#### 1. Вынос логики в хук

**Файл:** `features/analytics/hooks/use-analytics-page.ts`

Вся логика управления состоянием вынесена в отдельный хук:
- Состояния для каждого таба
- Обработчики событий (все через `useCallback`)
- Вычисляемые значения (через `useMemo`)

#### 2. Мемоизация компонентов табов

```typescript
const PromoCodesAnalyticsTab = memo(({ ... }) => {
  // Компонент мемоизирован
});
```

#### 3. Мемоизация обработчиков

```typescript
const handlePaginationChange = useCallback(
  (updaterOrValue) => { /* ... */ },
  [params, onParamsChange],
);
```

### Результат

- ✅ Минимизация перерендеров
- ✅ Стабильные ссылки на обработчики
- ✅ Кэширование вычислений
- ✅ Улучшенная производительность при работе с большими таблицами

## Измерение производительности

### React DevTools Profiler

Используйте React DevTools Profiler для измерения:
- Количество перерендеров
- Время рендеринга компонентов
- Влияние оптимизаций

### Best Practices

1. **Не переоптимизируйте** — используйте `memo` только там, где это действительно нужно
2. **Проверяйте зависимости** — правильные зависимости в `useCallback` и `useMemo`
3. **Профилируйте** — измеряйте производительность до и после оптимизаций

## Потенциал для улучшения

### Что можно добавить:

1. **React.lazy + Suspense** — ленивая загрузка страниц
2. **Виртуализация таблиц** — для очень больших списков
3. **Debounce для фильтров** — уменьшение количества запросов
4. **Оптимистичные обновления** — обновление UI до ответа сервера
5. **Code splitting** — разделение бандла на чанки

## Связанные документы

- [Архитектура FSD](./frontend-architecture.md) — Структура проекта
- [TanStack Query](./frontend-tanstack-query.md) — Кэширование запросов
- [Тестирование](./frontend-testing.md) — Тесты производительности
