import { ClickHouseClient, createClient } from '@clickhouse/client';
import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClickHouseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ClickHouseService.name);
    private client: ClickHouseClient;

    constructor(private readonly configService: ConfigService) {}

    async onModuleInit() {
        try {
            const host = this.configService.get<string>(
                'CLICKHOUSE_HOST',
                'localhost',
            );
            const port = parseInt(
                this.configService.get<string>('CLICKHOUSE_PORT', '8123'),
                10,
            );
            const database = this.configService.get<string>(
                'CLICKHOUSE_DATABASE',
                'analytics',
            );
            const username = this.configService.get<string>(
                'CLICKHOUSE_USER',
                'default',
            );
            const password = this.configService.get<string>(
                'CLICKHOUSE_PASSWORD',
                '',
            );

            // Простая конфигурация - без username/password для Docker
            this.client = createClient({
                url: `http://${host}:${port}`,
                database,
            });

            // Клиент создан, но не проверяем подключение автоматически
            // Проверка будет при первом использовании
            this.logger.log('ClickHouse client initialized');
        } catch (error) {
            this.logger.warn(
                'Failed to initialize ClickHouse client (non-blocking):',
                error instanceof Error ? error.message : error,
            );
            // Не бросаем ошибку, чтобы приложение могло запуститься
        }
    }

    async onModuleDestroy() {
        if (this.client) {
            await this.client.close();
            this.logger.log('ClickHouse disconnected');
        }
    }

    async ping(): Promise<void> {
        await this.client.ping();
    }

    async insert(
        table: string,
        data: Record<string, any> | Record<string, any>[],
    ): Promise<void> {
        const rows = Array.isArray(data) ? data : [data];

        await this.client.insert({
            table,
            values: rows,
            format: 'JSONEachRow',
        });
    }

    async query<T = any>(
        query: string,
        params?: Record<string, any>,
    ): Promise<T[]> {
        const result = await this.client.query({
            query,
            query_params: params,
            format: 'JSONEachRow',
        });

        const data = await result.json<T>();
        return data;
    }

    async execute(query: string): Promise<void> {
        await this.client.exec({
            query,
        });
    }

    isConnected(): boolean {
        return !!this.client;
    }

    async close(): Promise<void> {
        if (this.client) {
            await this.client.close();
        }
    }
}
