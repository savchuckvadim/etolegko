import { CreateOrderDto } from '@orders/api/dto/create-order.dto';
import { OrderQueryDto } from '@orders/api/dto/order-query.dto';
import { OrderResponseDto } from '@orders/api/dto/order-response.dto';
import { UpdateOrderDto } from '@orders/api/dto/update-order.dto';
import { OrderService } from '@orders/application/services/order.service';
import { CreateOrderUseCase } from '@orders/application/use-cases/create-order.use-case';
import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
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
import { User } from '@users/domain/entity/user.entity';

@ApiTags('Orders')
@Controller('orders')
@JwtAuth() // Все роуты в контроллере защищены JWT
export class OrdersController {
    constructor(
        private readonly orderService: OrderService,
        private readonly createOrderUseCase: CreateOrderUseCase,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create a new order' })
    @ApiSuccessResponseDecorator(OrderResponseDto, {
        status: 201,
        description: 'Order created successfully',
    })
    @ApiErrorResponse([400])
    async create(
        @Body() createOrderDto: CreateOrderDto,
        @CurrentUser() user: User,
    ): Promise<OrderResponseDto> {
        return this.createOrderUseCase.execute(createOrderDto, user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get all orders with pagination' })
    @ApiPaginatedResponse(OrderResponseDto, {
        description: 'Orders retrieved successfully',
    })
    @ApiErrorResponse([400, 403])
    async findAll(
        @Query() query: OrderQueryDto,
        @CurrentUser() user: User,
    ): Promise<PaginatedResult<OrderResponseDto>> {
        // Обычные пользователи видят только свои заказы
        if (query.userId && query.userId !== user.id) {
            throw new ForbiddenException('You can only view your own orders');
        }
        // Устанавливаем userId для фильтрации
        query.userId = user.id;
        return this.orderService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order by ID' })
    @ApiParam({ name: 'id', description: 'Order ID' })
    @ApiSuccessResponseDecorator(OrderResponseDto, {
        description: 'Order found',
    })
    @ApiErrorResponse([403, 404])
    async findById(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ): Promise<OrderResponseDto> {
        const order = await this.orderService.findById(id);
        if (order.userId !== user.id) {
            throw new ForbiddenException('You can only view your own orders');
        }
        return order;
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update order' })
    @ApiParam({ name: 'id', description: 'Order ID' })
    @ApiSuccessResponseDecorator(OrderResponseDto, {
        description: 'Order updated successfully',
    })
    @ApiErrorResponse([400, 403, 404])
    async update(
        @Param('id') id: string,
        @Body() updateOrderDto: UpdateOrderDto,
        @CurrentUser() user: User,
    ): Promise<OrderResponseDto> {
        const order = await this.orderService.findById(id);
        if (order.userId !== user.id) {
            throw new ForbiddenException('You can only update your own orders');
        }
        return this.orderService.update(id, updateOrderDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete order' })
    @ApiParam({ name: 'id', description: 'Order ID' })
    @ApiNoContentResponse({ description: 'Order deleted successfully' })
    @ApiErrorResponse([403, 404])
    async remove(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ): Promise<void> {
        const order = await this.orderService.findById(id);
        if (order.userId !== user.id) {
            throw new ForbiddenException('You can only delete your own orders');
        }
        return this.orderService.delete(id);
    }
}
