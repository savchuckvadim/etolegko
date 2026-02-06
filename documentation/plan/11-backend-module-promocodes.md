# Backend: PromoCodes Module

## Назначение

Модуль для управления промокодами: создание, обновление, применение с валидацией лимитов и сроков действия.

## Структура

```
src/
├── modules/
│   ├── promo-codes/
│   │   ├── promo-codes.module.ts
│   │   ├── api/
│   │   │   ├── promo-codes.controller.ts
│   │   │   └── dto/
│   │   │       ├── create-promo-code.dto.ts
│   │   │       ├── update-promo-code.dto.ts
│   │   │       ├── apply-promo-code.dto.ts
│   │   │       ├── promo-code-query.dto.ts
│   │   │       └── promo-code-response.dto.ts
│   │   ├── application/
│   │   │   ├── promo-code.service.ts
│   │   │   ├── interfaces/
│   │   │   │   └── promo-code-repository.interface.ts
│   │   │   └── events/
│   │   │       └── promo-code-applied.event.ts
│   │   ├── domain/
│   │   │   ├── promo-code.entity.ts
│   │   │   └── constants/
│   │   │       └── promo-code-errors.const.ts
│   │   └── infrastructure/
│   │       ├── schemas/
│   │       │   └── promo-code.schema.ts
│   │       └── repositories/
│   │           └── promo-code.repository.ts
```

## Реализация

### 1. Domain Entity

**`modules/promo-codes/domain/promo-code.entity.ts`**
```typescript
export class PromoCode {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly discountPercent: number,
    public readonly totalLimit: number,
    public readonly perUserLimit: number,
    private usedCount: number = 0,
    private isActive: boolean = true,
    public readonly startsAt?: Date,
    public readonly endsAt?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(data: {
    code: string;
    discountPercent: number;
    totalLimit: number;
    perUserLimit: number;
    startsAt?: Date;
    endsAt?: Date;
  }): PromoCode {
    return new PromoCode(
      undefined as any,
      data.code.toUpperCase(),
      data.discountPercent,
      data.totalLimit,
      data.perUserLimit,
      0,
      true,
      data.startsAt,
      data.endsAt,
      new Date(),
      new Date(),
    );
  }

  validateUsage(userId: string, userUsageCount: number): void {
    if (!this.isActive) {
      throw new BusinessException(
        PROMO_CODE_ERRORS.NOT_ACTIVE,
        'Promo code is not active',
      );
    }

    if (this.usedCount >= this.totalLimit) {
      throw new BusinessException(
        PROMO_CODE_ERRORS.LIMIT_EXCEEDED,
        'Promo code total limit exceeded',
      );
    }

    if (userUsageCount >= this.perUserLimit) {
      throw new BusinessException(
        PROMO_CODE_ERRORS.USER_LIMIT_EXCEEDED,
        'User limit exceeded',
      );
    }

    const now = new Date();
    if (this.startsAt && now < this.startsAt) {
      throw new BusinessException(
        PROMO_CODE_ERRORS.NOT_STARTED,
        'Promo code has not started yet',
      );
    }

    if (this.endsAt && now > this.endsAt) {
      throw new BusinessException(
        PROMO_CODE_ERRORS.EXPIRED,
        'Promo code has expired',
      );
    }
  }

  calculateDiscount(amount: number): number {
    return (amount * this.discountPercent) / 100;
  }

  incrementUsage(): void {
    this.usedCount += 1;
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }

  getUsedCount(): number {
    return this.usedCount;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
}
```

### 2. Domain Constants

**`modules/promo-codes/domain/constants/promo-code-errors.const.ts`**
```typescript
export const PROMO_CODE_ERRORS = {
  NOT_ACTIVE: 'PROMO_CODE_NOT_ACTIVE',
  LIMIT_EXCEEDED: 'PROMO_CODE_LIMIT_EXCEEDED',
  USER_LIMIT_EXCEEDED: 'PROMO_CODE_USER_LIMIT_EXCEEDED',
  NOT_STARTED: 'PROMO_CODE_NOT_STARTED',
  EXPIRED: 'PROMO_CODE_EXPIRED',
  NOT_FOUND: 'PROMO_CODE_NOT_FOUND',
} as const;
```

