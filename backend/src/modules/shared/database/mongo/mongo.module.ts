import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoService } from './mongo.service';

@Global()
@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                uri:
                    configService.get<string>('MONGODB_URI') ||
                    configService.get<string>('DATABASE_URL'),
                retryWrites: true,
                w: 'majority',
            }),
        }),
    ],
    providers: [MongoService],
    exports: [MongoService, MongooseModule],
})
export class MongoModule {}
