import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class ClickHouseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ClickHouseService.name);
  private client: ClickHouseClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const host = this.configService.get<string>('CLICKHOUSE_HOST', 'localhost');
      const port = parseInt(this.configService.get<string>('CLICKHOUSE_PORT', '8123'), 10);
      const database = this.configService.get<string>('CLICKHOUSE_DATABASE', 'analytics');
      const username = this.configService.get<string>('CLICKHOUSE_USER', 'default');
      const password = this.configService.get<string>('CLICKHOUSE_PASSWORD', '');

      this.client = createClient({
        host: `http://${host}:${port}`,
        database,
        username,
        password,
      });

      // Проверка подключения
      await this.ping();
      this.logger.log('ClickHouse connected');
    } catch (error) {
      this.logger.error('Failed to connect to ClickHouse:', error);
      throw error;
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
    return data as T[];
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