### 3. DTO

**`modules/promo-codes/api/dto/create-promo-code.dto.ts`**
```typescript
export class CreatePromoCodeDto {
  @IsString()
  @Matches(/^[A-Z0-9]+$/, { message: 'Code must contain only uppercase letters and numbers' })
  @ApiProperty({ example: 'SUMMER2024' })
  code: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @ApiProperty({ example: 20 })
  discountPercent: number;

  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 100 })
  totalLimit: number;

  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 1 })
  perUserLimit: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @ApiProperty({ required: false })
  startsAt?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @ApiProperty({ required: false })
  endsAt?: Date;
}
```

**`modules/promo-codes/api/dto/apply-promo-code.dto.ts`**
```typescript
export class ApplyPromoCodeDto {
  @IsString()
  @IsMongoId()
  @ApiProperty()
  orderId: string;

  @IsString()
  @ApiProperty({ example: 'SUMMER2024' })
  promoCode: string;
}
```

### 4. Event

**`modules/promo-codes/application/events/promo-code-applied.event.ts`**
```typescript
export class PromoCodeAppliedEvent {
  constructor(
    public readonly promoCodeId: string,
    public readonly promoCode: string,
    public readonly userId: string,
    public readonly orderId: string,
    public readonly orderAmount: number,
    public readonly discountAmount: number,
    public readonly createdAt: Date,
  ) {}
}
```

### 5. Application Service

**`modules/promo-codes/application/promo-code.service.ts`**
```typescript
@Injectable()
export class PromoCodeService {
  constructor(
    private readonly promoCodeRepository: PromoCodeRepository,
    private readonly orderRepository: OrderRepository,
    private readonly promoCodeUsageRepository: PromoCodeUsageRepository,
    private readonly eventBus: EventBus,
    private readonly mongoService: MongoService,
  ) {}

  async create(dto: CreatePromoCodeDto): Promise<PromoCodeReadModel> {
    // Проверка уникальности
    const exists = await this.promoCodeRepository.exists(dto.code.toUpperCase());
    if (exists) {
      throw new ConflictException('Promo code already exists');
    }

    // Создание entity
    const promoCode = PromoCode.create({
      code: dto.code,
      discountPercent: dto.discountPercent,
      totalLimit: dto.totalLimit,
      perUserLimit: dto.perUserLimit,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
    });

    // Сохранение
    const saved = await this.promoCodeRepository.create(promoCode);
    return PromoCodeMapper.toReadModel(saved);
  }

  async applyPromoCode(
    orderId: string,
    promoCode: string,
    userId: string,
  ): Promise<ApplyPromoCodeResult> {
    const session = await this.mongoService.startSession();

    try {
      return await session.withTransaction(async () => {
        // 1. Найти промокод
        const promo = await this.promoCodeRepository.findByCode(
          promoCode.toUpperCase(),
        );
        if (!promo) {
          throw new NotFoundException('PromoCode', promoCode);
        }

        // 2. Найти заказ
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
          throw new NotFoundException('Order', orderId);
        }

        if (order.userId !== userId) {
          throw new ForbiddenException('Order does not belong to user');
        }

        // 3. Проверить использование пользователем
        const userUsageCount =
          await this.promoCodeUsageRepository.countByUserAndPromoCode(
            userId,
            promo.id,
          );

        // 4. Валидация
        promo.validateUsage(userId, userUsageCount);

        // 5. Расчёт скидки
        const discountAmount = promo.calculateDiscount(order.amount);
        const finalAmount = order.amount - discountAmount;

        // 6. Обновить заказ
        await this.orderRepository.update(orderId, {
          promoCodeId: promo.id,
          discountAmount,
        });

        // 7. Увеличить счётчик использований
        promo.incrementUsage();
        await this.promoCodeRepository.update(promo.id, {
          usedCount: promo.getUsedCount(),
        });

        // 8. Создать запись использования
        await this.promoCodeUsageRepository.create({
          promoCodeId: promo.id,
          userId,
          orderId,
          discountAmount,
        });

        // 9. Публикация события (после успешной транзакции)
        await this.eventBus.publish(
          new PromoCodeAppliedEvent(
            promo.id,
            promo.code,
            userId,
            orderId,
            order.amount,
            discountAmount,
            new Date(),
          ),
        );

        return {
          discountAmount,
          finalAmount,
          promoCode: promo.code,
        };
      });
    } finally {
      await session.endSession();
    }
  }

  async findAll(query: PromoCodeQueryDto): Promise<PaginatedResult<PromoCodeReadModel>> {
    const filter: PromoCodeFilter = {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      isActive: query.isActive,
      search: query.search,
    };

    const result = await this.promoCodeRepository.findAll(filter);

    return {
      items: result.items.map((pc) => PromoCodeMapper.toReadModel(pc)),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(id: string): Promise<PromoCodeReadModel> {
    const promoCode = await this.promoCodeRepository.findById(id);
    if (!promoCode) {
      throw new NotFoundException('PromoCode', id);
    }
    return PromoCodeMapper.toReadModel(promoCode);
  }

  async update(id: string, dto: UpdatePromoCodeDto): Promise<PromoCodeReadModel> {
    const promoCode = await this.promoCodeRepository.findById(id);
    if (!promoCode) {
      throw new NotFoundException('PromoCode', id);
    }

    const updateData: Partial<PromoCode> = {};
    if (dto.discountPercent !== undefined) {
      updateData.discountPercent = dto.discountPercent;
    }
    if (dto.isActive !== undefined) {
      dto.isActive ? promoCode.activate() : promoCode.deactivate();
    }

    const updated = await this.promoCodeRepository.update(id, updateData);
    return PromoCodeMapper.toReadModel(updated);
  }
}
```

