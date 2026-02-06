# Frontend: Testing Strategy

## Назначение

Стратегия тестирования frontend: unit тесты компонентов, интеграционные тесты, E2E тесты.

## Структура

```
src/
├── features/
│   ├── auth/
│   │   ├── __tests__/
│   │   │   ├── login-form.test.tsx
│   │   │   └── use-auth.test.ts
│   └── users/
│       └── __tests__/
│           └── users-table.test.tsx
```

## Типы тестов

### 1. Component Tests

**`features/auth/__tests__/login-form.test.tsx`**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '../components/login-form';

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should validate email', async () => {
    render(<LoginForm />);
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.blur(emailInput);
    expect(await screen.findByText('Invalid email')).toBeInTheDocument();
  });
});
```

### 2. Hook Tests

**`features/auth/__tests__/use-auth.test.ts`**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useLogin } from '../hooks/use-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useLogin', () => {
  it('should login user', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useLogin(), { wrapper });

    await waitFor(() => {
      expect(result.current.mutate).toBeDefined();
    });
  });
});
```

### 3. E2E Tests (Playwright)

**`e2e/auth.spec.ts`**
```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

## Зависимости

- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jest`
- `@playwright/test` (E2E)
