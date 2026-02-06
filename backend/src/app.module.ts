import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongoModule } from './modules/shared/database/mongo/mongo.module';
import { ClickHouseModule } from './modules/shared/database/clickhouse/clickhouse.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongoModule,
    ClickHouseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
