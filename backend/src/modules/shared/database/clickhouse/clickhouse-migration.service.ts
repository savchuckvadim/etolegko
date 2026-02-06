import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClickHouseService } from './clickhouse.service';

@Injectable()
export class ClickHouseMigrationService implements OnModuleInit {
    private readonly logger = new Logger(ClickHouseMigrationService.name);
    private readonly migrationsPath = this.getMigrationsPath();

    constructor(private readonly clickhouseService: ClickHouseService) {}

    private getMigrationsPath(): string {
        // Сначала проверяем dist (production)
        const distPath = join(__dirname, 'migrations');
        if (existsSync(distPath)) {
            return distPath;
        }
        // Если нет в dist, используем исходники (dev режим)
        const srcPath = join(
            process.cwd(),
            'src',
            'modules',
            'shared',
            'database',
            'clickhouse',
            'migrations',
        );
        return srcPath;
    }

    async onModuleInit() {
        // Миграции отключены по умолчанию
        // Запускайте вручную через CLI или когда ClickHouse настроен
        // await this.runMigrations();
    }

    async runMigrations(): Promise<void> {
        try {
            // Проверяем подключение перед миграциями
            await this.clickhouseService.ping();
        } catch {
            this.logger.warn(
                'ClickHouse connection check failed, skipping migrations',
            );
            return;
        }

        try {
            if (!existsSync(this.migrationsPath)) {
                this.logger.warn(
                    `Migrations directory not found: ${this.migrationsPath}`,
                );
                return;
            }

            const files = readdirSync(this.migrationsPath)
                .filter(file => file.endsWith('.sql'))
                .sort();

            if (files.length === 0) {
                this.logger.warn('No migration files found');
                return;
            }

            for (const file of files) {
                try {
                    this.logger.log(`Running migration: ${file}`);
                    const sql = readFileSync(
                        join(this.migrationsPath, file),
                        'utf-8',
                    );
                    await this.clickhouseService.execute(sql);
                    this.logger.log(`Migration completed: ${file}`);
                } catch (error) {
                    this.logger.warn(
                        `Migration ${file} failed (non-blocking):`,
                        error instanceof Error ? error.message : error,
                    );
                    // Не прерываем выполнение, продолжаем с другими миграциями
                }
            }
        } catch (error) {
            this.logger.warn(
                'Migrations initialization failed (non-blocking):',
                error instanceof Error ? error.message : error,
            );
            // Не бросаем ошибку, чтобы приложение могло запуститься
        }
    }
}
