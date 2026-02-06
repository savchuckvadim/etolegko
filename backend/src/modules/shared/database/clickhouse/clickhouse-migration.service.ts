import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { ClickHouseService } from './clickhouse.service';

@Injectable()
export class ClickHouseMigrationService implements OnModuleInit {
  private readonly logger = new Logger(ClickHouseMigrationService.name);
  private readonly migrationsPath = join(__dirname, 'migrations');

  constructor(private readonly clickhouseService: ClickHouseService) {}

  async onModuleInit() {
    await this.runMigrations();
  }

  async runMigrations(): Promise<void> {
    try {
      if (!existsSync(this.migrationsPath)) {
        this.logger.warn(`Migrations directory not found: ${this.migrationsPath}`);
        return;
      }

      const files = readdirSync(this.migrationsPath)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      if (files.length === 0) {
        this.logger.warn('No migration files found');
        return;
      }

      for (const file of files) {
        this.logger.log(`Running migration: ${file}`);
        const sql = readFileSync(join(this.migrationsPath, file), 'utf-8');
        await this.clickhouseService.execute(sql);
        this.logger.log(`Migration completed: ${file}`);
      }
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }
}
