# Backend: Passport Configuration

## Назначение

Настройка Passport.js для аутентификации через JWT и Local стратегии. Обеспечивает интеграцию с NestJS Guards.

## Структура

```
src/
├── modules/
│   ├── auth/
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── local-auth.guard.ts
```

## Реализация

### 1. JWT Strategy

**`modules/auth/strategies/jwt.strategy.ts`**
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    // payload содержит данные из токена (sub, email, name)
    const user = await this.authService.validateJwtPayload(payload);
    
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Возвращаемый объект будет доступен через @CurrentUser()
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isActive: user.isActive,
    };
  }
}
```

### 2. Local Strategy

**`modules/auth/strategies/local.strategy.ts`**
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Используем email вместо username
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Возвращаемый объект будет доступен через @CurrentUser()
    return user;
  }
}
```

### 3. JWT Auth Guard

**`modules/auth/guards/jwt-auth.guard.ts`**
```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Проверяем, есть ли декоратор @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

### 4. Local Auth Guard

**`modules/auth/guards/local-auth.guard.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

### 5. Глобальная регистрация JWT Guard

**`app.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  // ...
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

### 6. Декоратор @Public() для публичных эндпоинтов

**`common/decorators/public.decorator.ts`**
```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Использование:**
```typescript
@Controller('auth')
export class AuthController {
  @Post('register')
  @Public() // Публичный эндпоинт
  async register(@Body() dto: RegisterDto) {
    // ...
  }

  @Get('me')
  // Без @Public() - требует JWT токен
  async getMe(@CurrentUser() user: User) {
    // ...
  }
}
```

### 7. Декоратор @CurrentUser()

**`common/decorators/current-user.decorator.ts`**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

## Конфигурация модуля

**`modules/auth/auth.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
```

## Использование в контроллерах

```typescript
@Controller('promo-codes')
export class PromoCodeController {
  @Get()
  // Автоматически защищено JwtAuthGuard (глобально)
  async findAll(@CurrentUser() user: User) {
    // user доступен из JWT токена
    return this.promoCodeService.findAll();
  }

  @Post()
  async create(
    @Body() dto: CreatePromoCodeDto,
    @CurrentUser() user: User,
  ) {
    // user доступен из JWT токена
    return this.promoCodeService.create(dto, user.id);
  }
}
```

## Обработка ошибок

Passport автоматически выбрасывает `UnauthorizedException` при:
- Неверном токене
- Истекшем токене
- Неверных credentials (для Local)

Эти ошибки обрабатываются `HttpExceptionFilter`.

## Тестирование

- Unit тесты для стратегий
- Проверка валидации токенов
- Проверка обработки неверных credentials
- E2E тесты с токенами

## Зависимости

- `@nestjs/passport`
- `@nestjs/jwt`
- `passport`
- `passport-jwt`
- `passport-local`
- `@types/passport-jwt`
- `@types/passport-local`
