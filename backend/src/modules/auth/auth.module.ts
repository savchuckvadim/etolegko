import { AuthController } from '@auth/api/controllers/auth.controller';
import { AuthService } from '@auth/application/services/auth.service';
import {
    JWT_DEFAULTS,
    JWT_ENV_KEYS,
} from '@auth/domain/constants/jwt.constants';
import { JwtStrategy } from '@auth/infrastructure/strategies/jwt.strategy';
import { LocalStrategy } from '@auth/infrastructure/strategies/local.strategy';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '@users/users.module';

@Module({
    imports: [
        UsersModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService): JwtModuleOptions => {
                const expiresIn =
                    configService.get<string>(
                        JWT_ENV_KEYS.ACCESS_TOKEN_EXPIRES_IN,
                    ) || JWT_DEFAULTS.ACCESS_TOKEN_EXPIRES_IN;
                return {
                    secret:
                        configService.get<string>(JWT_ENV_KEYS.SECRET) ||
                        JWT_DEFAULTS.SECRET,
                    signOptions: {
                        // expiresIn может быть string (например, "15m", "7d") или number (секунды)
                        // Библиотека jsonwebtoken принимает оба типа, но TypeScript типы неполные
                        // StringValue - это специальный тип из библиотеки, не просто string
                        expiresIn: expiresIn as unknown as number | undefined,
                    },
                };
            },
        }),
    ],
    providers: [AuthService, JwtStrategy, LocalStrategy],
    controllers: [AuthController],
    exports: [AuthService, PassportModule],
})
export class AuthModule {}
