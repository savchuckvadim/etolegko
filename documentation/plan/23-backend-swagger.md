# Backend: Swagger Documentation

## Назначение

Настройка Swagger/OpenAPI документации для API.

## Реализация

### main.ts

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('PromoCode Manager API')
  .setDescription('API for managing promo codes and analytics')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('Authentication', 'User authentication endpoints')
  .addTag('Users', 'User management endpoints')
  .addTag('Promo Codes', 'Promo code management endpoints')
  .addTag('Orders', 'Order management endpoints')
  .addTag('Analytics', 'Analytics endpoints')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

## Использование

- `@ApiTags()` - теги для контроллеров
- `@ApiOperation()` - описание операций
- `@ApiResponse()` - примеры ответов
- `@ApiProperty()` - описание полей DTO
- `@ApiBearerAuth()` - JWT авторизация

## Доступ

- Swagger UI: `http://localhost:3000/api`
- JSON: `http://localhost:3000/api-json`

## Зависимости

- `@nestjs/swagger`
