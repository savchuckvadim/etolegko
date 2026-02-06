import { AuthModule } from '@auth';
import { UsersModule } from '@users';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClickHouseModule } from './modules/shared/database/clickhouse/clickhouse.module';
import { MongoModule } from './modules/shared/database/mongo/mongo.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        MongoModule,
        ClickHouseModule,
        UsersModule,
        AuthModule,
    ],
})
export class AppModule {}
