import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClickHouseMigrationService } from './clickhouse-migration.service';
import { ClickHouseService } from './clickhouse.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [ClickHouseService, ClickHouseMigrationService],
    exports: [ClickHouseService],
})
export class ClickHouseModule {}
