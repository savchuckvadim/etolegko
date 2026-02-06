import { AuthController } from '@auth/api/controllers/auth.controller';
import { AuthService } from '@auth/application/services/auth.service';
import { JwtStrategy } from '@auth/infrastructure/strategies/jwt.strategy';
import { LocalStrategy } from '@auth/infrastructure/strategies/local.strategy';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '@users/users.module';

@Module({
    imports: [
        UsersModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret:
                    configService.get<string>('JWT_SECRET') || 'default-secret',
                signOptions: {
                    expiresIn:
                        configService.get<string>(
                            'JWT_ACCESS_TOKEN_EXPIRES_IN',
                        ) || '15m',
                },
            }),
        }),
    ],
    providers: [AuthService, JwtStrategy, LocalStrategy],
    controllers: [AuthController],
    exports: [AuthService, PassportModule],
})
export class AuthModule {}
