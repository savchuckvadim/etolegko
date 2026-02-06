# Backend: Orders Module

## Назначение

Модуль для управления заказами. Упрощённая реализация для обеспечения данных для аналитики.

## Структура

```
src/
├── modules/
│   ├── orders/
│   │   ├── orders.module.ts
│   │   ├── api/
│   │   │   ├── orders.controller.ts
│   │   │   └── dto/
│   │   │       ├── create-order.dto.ts
│   │   │       ├── order-query.dto.ts
│   │   │       └── order-response.dto.ts
│   │   ├── application/
│   │   │   ├── orders.service.ts
│   │   │   ├── interfaces/
│   │   │   │   └── order-repository.interface.ts
│   │   │   └── events/
│   │   │       └── order-created.event.ts
│   │   ├── domain/
│   │   │   └── order.entity.ts
│   │   └── infrastructure/
│   │       ├── schemas/
│   │       │   └── order.schema.ts
│   │       └── repositories/
│   │           └── order.repository.ts
```

## Реализация

### 1. Domain Entity

**`modules/orders/domain/order.entity.ts`**
```typescript
export class Order {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly promoCodeId?: string,
    public readonly discountAmount?: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(data: {
    userId: string;
    amount: number;
  }): Order {
    return new Order(
      undefined as any,
      data.userId,
      data.amount,
      undefined,
      undefined,
      new Date(),
      new Date(),
    );
  }

  applyPromoCode(promoCodeId: string, discountAmount: number): void {
    this.promoCodeId = promoCodeId;
    this.discountAmount = discountAmount;
  }

  getFinalAmount(): number {
    return this.amount - (this.discountAmount || 0);
  }
}
```

### 2. DTO

**`modules/orders/api/dto/create-order.dto.ts`**
```typescript
export class CreateOrderDto {
  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 1000 })
  amount: number;
}
```

**`modules/orders/api/dto/order-query.dto.ts`**
```typescript
export class OrderQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  @IsMongoId()
  @ApiProperty({ required: false })
  userId?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @ApiProperty({ required: false })
  dateFrom?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @ApiProperty({ required: false })
  dateTo?: Date;
}
```

**`modules/orders/api/dto/order-response.dto.ts`**
```typescript
export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ required: false })
  promoCodeId?: string;

  @ApiProperty({ required: false })
  discountAmount?: number;

  @ApiProperty()
  finalAmount: number;

  @ApiProperty()
  createdAt: Date;
}
```

### 3. Event

**`modules/orders/application/events/order-created.event.ts`**
```typescript
export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly promoCode?: string,
    public readonly createdAt: Date = new Date(),
  ) {}
}
```

### 4. Application Service

**`modules/orders/application/orders.service.ts`**
```typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async create(
    dto: CreateOrderDto,
    userId: string,
  ): Promise<OrderReadModel> {
    // Создание entity
    const order = Order.create({
      userId,
      amount: dto.amount,
    });

    // Сохранение
    const saved = await this.orderRepository.create(order);

    // Публикация события
    await this.eventBus.publish(
      new OrderCreatedEvent(
        saved.id,
        saved.userId,
        saved.amount,
        undefined,
        new Date(),
      ),
    );

    return OrderMapper.toReadModel(saved);
  }

  async findAll(query: OrderQueryDto): Promise<PaginatedResult<OrderReadModel>> {
    const filter: OrderFilter = {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      userId: query.userId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    };

    const result = await this.orderRepository.findAll(filter);

    return {
      items: result.items.map((order) => OrderMapper.toReadModel(order)),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(id: string): Promise<OrderReadModel> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order', id);
    }
    return OrderMapper.toReadModel(order);
  }

  async findByUserId(userId: string): Promise<OrderReadModel[]> {
    const orders = await this.orderRepository.findByUserId(userId);
    return orders.map((order) => OrderMapper.toReadModel(order));
  }
}
```

### 5. Controller

**`modules/orders/api/orders.controller.ts`**
```typescript
@Controller('orders')
@ApiTags('Orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order' })
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser('id') userId: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.create(dto, userId);
  }

  @Get()
  @ApiPagination(OrderResponseDto)
  @ApiOperation({ summary: 'Get all orders' })
  async findAll(
    @Query() query: OrderQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    // Обычные пользователи видят только свои заказы
    if (query.userId && query.userId !== userId) {
      throw new ForbiddenException();
    }
    query.userId = userId;
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.findById(id);
    if (order.userId !== userId) {
      throw new ForbiddenException();
    }
    return order;
  }
}
```

## Интеграция с PromoCodes

Применение промокода к заказу происходит через PromoCodesService, который:
1. Обновляет заказ (добавляет promoCodeId и discountAmount)
2. Создаёт запись использования
3. Публикует событие для аналитики

## Тестирование

- Unit тесты для OrdersService
- E2E тесты для создания заказов
- Тесты фильтрации по пользователю

## Зависимости

- `@nestjs/mongoose`
- `mongoose`
- EventBus (Redis/BullMQ)
