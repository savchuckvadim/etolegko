import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    DocumentBuilder,
    SwaggerDocumentOptions,
    SwaggerModule,
} from '@nestjs/swagger';

export const getSwaggerConfig = (app: INestApplication) => {
    const configService = app.get(ConfigService);
    const appName = configService.get<string>('APP_NAME') || 'API';
    const appDescription =
        configService.get<string>('APP_DESCRIPTION') || 'API Documentation';

    const config = new DocumentBuilder()
        .setTitle(appName)
        .setDescription(appDescription)
        .setVersion('1.0')
        .addTag(appName)
        .build();

    const options: SwaggerDocumentOptions = {
        operationIdFactory: (controllerKey: string, methodKey: string) => {
            const cleanController = controllerKey.replace(/Controller$/i, '');
            return `${cleanController}_${methodKey}`;
        },
        deepScanRoutes: true,
    };

    // Обработка ошибок при создании документации
    try {
        const documentFactory = () => {
            try {
                return SwaggerModule.createDocument(app, config, options);
            } catch (error) {
                console.error('❌ Swagger document creation error:', error);
                if (error instanceof Error) {
                    console.error('Error message:', error.message);
                    console.error('Error stack:', error.stack);
                }
                throw error;
            }
        };

        SwaggerModule.setup('docs', app, documentFactory);
    } catch (error) {
        console.error('❌ Swagger setup error:', error);
        // Не прерываем запуск приложения, просто логируем ошибку
    }
};
