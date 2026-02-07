import { OrdersController } from '@orders/api/controllers/orders.controller';
import { OrderService } from '@orders/application/services/order.service';
import { CreateOrderUseCase } from '@orders/application/use-cases/create-order.use-case';
import { OrderAnalyticsConsumer } from '@orders/infrastructure/consumers/order-analytics.consumer';
import { OrderRepository } from '@orders/infrastructure/repositories/order.repository';
import { OrderSchemaFactory } from '@orders/infrastructure/schemas/order.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventBusModule } from '@shared/events/event-bus.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: 'OrderSchema',
                schema: OrderSchemaFactory,
            },
        ]),
        EventBusModule,
    ],
    controllers: [OrdersController],
    providers: [
        OrderService,
        OrderRepository,
        CreateOrderUseCase,
        OrderAnalyticsConsumer,
    ],
    exports: [OrderService, OrderRepository],
})
export class OrdersModule {}
