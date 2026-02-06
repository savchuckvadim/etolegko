# Frontend: Shadcn/ui Components

## Назначение

Настройка и использование Shadcn/ui компонентов для UI.

## Структура

```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── features/
│       ├── users-table.tsx
│       ├── promo-codes-table.tsx
│       └── analytics-table.tsx
```

## Установка

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input table dialog select
```

## Используемые компоненты

- **Button** - кнопки
- **Input** - поля ввода
- **Table** - таблицы данных
- **Dialog** - модальные окна
- **Select** - выпадающие списки
- **DatePicker** - выбор дат
- **Pagination** - пагинация
- **Card** - карточки
- **Badge** - бейджи статусов

## Примеры использования

**Таблица с пагинацией:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Email</TableHead>
      <TableHead>Name</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id}>
        <TableCell>{user.email}</TableCell>
        <TableCell>{user.name}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## Зависимости

- `shadcn-ui`
- `tailwindcss`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