### 6. Controller

**`modules/promo-codes/api/promo-codes.controller.ts`**
```typescript
@Controller('promo-codes')
@ApiTags('Promo Codes')
@UseGuards(JwtAuthGuard)
export class PromoCodesController {
  constructor(private readonly promoCodeService: PromoCodeService) {}

  @Post()
  @ApiOperation({ summary: 'Create promo code' })
  async create(@Body() dto: CreatePromoCodeDto): Promise<PromoCodeResponseDto> {
    return this.promoCodeService.create(dto);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply promo code to order' })
  async apply(
    @Body() dto: ApplyPromoCodeDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApplyPromoCodeResult> {
    return this.promoCodeService.applyPromoCode(
      dto.orderId,
      dto.promoCode,
      userId,
    );
  }

  @Get()
  @ApiPagination(PromoCodeResponseDto)
  @ApiOperation({ summary: 'Get all promo codes' })
  async findAll(@Query() query: PromoCodeQueryDto): Promise<PaginatedResult<PromoCodeResponseDto>> {
    return this.promoCodeService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promo code by id' })
  async findById(@Param('id') id: string): Promise<PromoCodeResponseDto> {
    return this.promoCodeService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update promo code' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePromoCodeDto,
  ): Promise<PromoCodeResponseDto> {
    return this.promoCodeService.update(id, dto);
  }
}
```

## Обработка Race Conditions

Для предотвращения race conditions при применении промокода:

1. Использование MongoDB транзакций
2. Оптимистичная блокировка через версию документа
3. Уникальный индекс на `(promoCodeId, userId, orderId)` в PromoCodeUsage

## Тестирование

- Unit тесты для PromoCodeService
- Тесты валидации промокодов
- Тесты применения промокодов
- Тесты race conditions
- E2E тесты

## Зависимости

- `@nestjs/mongoose`
- `mongoose`
- EventBus (Redis/BullMQ)
