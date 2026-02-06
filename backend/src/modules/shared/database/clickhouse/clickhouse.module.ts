import { Global, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClickHouseService } from './clickhouse.service';
import { ClickHouseMigrationService } from './clickhouse-migration.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ClickHouseService, ClickHouseMigrationService],
  exports: [ClickHouseService],
})
export class ClickHouseModule implements OnModuleInit {
  constructor(
    private readonly migrationService: ClickHouseMigrationService,
  ) {}

  async onModuleInit() {
    // Автоматическая инициализация таблиц
    await this.migrationService.runMigrations();
  }
}
