# Backend: Authentication

## Назначение

Система аутентификации на основе JWT токенов с использованием Passport.js. Обеспечивает регистрацию, вход и защиту эндпоинтов.

## Структура

```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── auth-response.dto.ts
│   │   └── interfaces/
│   │       └── jwt-payload.interface.ts
```

## Реализация

### 1. DTO

**`modules/auth/dto/register.dto.ts`**
```typescript
export class RegisterDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and number',
  })
  @ApiProperty({ example: 'Password123' })
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  @ApiProperty({ example: '+1234567890', required: false })
  phone?: string;
}
```

**`modules/auth/dto/login.dto.ts`**
```typescript
export class LoginDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @ApiProperty({ example: 'Password123' })
  password: string;
}
```

**`modules/auth/dto/auth-response.dto.ts`**
```typescript
export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
  };
}
```

### 2. Interfaces

**`modules/auth/interfaces/jwt-payload.interface.ts`**
```typescript
export interface JwtPayload {
  sub: string; // user id
  email: string;
  name: string;
}
```

### 3. Auth Service

**`modules/auth/auth.service.ts`**
```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Проверка существования пользователя
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Создание пользователя
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      phone: dto.phone,
      isActive: true,
    });

    // Генерация токенов
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Поиск пользователя
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Проверка активности
    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Генерация токенов
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<any> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.jwt.secret,
        expiresIn: this.config.jwt.accessTokenExpiresIn || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.jwt.refreshSecret,
        expiresIn: this.config.jwt.refreshTokenExpiresIn || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.config.jwt.refreshSecret,
        },
      );

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        name: user.name,
      };

      const accessToken = await this.jwtService.signAsync(newPayload, {
        secret: this.config.jwt.secret,
        expiresIn: this.config.jwt.accessTokenExpiresIn || '15m',
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
```

### 4. JWT Strategy

**`modules/auth/strategies/jwt.strategy.ts`**
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    const user = await this.authService.validateJwtPayload(payload);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

### 5. Local Strategy (для login)

**`modules/auth/strategies/local.strategy.ts`**
```typescript
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
```

### 6. Auth Controller

**`modules/auth/auth.controller.ts`**
```typescript
@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @CurrentUser() user: User,
  ): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  @ApiBearerAuth()
  async getMe(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    };
  }
}
```

### 7. Auth Module

**`modules/auth/auth.module.ts`**
```typescript
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.jwt.secret,
        signOptions: {
          expiresIn: config.jwt.accessTokenExpiresIn || '15m',
        },
      }),
    }),
    PassportModule,
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

## Конфигурация

**`config/app.config.ts`**
```typescript
export interface AppConfig {
  jwt: {
    secret: string;
    refreshSecret: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
  };
}
```

**`.env`**
```env
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
```

## Тестирование

- Unit тесты для AuthService
- E2E тесты для регистрации и входа
- Проверка валидации токенов
- Проверка обработки неверных credentials

## Зависимости

- `@nestjs/passport`
- `@nestjs/jwt`
- `passport`
- `passport-jwt`
- `passport-local`
- `bcrypt`
- `@types/bcrypt`
