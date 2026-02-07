# Event Bus & Queue System для синхронизации MongoDB → ClickHouse

## Обзор

Система Event Bus реализует асинхронную синхронизацию данных из MongoDB (OLTP) в ClickHouse (OLAP) через очередь Redis/Bull. Это позволяет разделить транзакционные операции и аналитику, обеспечивая высокую производительность и масштабируемость.

## Архитектура

```
┌─────────────────┐
│  Application    │
│     Service     │
└────────┬────────┘
         │
         │ 1. Бизнес-логика
         │    (MongoDB Write)
         │
         ▼
┌─────────────────┐
│   Use Case      │
│  (Orchestrator) │
└────────┬────────┘
         │
         │ 2. Публикация события
         │    eventBus.publish(event)
         │
         ▼
┌─────────────────┐
│   Event Bus     │
│  (Redis/Bull)   │
└────────┬────────┘
         │
         │ 3. Очередь событий
         │    (асинхронная обработка)
         │
         ▼
┌─────────────────┐
│    Consumer     │
│  (@Process)     │
└────────┬────────┘
         │
         │ 4. Обработка события
         │    (запись в ClickHouse)
         │
         ▼
┌─────────────────┐
│   ClickHouse    │
│    (Analytics)  │
└─────────────────┘
```

## Компоненты системы

### 1. Event Bus Interface

**Файл:** `src/modules/shared/events/event-bus.interface.ts`

```typescript
/**
 * Интерфейс EventBus для публикации доменных событий
 * Используется для асинхронной синхронизации данных MongoDB → ClickHouse
 */
export interface EventBus {
    /**
     * Публикует событие в очередь для последующей обработки
     * @param event - доменное событие
     */
    publish(event: object): Promise<void>;
}
```

**Назначение:**
- Абстракция для публикации событий
- Позволяет легко заменить реализацию (Redis, RabbitMQ, Kafka и т.д.)

### 2. Redis Event Bus

**Файл:** `src/modules/shared/events/redis-event-bus.ts`

```typescript
@Injectable()
export class RedisEventBus implements EventBus {
    constructor(@InjectQueue('events') private readonly queue: Queue) {}

    async publish(event: object): Promise<void> {
        const eventName = event.constructor.name;
        
        await this.queue.add(eventName, event, {
            attempts: 3,                    // 3 попытки при ошибке
            backoff: {
                type: 'exponential',       // Экспоненциальная задержка
                delay: 2000,               // Начальная задержка 2 секунды
            },
            removeOnComplete: 100,         // Хранить последние 100 завершенных задач
            removeOnFail: 1000,            // Хранить последние 1000 неудачных задач
        });
    }
}
```

**Особенности:**
- Использует Bull (обертка над Redis) для управления очередями
- Автоматические повторные попытки при ошибках
- Exponential backoff для снижения нагрузки
- Логирование успешных и неудачных операций

### 3. Event Bus Module

**Файл:** `src/modules/shared/events/event-bus.module.ts`

```typescript
@Module({
    imports: [
        BullModule.registerQueue({
            name: 'events',
        }),
    ],
    providers: [
        RedisEventBus,
        {
            provide: 'EventBus',
            useClass: RedisEventBus,
        },
    ],
    exports: ['EventBus', RedisEventBus],
})
export class EventBusModule {}
```

**Назначение:**
- Регистрирует очередь `events` в Bull
- Предоставляет `EventBus` через dependency injection
- Экспортирует для использования в других модулях

### 4. Доменные события

**Пример:** `src/modules/promo-codes/application/events/promo-code-applied.event.ts`

```typescript
/**
 * Событие применения промокода
 * Используется для публикации в EventBus и записи в ClickHouse
 */
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

**Принципы:**
- События - это простые классы с данными
- Имя события = имя класса (используется `event.constructor.name`)
- События содержат только необходимые данные для аналитики

### 5. Use Case (Orchestrator)

**Пример:** `src/modules/promo-codes/application/use-cases/apply-promo-code.use-case.ts`

```typescript
@Injectable()
export class ApplyPromoCodeUseCase {
    constructor(
        private readonly promoCodeService: PromoCodeService,
        @Inject('EventBus') private readonly eventBus: EventBus,
    ) {}

