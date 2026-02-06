import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { cors } from '@common/config/cors/cors.config';
import { getSwaggerConfig } from '@common/config/swagger/swagger.config';
import { AppModule } from './app.module';

// Загружаем .env файл перед инициализацией приложения
config();

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: cors,
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        snapshot: true,
        // logger: WinstonModule.createLogger({ instance: winstonLogger }),
    });
    getSwaggerConfig(app);
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );
    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
