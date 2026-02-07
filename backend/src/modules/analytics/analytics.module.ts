import { AnalyticsController } from '@analytics/api/controllers/analytics.controller';
import { AnalyticsService } from '@analytics/application/services/analytics.service';
import { UserAnalyticsConsumer } from '@analytics/infrastructure/consumers/user-analytics.consumer';
import { AnalyticsRepository } from '@analytics/infrastructure/repositories/analytics.repository';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClickHouseModule } from '@shared/database/clickhouse/clickhouse.module';

@Module({
    imports: [
        ClickHouseModule,
        BullModule.registerQueue({
            name: 'events', // Используем ту же очередь, что и EventBusModule
        }),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, AnalyticsRepository, UserAnalyticsConsumer],
    exports: [AnalyticsService],
})
export class AnalyticsModule {}
