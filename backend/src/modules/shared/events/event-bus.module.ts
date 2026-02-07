import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { RedisEventBus } from './redis-event-bus';

/**
 * Модуль EventBus для публикации доменных событий
 * Использует Bull/Redis для асинхронной обработки событий
 */
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
