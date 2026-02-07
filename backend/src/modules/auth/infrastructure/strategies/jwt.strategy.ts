import { AuthService } from '@auth/application/services/auth.service';
import {
    JWT_ENV_KEYS,
    JWT_ERROR_MESSAGES,
} from '@auth/domain/constants/jwt.constants';
import { JwtPayload } from '@auth/domain/interfaces/jwt-payload.interface';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@users/domain/entity/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        const secretOrKey = configService.get<string>(JWT_ENV_KEYS.SECRET);
        if (!secretOrKey) {
            throw new Error(JWT_ERROR_MESSAGES.SECRET_NOT_CONFIGURED);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        super({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey,
            passReqToCallback: false,
        });
    }

    async validate(payload: JwtPayload): Promise<User> {
        const user = await this.authService.validateJwtPayload(payload);

        if (!user) {
            throw new UnauthorizedException('User not found or inactive');
        }

        // Возвращаемый объект будет доступен через @CurrentUser()
        return user;
    }
}
