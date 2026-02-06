import { AuthResponseDto } from '@auth/api/dto/auth-response.dto';
import { LoginDto } from '@auth/api/dto/login.dto';
import { RefreshTokenResponseDto } from '@auth/api/dto/refresh-token-response.dto';
import { RefreshTokenDto } from '@auth/api/dto/refresh-token.dto';
import { RegisterDto } from '@auth/api/dto/register.dto';
import { UserMeResponseDto } from '@auth/api/dto/user-me-response.dto';
import { AuthService } from '@auth/application/services/auth.service';
import { LocalAuthGuard } from '@auth/infrastructure/guards/local-auth.guard';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/auth/current-user.decorator';
import { JwtAuth } from '@common/decorators/auth/jwt-auth.decorator';
import { Public } from '@common/decorators/auth/public.decorator';
import { ApiErrorResponse } from '@common/decorators/response/api-error-response.decorator';
import { ApiSuccessResponseDecorator } from '@common/decorators/response/api-success-response.decorator';
import { User } from '@users/domain/entity/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @Public() // Публичный эндпоинт
    @ApiOperation({ summary: 'Register new user' })
    @ApiSuccessResponseDecorator(AuthResponseDto, {
        status: 201,
        description: 'User registered successfully',
    })
    @ApiErrorResponse([400, 409])
    async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
        return this.authService.register(dto);
    }

    @Post('login')
    @Public() // Публичный эндпоинт
    @UseGuards(LocalAuthGuard)
    @ApiOperation({ summary: 'Login user' })
    @ApiSuccessResponseDecorator(AuthResponseDto, {
        description: 'User logged in successfully',
    })
    @ApiErrorResponse([400, 401])
    async login(
        @Body() dto: LoginDto,
        @CurrentUser() _user: User,
    ): Promise<AuthResponseDto> {
        return this.authService.login(dto);
    }

    @Post('refresh')
    @Public() // Публичный эндпоинт
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiSuccessResponseDecorator(RefreshTokenResponseDto, {
        description: 'Token refreshed successfully',
    })
    @ApiErrorResponse([400, 401])
    async refresh(
        @Body() dto: RefreshTokenDto,
    ): Promise<{ accessToken: string }> {
        return this.authService.refreshToken(dto.refreshToken);
    }

    @Get('me')
    @JwtAuth() // Защищенный эндпоинт
    @ApiOperation({ summary: 'Get current user' })
    @ApiSuccessResponseDecorator(UserMeResponseDto, {
        description: 'Current user information',
    })
    @ApiErrorResponse([401])
    getMe(@CurrentUser() user: User) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