    async execute(...): Promise<ApplyPromoCodeResponseDto> {
        // 1. Бизнес-логика (получение промокода, расчет скидки)
        const promoCodeEntity = await this.promoCodeService.findByCode(promoCode);
        const discountAmount = promoCodeEntity.calculateDiscount(orderAmount);

        // 2. Публикация события
        await this.eventBus.publish(
            new PromoCodeAppliedEvent(...)
        );

        // 3. Возврат результата
        return { discountAmount, finalAmount, promoCode };
    }
}
```

**Назначение:**
- Координирует бизнес-логику и публикацию событий
- Разделяет ответственность: сервис = логика, use case = координация
- Упрощает тестирование и поддержку

### 6. Consumer (Обработчик событий)

**Пример:** `src/modules/promo-codes/infrastructure/consumers/promo-code-analytics.consumer.ts`

```typescript
@Processor('events')
@Injectable()
export class PromoCodeAnalyticsConsumer {
    constructor(private readonly clickhouse: ClickHouseService) {}

    @Process('PromoCodeAppliedEvent')
    async handlePromoCodeApplied(job: Job<PromoCodeAppliedEvent>): Promise<void> {
        const event = job.data;

        try {
            await this.clickhouse.insert('promo_code_usages_analytics', {
                event_date: eventDate.toISOString().split('T')[0],
                created_at: event.createdAt.toISOString(),
                promo_code: event.promoCode,
                promo_code_id: event.promoCodeId,
                user_id: event.userId,
                order_id: event.orderId,
                order_amount: event.orderAmount,
                discount_amount: event.discountAmount,
            });

            this.logger.log(`Promo code usage recorded: ${event.promoCode}`);
        } catch (error) {
            this.logger.error(`Failed to record promo code usage: ${event.promoCode}`, error);
            throw error; // Пробрасываем для повторной попытки
        }
    }
}
```

**Особенности:**
- `@Processor('events')` - указывает очередь для обработки
- `@Process('PromoCodeAppliedEvent')` - указывает тип события
- Автоматическая обработка ошибок с повторными попытками
- Логирование успешных и неудачных операций

## Поток данных

### Пример: Применение промокода

1. **Controller** получает запрос `POST /promo-codes/apply`
   ```typescript
   async apply(@Body() dto: ApplyPromoCodeDto, @CurrentUser() user: User) {
       return this.applyPromoCodeUseCase.execute(...);
   }
   ```

2. **Use Case** выполняет бизнес-логику и публикует событие
   ```typescript
   // Бизнес-логика
   const promoCode = await this.promoCodeService.findByCode(code);
   const discount = promoCode.calculateDiscount(amount);
   
   // Публикация события
   await this.eventBus.publish(new PromoCodeAppliedEvent(...));
   ```

3. **Event Bus** добавляет событие в очередь Redis
   ```typescript
   await this.queue.add('PromoCodeAppliedEvent', event, { attempts: 3 });
   ```

4. **Consumer** обрабатывает событие из очереди
   ```typescript
   @Process('PromoCodeAppliedEvent')
   async handlePromoCodeApplied(job: Job<PromoCodeAppliedEvent>) {
       await this.clickhouse.insert('promo_code_usages_analytics', data);
   }
   ```

5. **ClickHouse** получает данные для аналитики
   - Данные записываются в таблицу `promo_code_usages_analytics`
   - Готовы для аналитических запросов

## Преимущества архитектуры

### 1. Разделение ответственности
- **MongoDB** - транзакционные операции (быстрые, ACID)
- **ClickHouse** - аналитика (агрегации, отчеты)
- **Очередь** - асинхронная синхронизация (не блокирует основной поток)

### 2. Производительность
- Запись в MongoDB не блокируется записью в ClickHouse
- ClickHouse получает данные асинхронно, не влияя на время ответа API
- Повторные попытки при ошибках не влияют на пользователя

### 3. Масштабируемость
- Можно добавить несколько Consumer'ов для параллельной обработки
- Можно добавить новые типы событий без изменения существующего кода
- Легко заменить реализацию EventBus (Redis → RabbitMQ → Kafka)

### 4. Надежность
- Автоматические повторные попытки при ошибках
- Логирование всех операций
- Ограничение хранения задач для контроля памяти

## Настройка

### 1. Redis конфигурация

**Файл:** `src/app.module.ts`

```typescript
BullModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
        redis: {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
        },
    }),
}),
```

**Переменные окружения:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. Регистрация Consumer'ов

**Файл:** `src/modules/promo-codes/promo-codes.module.ts`

```typescript
@Module({
    imports: [EventBusModule],
    providers: [
        PromoCodeAnalyticsConsumer, // Автоматически регистрируется как Consumer
    ],
})
export class PromoCodesModule {}
```

## Мониторинг

### Bull Dashboard (опционально)

Для визуального мониторинга очередей можно использовать Bull Dashboard:

```typescript
// main.ts
import { BullBoardModule } from '@bull-board/nestjs';
import { BullAdapter } from '@bull-board/api/bullAdapter';

