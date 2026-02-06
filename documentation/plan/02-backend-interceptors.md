# Backend: Interceptors

## Назначение

Interceptors в NestJS обрабатывают запросы и ответы, обеспечивая логирование, трансформацию данных, кеширование и другие cross-cutting concerns.

## Структура

```
src/
├── common/
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── transform.interceptor.ts
│   │   ├── timeout.interceptor.ts
│   │   └── cache.interceptor.ts
```

## Реализация

### 1. Logging Interceptor

**`common/interceptors/logging.interceptor.ts`**
```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, query, params } = request;
    const user = request.user;
    const now = Date.now();

    this.logger.log(
      `Incoming request: ${method} ${url}`,
      {
        method,
        url,
        body: this.sanitizeBody(body),
        query,
        params,
        userId: user?.id,
        ip: request.ip,
      },
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse<Response>();
          const delay = Date.now() - now;

          this.logger.log(
            `Response: ${method} ${url} ${response.statusCode} (${delay}ms)`,
            {
              method,
              url,
              statusCode: response.statusCode,
              delay,
              userId: user?.id,
            },
          );
        },
        error: (error) => {
          const delay = Date.now() - now;
          this.logger.error(
            `Error: ${method} ${url} (${delay}ms)`,
            error.stack,
            {
              method,
              url,
              delay,
              userId: user?.id,
              error: error.message,
            },
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'passwordHash', 'token'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });

    return sanitized;
  }
}
```

### 2. Transform Interceptor

**`common/interceptors/transform.interceptor.ts`**
```typescript
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
```

### 3. Timeout Interceptor

**`common/interceptors/timeout.interceptor.ts`**
```typescript
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const timeout = this.config.requestTimeout || 30000;

    return next.handle().pipe(
      timeout(timeout),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          throw new RequestTimeoutException(
            `Request timeout after ${timeout}ms`,
          );
        }
        throw err;
      }),
    );
  }
}
```

### 4. Cache Interceptor (опционально)

**`common/interceptors/cache.interceptor.ts`**
```typescript
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;

    // Кешируем только GET запросы
    if (method !== 'GET') {
      return next.handle();
    }

    const key = `cache:${url}`;
    const cached = await this.cacheManager.get(key);

    if (cached) {
      return of(cached);
    }

    return next.handle().pipe(
      tap(async (data) => {
        await this.cacheManager.set(key, data, { ttl: 300 }); // 5 минут
      }),
    );
  }
}
```

### 5. Response Pagination Interceptor

**`common/interceptors/pagination.interceptor.ts`**
```typescript
@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: PaginatedResult<any>) => {
        if (data && 'items' in data && 'total' in data) {
          return {
            success: true,
            data: data.items,
            pagination: {
              total: data.total,
              page: data.page,
              limit: data.limit,
              totalPages: Math.ceil(data.total / data.limit),
            },
            timestamp: new Date().toISOString(),
          };
        }
        return data;
      }),
    );
  }
}
```

## Глобальная регистрация

**`main.ts`**
```typescript
app.useGlobalInterceptors(
  new LoggingInterceptor(),
  new TransformInterceptor(),
  new TimeoutInterceptor(),
);
```

## Локальное использование

```typescript
@Controller('promo-codes')
@UseInterceptors(CacheInterceptor)
export class PromoCodeController {
  // ...
}
```

## Конфигурация

**`config/app.config.ts`**
```typescript
export interface AppConfig {
  requestTimeout?: number;
  cacheTtl?: number;
}
```

## Тестирование

- Unit тесты для каждого interceptor
- Проверка логирования
- Проверка трансформации данных
- Проверка timeout

## Зависимости

- `@nestjs/common`
- `rxjs`
- `@nestjs/cache-manager` (для CacheInterceptor)
