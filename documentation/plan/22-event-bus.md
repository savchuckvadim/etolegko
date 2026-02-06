# Backend: Event Bus Implementation

## Назначение

Реализация Event Bus через Redis/BullMQ для асинхронной синхронизации данных MongoDB → ClickHouse.

## Структура

```
src/
├── modules/
│   ├── shared/
│   │   ├── events/
│   │   │   ├── event-bus.interface.ts
│   │   │   ├── redis-event-bus.ts
│   │   │   └── event-bus.module.ts
```

## Реализация

### Event Bus Interface

**`modules/shared/events/event-bus.interface.ts`**
```typescript
export interface EventBus {
  publish(event: any): Promise<void>;
}
```

### Redis Event Bus

**`modules/shared/events/redis-event-bus.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventBus } from './event-bus.interface';

@Injectable()
export class RedisEventBus implements EventBus {
  constructor(@InjectQueue('events') private queue: Queue) {}

  async publish(event: any): Promise<void> {
    await this.queue.add(event.constructor.name, event, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }
}
```

### Event Bus Module

**`modules/shared/events/event-bus.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisEventBus } from './redis-event-bus';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'events',
    }),
  ],
  providers: [
    {
      provide: 'EventBus',
      useClass: RedisEventBus,
    },
  ],
  exports: ['EventBus'],
})
export class EventBusModule {}
```

## Использование

```typescript
constructor(
  @Inject('EventBus') private eventBus: EventBus,
) {}

async applyPromoCode() {
  // ... бизнес-логика
  
  await this.eventBus.publish(
    new PromoCodeAppliedEvent(...),
  );
}
```

## Зависимости

- `@nestjs/bull`
- `bull`
- `ioredis`
