import { ApplyPromoCodeResponseDto } from '@promo-codes/api/dto/apply-promo-code-response.dto';
import { ApplyPromoCodeDto } from '@promo-codes/api/dto/apply-promo-code.dto';
import { CreatePromoCodeDto } from '@promo-codes/api/dto/create-promo-code.dto';
import { PromoCodeQueryDto } from '@promo-codes/api/dto/promo-code-query.dto';
import { PromoCodeResponseDto } from '@promo-codes/api/dto/promo-code-response.dto';
import { UpdatePromoCodeDto } from '@promo-codes/api/dto/update-promo-code.dto';
import { PromoCodeService } from '@promo-codes/application/services/promo-code.service';
import { ApplyPromoCodeUseCase } from '@promo-codes/application/use-cases/apply-promo-code.use-case';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import {
    ApiNoContentResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/auth/current-user.decorator';
import { JwtAuth } from '@common/decorators/auth/jwt-auth.decorator';
import { ApiErrorResponse } from '@common/decorators/response/api-error-response.decorator';
import { ApiPaginatedResponse } from '@common/decorators/response/api-paginated-response.decorator';
import { ApiSuccessResponseDecorator } from '@common/decorators/response/api-success-response.decorator';
import { PaginatedResult } from '@common/paginate/interfaces/paginated-result.interface';
import { OrderRepository } from '@orders/infrastructure/repositories/order.repository';
import { User } from '@users/domain/entity/user.entity';

@ApiTags('Promo Codes')
@Controller('promo-codes')
@JwtAuth() // Все роуты в контроллере защищены JWT
export class PromoCodesController {
    constructor(
        private readonly promoCodeService: PromoCodeService,
        private readonly applyPromoCodeUseCase: ApplyPromoCodeUseCase,
        private readonly orderRepository: OrderRepository,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a new promo code' })
    @ApiSuccessResponseDecorator(PromoCodeResponseDto, {
        status: 201,
        description: 'Promo code created successfully',
    })
    @ApiErrorResponse([400, 409])
    async create(
        @Body() createPromoCodeDto: CreatePromoCodeDto,
    ): Promise<PromoCodeResponseDto> {
        return this.promoCodeService.create(createPromoCodeDto);
    }

    @Post('apply')
    @ApiOperation({ summary: 'Apply promo code to order' })
    @ApiSuccessResponseDecorator(ApplyPromoCodeResponseDto, {
        description: 'Promo code applied successfully',
    })
    @ApiErrorResponse([400, 404])
    async apply(
        @Body() applyPromoCodeDto: ApplyPromoCodeDto,
        @CurrentUser() user: User,
    ): Promise<ApplyPromoCodeResponseDto> {
        // Получаем заказ для получения суммы
        const order = await this.orderRepository.findById(
            applyPromoCodeDto.orderId,
        );
        if (!order) {
            throw new NotFoundException(
                `Order with ID ${applyPromoCodeDto.orderId} not found`,
            );
        }

        // Проверяем, что заказ принадлежит текущему пользователю
        if (order.userId !== user.id) {
            throw new NotFoundException(
                `Order with ID ${applyPromoCodeDto.orderId} not found`,
            );
        }

        return this.applyPromoCodeUseCase.execute(
            applyPromoCodeDto.orderId,
            applyPromoCodeDto.promoCode,
            user.id,
            order.amount,
        );
    }

    @Get()
    @ApiOperation({ summary: 'Get all promo codes with pagination' })
    @ApiPaginatedResponse(PromoCodeResponseDto, {
        description: 'Promo codes retrieved successfully',
    })
    @ApiErrorResponse([400])
    async findAll(
        @Query() query: PromoCodeQueryDto,
    ): Promise<PaginatedResult<PromoCodeResponseDto>> {
        return this.promoCodeService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get promo code by ID' })
    @ApiParam({ name: 'id', description: 'Promo code ID' })
    @ApiSuccessResponseDecorator(PromoCodeResponseDto, {
        description: 'Promo code found',
    })
    @ApiErrorResponse([404])
    async findById(@Param('id') id: string): Promise<PromoCodeResponseDto> {
        return this.promoCodeService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update promo code' })
    @ApiParam({ name: 'id', description: 'Promo code ID' })
    @ApiSuccessResponseDecorator(PromoCodeResponseDto, {
        description: 'Promo code updated successfully',
    })
    @ApiErrorResponse([400, 404])
    async update(
        @Param('id') id: string,
        @Body() updatePromoCodeDto: UpdatePromoCodeDto,
    ): Promise<PromoCodeResponseDto> {
        return this.promoCodeService.update(id, updatePromoCodeDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete promo code' })
    @ApiParam({ name: 'id', description: 'Promo code ID' })
    @ApiNoContentResponse({ description: 'Promo code deleted successfully' })
    @ApiErrorResponse([404])
    async remove(@Param('id') id: string): Promise<void> {
        return this.promoCodeService.delete(id);
    }
}
