# Backend: Custom Decorators

## Назначение

Кастомные декораторы для упрощения работы с запросами, пользователями, ролями и метаданными.

## Структура

```
src/
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   ├── roles.decorator.ts
│   │   ├── api-pagination.decorator.ts
│   │   └── api-response-paginated.decorator.ts
```

## Реализация

### 1. Current User Decorator

**`common/decorators/current-user.decorator.ts`**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // Если передан параметр, возвращаем конкретное поле
    return data ? user[data] : user;
  },
);
```

**Использование:**
```typescript
@Get('me')
async getMe(@CurrentUser() user: User) {
  return user;
}

@Get('my-id')
async getMyId(@CurrentUser('id') userId: string) {
  return { userId };
}
```

### 2. Public Decorator

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
  @Public() // Публичный эндпоинт, не требует JWT
  async register(@Body() dto: RegisterDto) {
    // ...
  }
}
```

### 3. Roles Decorator

**`common/decorators/roles.decorator.ts`**
```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

**Использование:**
```typescript
@Delete(':id')
@Roles('admin')
async delete(@Param('id') id: string) {
  // Только для админов
}
```

### 4. API Pagination Decorator

**`common/decorators/api-pagination.decorator.ts`**
```typescript
import { applyDecorators, Type } from '@nestjs/common';
import { ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { PaginatedDto } from '../dto/paginated.dto';

export const ApiPagination = <TModel extends Type<any>>(
  model: TModel,
  options?: {
    description?: string;
  },
) => {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (starts from 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page',
      example: 10,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Field to sort by',
      example: 'createdAt',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort order',
      example: 'desc',
    }),
    ApiOkResponse({
      description: options?.description || 'Paginated response',
      type: PaginatedDto(model),
    }),
  );
};
```

**Использование:**
```typescript
@Get()
@ApiPagination(PromoCodeResponseDto, {
  description: 'Get paginated promo codes',
})
async findAll(@Query() query: PromoCodeQueryDto) {
  // ...
}
```

### 5. API Response Paginated Decorator

**`common/dto/paginated.dto.ts`**
```typescript
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export function PaginatedDto<T>(classRef: Type<T>) {
  class PaginatedResponseDto {
    @ApiProperty({ type: [classRef] })
    items: T[];

    @ApiProperty()
    pagination: PaginationMetaDto;
  }

  return PaginatedResponseDto;
}
```

### 6. Date Range Decorator

**`common/decorators/api-date-range.decorator.ts`**
```typescript
import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export const ApiDateRange = () => {
  return applyDecorators(
    ApiQuery({
      name: 'dateFrom',
      required: false,
      type: String,
      format: 'date-time',
      description: 'Start date (ISO 8601)',
      example: '2024-01-01T00:00:00Z',
    }),
    ApiQuery({
      name: 'dateTo',
      required: false,
      type: String,
      format: 'date-time',
      description: 'End date (ISO 8601)',
      example: '2024-01-31T23:59:59Z',
    }),
  );
};
```

**Использование:**
```typescript
@Get('analytics')
@ApiDateRange()
async getAnalytics(@Query() query: AnalyticsQueryDto) {
  // ...
}
```

### 7. File Upload Decorator

**`common/decorators/api-file.decorator.ts`**
```typescript
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

export const ApiFile = (fieldName: string = 'file') => {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fieldName]: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    }),
  );
};

export const ApiFiles = (fieldName: string = 'files', maxCount: number = 10) => {
  return applyDecorators(
    UseInterceptors(FilesInterceptor(fieldName, maxCount)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fieldName]: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
    }),
  );
};
```

### 8. Request ID Decorator

**`common/decorators/request-id.decorator.ts`**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.id || request.headers['x-request-id'];
  },
);
```

### 9. IP Address Decorator

**`common/decorators/ip-address.decorator.ts`**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.ip ||
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.connection.remoteAddress
    );
  },
);
```

### 10. User Agent Decorator

**`common/decorators/user-agent.decorator.ts`**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'];
  },
);
```

## Примеры использования

```typescript
@Controller('promo-codes')
export class PromoCodeController {
  @Get()
  @ApiPagination(PromoCodeResponseDto)
  async findAll(
    @Query() query: PromoCodeQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.service.findAll(query, user.id);
  }

  @Post()
  async create(
    @Body() dto: CreatePromoCodeDto,
    @CurrentUser('id') userId: string,
    @IpAddress() ip: string,
  ) {
    return this.service.create(dto, userId, ip);
  }

  @Get('analytics')
  @Public()
  @ApiDateRange()
  async getAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.service.getAnalytics(query);
  }
}
```

## Тестирование

- Unit тесты для декораторов
- Проверка извлечения данных из request
- Проверка метаданных для Swagger

## Зависимости

- `@nestjs/common`
- `@nestjs/swagger` (для API декораторов)
- `@nestjs/platform-express` (для файлов)
