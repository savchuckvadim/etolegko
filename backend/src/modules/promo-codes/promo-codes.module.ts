import { AnalyticsModule } from '@analytics/analytics.module';
import { OrdersModule } from '@orders/orders.module';
import { PromoCodesController } from '@promo-codes/api/controllers/promo-codes.controller';
import { PromoCodeService } from '@promo-codes/application/services/promo-code.service';
import { ApplyPromoCodeUseCase } from '@promo-codes/application/use-cases/apply-promo-code.use-case';
import { PromoCodeAnalyticsConsumer } from '@promo-codes/infrastructure/consumers/promo-code-analytics.consumer';
import { PromoCodeRepository } from '@promo-codes/infrastructure/repositories/promo-code.repository';
import { PromoCodeSchemaFactory } from '@promo-codes/infrastructure/schemas/promo-code.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventBusModule } from '@shared/events/event-bus.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: 'PromoCodeSchema',
                schema: PromoCodeSchemaFactory,
            },
        ]),
        EventBusModule,
        OrdersModule,
        AnalyticsModule,
    ],
    controllers: [PromoCodesController],
    providers: [
        PromoCodeService,
        PromoCodeRepository,
        ApplyPromoCodeUseCase,
        PromoCodeAnalyticsConsumer,
    ],
    exports: [PromoCodeService, PromoCodeRepository],
})
export class PromoCodesModule {}
