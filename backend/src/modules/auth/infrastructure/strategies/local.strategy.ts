import { AuthService } from '@auth/application/services/auth.service';
import { Strategy } from 'passport-local';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@users/domain/entity/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
    constructor(private readonly authService: AuthService) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        super({
            usernameField: 'email', // Используем email вместо username
            passwordField: 'password',
        });
    }

    async validate(email: string, password: string): Promise<User> {
        const user = await this.authService.validateUser(email, password);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Возвращаемый объект будет доступен через @CurrentUser()
        return user;
    }
}
