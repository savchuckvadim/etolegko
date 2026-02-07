import {
    Body,
    Controller,
    Delete,
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
import { JwtAuth } from '@common/decorators/auth/jwt-auth.decorator';
import { ApiErrorResponse } from '@common/decorators/response/api-error-response.decorator';
import { ApiPaginatedResponse } from '@common/decorators/response/api-paginated-response.decorator';
import { ApiSuccessResponseDecorator } from '@common/decorators/response/api-success-response.decorator';
import { PaginatedResult } from '@common/paginate/interfaces/paginated-result.interface';
import { CreateUserDto } from '@users/api/dto/create-user.dto';
import { UpdateUserDto } from '@users/api/dto/update-user.dto';
import { UserQueryDto } from '@users/api/dto/user-query.dto';
import { UserResponseDto } from '@users/api/dto/user-response.dto';
import { UsersService } from '@users/application/services/users.service';

@ApiTags('Users')
@Controller('users')
@JwtAuth() // Все роуты в контроллере защищены JWT
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new user' })
    @ApiSuccessResponseDecorator(UserResponseDto, {
        status: 201,
        description: 'User created successfully',
    })
    @ApiErrorResponse([400, 409])
    async create(
        @Body() createUserDto: CreateUserDto,
    ): Promise<UserResponseDto> {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all users with pagination' })
    @ApiPaginatedResponse(UserResponseDto, {
        description: 'Users retrieved successfully',
    })
    @ApiErrorResponse([400])
    async findAll(
        @Query() query: UserQueryDto,
    ): Promise<PaginatedResult<UserResponseDto>> {
        return this.usersService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiSuccessResponseDecorator(UserResponseDto, {
        description: 'User found',
    })
    @ApiErrorResponse([404])
    async findOne(@Param('id') id: string): Promise<UserResponseDto> {
        return this.usersService.findById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update user' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiSuccessResponseDecorator(UserResponseDto, {
        description: 'User updated successfully',
    })
    @ApiErrorResponse([400, 404])
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete user' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiNoContentResponse({ description: 'User deleted successfully' })
    @ApiErrorResponse([404])
    async remove(@Param('id') id: string): Promise<void> {
        return this.usersService.delete(id);
    }
}