BullBoardModule.forRoot({
    route: '/admin/queues',
    adapter: BullAdapter,
});
```

Доступ: `http://localhost:3000/admin/queues`

### Логирование

Все операции логируются:
- Успешная публикация события: `Event published: PromoCodeAppliedEvent`
- Успешная запись в ClickHouse: `Promo code usage recorded: SUMMER2024`
- Ошибки: `Failed to publish event` / `Failed to record promo code usage`

## Добавление новых событий

### Шаг 1: Создать событие

```typescript
// src/modules/orders/application/events/order-created.event.ts
export class OrderCreatedEvent {
    constructor(
        public readonly orderId: string,
        public readonly userId: string,
        public readonly amount: number,
        public readonly createdAt: Date,
    ) {}
}
```

### Шаг 2: Публиковать событие в Use Case

```typescript
// src/modules/orders/application/use-cases/create-order.use-case.ts
async execute(...) {
    // Бизнес-логика
    const order = await this.orderService.create(...);
    
    // Публикация события
    await this.eventBus.publish(
        new OrderCreatedEvent(order.id, userId, amount, new Date())
    );
    
    return order;
}
```

### Шаг 3: Создать Consumer

```typescript
// src/modules/orders/infrastructure/consumers/order-analytics.consumer.ts
@Processor('events')
@Injectable()
export class OrderAnalyticsConsumer {
    constructor(private readonly clickhouse: ClickHouseService) {}

    @Process('OrderCreatedEvent')
    async handleOrderCreated(job: Job<OrderCreatedEvent>): Promise<void> {
        const event = job.data;
        await this.clickhouse.insert('orders_analytics', {
            event_date: new Date(event.createdAt).toISOString().split('T')[0],
            created_at: event.createdAt.toISOString(),
            order_id: event.orderId,
            user_id: event.userId,
            amount: event.amount,
        });
    }
}
```

### Шаг 4: Зарегистрировать Consumer в модуле

```typescript
@Module({
    providers: [
        OrderAnalyticsConsumer,
    ],
})
export class OrdersModule {}
```

## Тестирование

### Unit тесты для Consumer

```typescript
describe('PromoCodeAnalyticsConsumer', () => {
    it('should insert data into ClickHouse', async () => {
        mockClickHouseService.insert.mockResolvedValue(undefined);
        
        await consumer.handlePromoCodeApplied(mockJob);
        
        expect(mockClickHouseService.insert).toHaveBeenCalledWith(
            'promo_code_usages_analytics',
            expect.objectContaining({
                promo_code: 'SUMMER2024',
            }),
        );
    });
});
```

### Unit тесты для Use Case

```typescript
describe('ApplyPromoCodeUseCase', () => {
    it('should publish event after applying promo code', async () => {
        mockPromoCodeService.findByCode.mockResolvedValue(mockPromoCode);
        mockEventBus.publish.mockResolvedValue(undefined);
        
        await useCase.execute(...);
        
        expect(mockEventBusValue.publish).toHaveBeenCalledWith(
            expect.any(PromoCodeAppliedEvent),
        );
    });
});
```

## Резюме

Система Event Bus & Queue обеспечивает:
- ✅ Асинхронную синхронизацию MongoDB → ClickHouse
- ✅ Высокую производительность (не блокирует основной поток)
- ✅ Надежность (повторные попытки, логирование)
- ✅ Масштабируемость (легко добавлять новые события)
- ✅ Разделение ответственности (транзакции vs аналитика)
