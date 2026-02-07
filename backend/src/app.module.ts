import { AuthModule } from '@auth';
import { PromoCodesModule } from '@promo-codes';
import { UsersModule } from '@users';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClickHouseModule } from './modules/shared/database/clickhouse/clickhouse.module';
import { MongoModule } from './modules/shared/database/mongo/mongo.module';
import { EventBusModule } from './modules/shared/events/event-bus.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                redis: {
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: parseInt(
                        configService.get<string>('REDIS_PORT', '6379'),
                        10,
                    ),
                },
            }),
        }),
        MongoModule,
        ClickHouseModule,
        EventBusModule,
        UsersModule,
        AuthModule,
        PromoCodesModule,
    ],
})
export class AppModule {}
