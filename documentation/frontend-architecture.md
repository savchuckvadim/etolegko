# Frontend Architecture - Feature-Sliced Design

## Обзор

Frontend приложение построено на архитектуре **Feature-Sliced Design (FSD)** — методологии организации кода, которая обеспечивает масштабируемость, переиспользуемость и понятную структуру проекта.

## Принципы FSD

### Слои архитектуры

```
app/          → Инициализация приложения (провайдеры, роутинг)
shared/       → Переиспользуемые модули (API, утилиты, UI компоненты)
entities/     → Бизнес-сущности (API клиенты, типы)
features/     → Функциональные возможности (бизнес-логика, формы)
widgets/      → Композитные блоки UI (таблицы, формы, layout)
pages/        → Страницы приложения
processes/    → Процессы, управляющие роутингом и состоянием
```

### Правила импорта

- ✅ Слои могут импортировать только из слоёв ниже
- ✅ Запрещены циклические зависимости
- ✅ `shared` не зависит ни от кого
- ✅ `entities` зависит только от `shared`
- ✅ `features` зависит от `entities` и `shared`
- ✅ `widgets` зависит от `features`, `entities`, `shared`
- ✅ `pages` зависит от всех слоёв

## Структура проекта

### app/ - Инициализация приложения

**Назначение:** Настройка провайдеров, роутинга, глобальной конфигурации.

**Структура:**
```
app/
├── App.tsx              # Корневой компонент
├── providers/           # Провайдеры
│   ├── query-provider.tsx    # TanStack Query
│   └── theme-provider.tsx     # MUI Theme
└── router/
    └── router.tsx       # Конфигурация роутинга
```

**Особенности:**
- Провайдеры оборачивают всё приложение
- Роутинг настроен с защищёнными маршрутами через `AuthGuard`

### shared/ - Переиспользуемые модули

**Назначение:** Общие утилиты, API слой, UI компоненты, конфигурация.

**Структура:**
```
shared/
├── api/                 # API слой
│   ├── axios-instance.ts
│   ├── interceptors/
│   ├── constants/
│   ├── types/
│   ├── utils/
│   └── generated/       # Orval сгенерированные клиенты
├── lib/                 # Утилиты
│   ├── storage/         # tokenStorage
│   └── utils/           # error.utils, и др.
├── ui/                  # UI компоненты
│   ├── pagination/
│   ├── card/
│   └── date-filter/
└── config/              # Конфигурация
```

**Особенности:**
- API слой с автоматическим refresh token
- Централизованная обработка ошибок
- Переиспользуемые UI компоненты

### entities/ - Бизнес-сущности

**Назначение:** API клиенты и типы, сгенерированные через Orval.

**Структура:**
```
entities/
├── auth/
│   └── api/
│       └── auth.api.ts      # Re-export Orval hooks и типов
├── users/
├── promo-codes/
├── orders/
└── analytics/
```

**Особенности:**
- Все типы и хуки генерируются автоматически из Swagger
- Re-export для удобного импорта
- Типобезопасность на уровне API

### features/ - Функциональные возможности

**Назначение:** Бизнес-логика форм, валидация, хуки для работы с данными.

**Структура:**
```
features/
├── auth/
│   ├── hooks/
│   │   ├── use-login-form.ts
│   │   └── use-register-form.ts
│   └── schemas/
│       ├── login.schema.ts
│       └── register.schema.ts
├── users/
├── promo-codes/
├── orders/
└── analytics/
```

**Особенности:**
- Схемы валидации через Zod
- Хуки форм инкапсулируют логику
- Разделение UI и бизнес-логики

### widgets/ - Композитные блоки UI

**Назначение:** Сложные UI компоненты, состоящие из нескольких простых.

**Структура:**
```
widgets/
├── auth/
│   ├── login-form/
│   └── register-form/
├── users/
│   └── create-user-dialog/
├── promo-codes/
│   ├── create-promo-code-dialog/
│   ├── update-promo-code-dialog/
│   └── apply-promo-code-dialog/
├── orders/
├── analytics/
│   ├── promo-codes-analytics-table/
│   ├── users-analytics-table/
│   └── promo-code-usage-history-table/
└── layout/
    ├── header/
    └── main-layout/
```

**Особенности:**
- Композитные компоненты
- Используют хуки из `features`
- Переиспользуемые в разных страницах

### pages/ - Страницы приложения

**Назначение:** Композиция виджетов и features для создания страниц.

**Структура:**
```
pages/
├── auth/
│   ├── login-page/
│   └── register-page/
├── home/
├── users/
├── promo-codes/
├── orders/
└── analytics/
```

**Особенности:**
- Только композиция компонентов
- Минимум логики
- Используют `MainLayout` для обёртки

### processes/ - Процессы

**Назначение:** Глобальные процессы, управляющие роутингом и состоянием.

**Структура:**
```
processes/
└── auth/
    └── providers/
        └── auth-provider.tsx    # AuthContextProvider, AuthGuard
```

**Особенности:**
- Управление глобальным состоянием
- Защита роутов
- Редиректы на основе аутентификации

## Преимущества FSD

1. **Масштабируемость** — легко добавлять новые фичи
2. **Переиспользуемость** — компоненты и логика переиспользуются
3. **Тестируемость** — чёткое разделение упрощает тестирование
4. **Понятность** — структура интуитивно понятна
5. **Типобезопасность** — TypeScript + Orval обеспечивают типобезопасность

## Связанные документы

- [Кодогенерация Orval](./frontend-orval-codegen.md) — Генерация API клиентов
- [Обработка ошибок](./frontend-error-handling.md) — Interceptors и обработка ошибок
- [Оптимизация производительности](./frontend-performance.md) — memo, useMemo, useCallback
- [Тестирование](./frontend-testing.md) — Unit тесты
