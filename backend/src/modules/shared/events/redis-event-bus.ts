import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from './event-bus.interface';

/**
 * Реализация EventBus через Redis/Bull
 * Отправляет события в очередь для асинхронной обработки
 */
@Injectable()
export class RedisEventBus implements EventBus {
    private readonly logger = new Logger(RedisEventBus.name);

    constructor(@InjectQueue('events') private readonly queue: Queue) {}

    async publish(event: object): Promise<void> {
        const eventName = event.constructor.name;

        try {
            // Публикуем основное событие
            await this.queue.add(eventName, event, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: 100, // Хранить последние 100 завершенных задач
                removeOnFail: 1000, // Хранить последние 1000 неудачных задач
            });

            // Для событий, которые нужно обработать в UserAnalyticsConsumer,
            // публикуем дополнительное событие с суффиксом :Users
            if (
                eventName === 'OrderCreatedEvent' ||
                eventName === 'PromoCodeAppliedEvent'
            ) {
                await this.queue.add(`${eventName}:Users`, event, {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                    removeOnComplete: 100,
                    removeOnFail: 1000,
                });
            }

            this.logger.debug(`Event published: ${eventName}`);
        } catch (error) {
            this.logger.error(
                `Failed to publish event ${eventName}:`,
                error instanceof Error ? error.message : error,
            );
            throw error;
        }
    }
}
