# Backend: Guards

## Назначение

Guards в NestJS обеспечивают авторизацию и контроль доступа к эндпоинтам. Определяют, может ли запрос быть обработан.

## Структура

```
src/
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   ├── active-user.guard.ts
│   │   └── throttle.guard.ts
```

## Реализация

### 1. JWT Auth Guard

**`common/guards/jwt-auth.guard.ts`**
```typescript
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Проверяем, есть ли декоратор @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Обработка ошибок аутентификации
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    if (info) {
      // info может содержать информацию об ошибке токена
      if (info.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      if (info.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
    }

    return user;
  }
}
```

### 2. Roles Guard

**`common/guards/roles.guard.ts`**
```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // Нет требований к ролям
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Проверяем роль пользователя
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
```

**Использование:**
```typescript
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
async delete(@Param('id') id: string) {
  // Только для админов
}
```

### 3. Active User Guard

**`common/guards/active-user.guard.ts`**
```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    return true;
  }
}
```

**Использование:**
```typescript
@Get('me')
@UseGuards(JwtAuthGuard, ActiveUserGuard)
async getMe(@CurrentUser() user: User) {
  return user;
}
```

### 4. Throttle Guard (Rate Limiting)

**`common/guards/throttle.guard.ts`**
```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { THROTTLE_KEY } from '../decorators/throttle.decorator';

@Injectable()
export class CustomThrottleGuard extends ThrottlerGuard {
  constructor(
    options: any,
    storageService: any,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Разные лимиты для авторизованных и неавторизованных пользователей
    if (user) {
      // Авторизованные пользователи имеют больший лимит
      const limit = 100; // запросов
      const ttl = 60; // секунд
      // Логика проверки лимита
    }

    return super.canActivate(context);
  }

  protected throwThrottlingException(context: ExecutionContext): void {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
```

### 5. Resource Owner Guard

**`common/guards/resource-owner.guard.ts`**
```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Получаем сервис из контекста (нужно настроить)
    // const service = this.getService(context);
    // const resource = await service.findById(resourceId);
    
    // if (resource.userId !== user.id && user.role !== 'admin') {
    //   throw new ForbiddenException('Access denied');
    // }

    return true;
  }
}
```

### 6. API Key Guard

**`common/guards/api-key.guard.ts`**
```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const validApiKey = this.configService.get<string>('API_KEY');

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
```

## Глобальная регистрация

**`app.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Глобальная защита JWT
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Глобальный rate limiting
    },
  ],
})
export class AppModule {}
```

## Комбинирование Guards

```typescript
@Controller('promo-codes')
@UseGuards(JwtAuthGuard, ActiveUserGuard)
export class PromoCodeController {
  @Get()
  async findAll() {
    // Требует JWT и активного пользователя
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async delete(@Param('id') id: string) {
    // Требует JWT, активного пользователя и роль admin
  }
}
```

## Порядок выполнения Guards

Guards выполняются в порядке их объявления:
1. `JwtAuthGuard` — проверяет токен
2. `ActiveUserGuard` — проверяет активность пользователя
3. `RolesGuard` — проверяет роль

Если любой guard возвращает `false` или выбрасывает исключение, запрос отклоняется.

## Тестирование

- Unit тесты для каждого guard
- Проверка обработки различных сценариев
- Проверка комбинирования guards
- E2E тесты с различными ролями

## Зависимости

- `@nestjs/common`
- `@nestjs/passport`
- `@nestjs/throttler` (для rate limiting)
- `@nestjs/config`
