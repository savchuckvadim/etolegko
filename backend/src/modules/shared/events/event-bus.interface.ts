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
