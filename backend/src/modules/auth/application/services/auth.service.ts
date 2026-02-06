import { AuthResponseDto } from '@auth/api/dto/auth-response.dto';
import { LoginDto } from '@auth/api/dto/login.dto';
import { RegisterDto } from '@auth/api/dto/register.dto';
import { JwtPayload } from '@auth/domain/interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@users/application/services/users.service';
import { User } from '@users/domain/entity/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Регистрация нового пользователя
     */
    async register(dto: RegisterDto): Promise<AuthResponseDto> {
        // Создание пользователя через UsersService
        // UsersService сам проверяет существование и хеширует пароль
        await this.usersService.create({
            email: dto.email,
            password: dto.password,
            name: dto.name,
            phone: dto.phone,
        });

        // Получаем полный объект User для генерации токенов
        const user = await this.usersService.findByEmailForAuth(dto.email);
        if (!user) {
            throw new ConflictException('Failed to create user');
        }

        // Генерация токенов
        const tokens = await this.generateTokens(user);

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
            },
        };
    }

    /**
     * Вход пользователя
     */
    async login(dto: LoginDto): Promise<AuthResponseDto> {
        // Получаем пользователя по email через репозиторий
        const user = await this.getUserByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Проверка активности
        if (!user.isActive) {
            throw new UnauthorizedException('User is inactive');
        }

        // Проверка пароля
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const isPasswordValid = (await bcrypt.compare(
            dto.password,
            user.passwordHash,
        )) as boolean;
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Генерация токенов
        const tokens = await this.generateTokens(user);

        return {
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
            },
        };
    }

    /**
     * Валидация пользователя для Local Strategy
     */
    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.getUserByEmail(email);
        if (!user) {
            return null;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const isPasswordValid = (await bcrypt.compare(
            password,
            user.passwordHash,
        )) as boolean;
        if (!isPasswordValid || !user.isActive) {
            return null;
        }

        return user;
    }

    /**
     * Валидация JWT payload
     */
    async validateJwtPayload(payload: JwtPayload): Promise<User | null> {
        try {
            const user = await this.usersService.findByEmailForAuth(
                payload.email,
            );
            if (!user || !user.isActive) {
                return null;
            }
            return user;
        } catch {
            return null;
        }
    }

    /**
     * Обновление access token через refresh token
     */
    async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            const refreshSecret =
                this.configService.get<string>('JWT_REFRESH_SECRET') ||
                this.configService.get<string>('JWT_SECRET');

            const payload = await this.jwtService.verifyAsync<JwtPayload>(
                refreshToken,
                {
                    secret: refreshSecret,
                },
            );

            const user = await this.usersService.findById(payload.sub);
            if (!user || !user.isActive) {
                throw new UnauthorizedException();
            }

            const newPayload: JwtPayload = {
                sub: user.id,
                email: user.email,
                name: user.name,
            };

            const jwtSecret = this.configService.get<string>('JWT_SECRET');
            const accessTokenExpiresIn: string =
                this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN') ||
                '15m';

            const signOptions = {
                secret: jwtSecret || 'default-secret',
                expiresIn: accessTokenExpiresIn,
            } as { secret: string; expiresIn: string };
            // @ts-expect-error - JWT library type mismatch: expiresIn accepts string but types expect StringValue
            const accessToken = await this.jwtService.signAsync(
                newPayload,
                signOptions,
            );

            return { accessToken };
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    /**
     * Генерация access и refresh токенов
     */
    private async generateTokens(user: User): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            name: user.name,
        };

        const jwtSecret = this.configService.get<string>('JWT_SECRET');
        const refreshSecret =
            this.configService.get<string>('JWT_REFRESH_SECRET') || jwtSecret;
        const accessTokenExpiresIn =
            this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN') ||
            '15m';
        const refreshTokenExpiresIn =
            this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN') ||
            '7d';

        const signOptions = {
            secret: jwtSecret || 'default-secret',
            expiresIn: accessTokenExpiresIn,
        } as { secret: string; expiresIn: string };
        const refreshSignOptions = {
            secret: refreshSecret || 'default-secret',
            expiresIn: refreshTokenExpiresIn,
        } as { secret: string; expiresIn: string };

        const [accessToken, refreshToken] = await Promise.all([
            // @ts-expect-error - JWT library type mismatch: expiresIn accepts string but types expect StringValue
            this.jwtService.signAsync(payload, signOptions),
            // @ts-expect-error - JWT library type mismatch: expiresIn accepts string but types expect StringValue
            this.jwtService.signAsync(payload, refreshSignOptions),
        ]);

        return { accessToken, refreshToken };
    }

    /**
     * Получить пользователя по email (внутренний метод)
     * Использует UsersService для доступа к passwordHash
     */
    private async getUserByEmail(email: string): Promise<User | null> {
        return this.usersService.findByEmailForAuth(email);
    }
}
