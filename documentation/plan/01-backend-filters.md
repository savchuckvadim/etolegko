# Backend: Exception Filters

## Назначение

Exception filters в NestJS обрабатывают исключения на уровне приложения, обеспечивая единообразный формат ответов об ошибках.

## Структура

```
src/
├── common/
│   ├── filters/
│   │   ├── http-exception.filter.ts
│   │   ├── validation-exception.filter.ts
│   │   ├── mongo-exception.filter.ts
│   │   └── all-exceptions.filter.ts
│   └── exceptions/
│       ├── business.exception.ts
│       ├── validation.exception.ts
│       └── not-found.exception.ts
```

## Реализация

### 1. Базовые исключения

**`common/exceptions/business.exception.ts`**
```typescript
export class BusinessException extends HttpException {
  constructor(
    message: string,
    public readonly code: string,
    statusCode: number = 400,
  ) {
    super({ message, code }, statusCode);
  }
}
```

**`common/exceptions/validation.exception.ts`**
```typescript
export class ValidationException extends HttpException {
  constructor(public readonly errors: Record<string, string[]>) {
    super(
      {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
```

**`common/exceptions/not-found.exception.ts`**
```typescript
export class NotFoundException extends HttpException {
  constructor(resource: string, id?: string) {
    super(
      {
        message: `${resource} not found${id ? ` with id: ${id}` : ''}`,
        code: 'NOT_FOUND',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
```

### 2. Exception Filters

**`common/filters/http-exception.filter.ts`**
```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      ...(typeof exceptionResponse === 'object'
        ? exceptionResponse
        : { message: exceptionResponse }),
    });
  }
}
```

**`common/filters/validation-exception.filter.ts`**
```typescript
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse();

    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse &&
      Array.isArray(exceptionResponse.message)
    ) {
      const errors = this.formatValidationErrors(
        exceptionResponse.message as string[],
      );

      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors,
        timestamp: new Date().toISOString(),
        path: ctx.getRequest().url,
      });
    } else {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
        timestamp: new Date().toISOString(),
        path: ctx.getRequest().url,
      });
    }
  }

  private formatValidationErrors(
    messages: string[],
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    messages.forEach((message) => {
      const match = message.match(/^(\w+) (.+)$/);
      if (match) {
        const [, field, error] = match;
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(error);
      } else {
        if (!errors['_general']) {
          errors['_general'] = [];
        }
        errors['_general'].push(message);
      }
    });

    return errors;
  }
}
```

**`common/filters/mongo-exception.filter.ts`**
```typescript
@Catch(MongoError, MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError | MongoServerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    let code = 'DATABASE_ERROR';

    // Duplicate key error
    if (exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      message = 'Duplicate entry';
      code = 'DUPLICATE_ENTRY';

      const key = Object.keys(exception.keyPattern || {})[0];
      if (key) {
        message = `${key} already exists`;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      code,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
```

**`common/filters/all-exceptions.filter.ts`**
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    this.logger.error(
      `Unhandled exception: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        path: request.url,
        method: request.method,
      },
    );

    response.status(status).json({
      statusCode: status,
      message,
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### 3. Глобальная регистрация

**`main.ts`**
```typescript
app.useGlobalFilters(
  new AllExceptionsFilter(),
  new HttpExceptionFilter(),
  new ValidationExceptionFilter(),
  new MongoExceptionFilter(),
);
```

## Тестирование

- Unit тесты для каждого фильтра
- Проверка форматирования ошибок
- Проверка обработки различных типов исключений

## Зависимости

- `@nestjs/common`
- `mongodb` (для MongoError типов)
