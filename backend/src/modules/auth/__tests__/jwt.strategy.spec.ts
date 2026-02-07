import { AuthService } from '@auth/application/services/auth.service';
import { JWT_ENV_KEYS } from '@auth/domain/constants/jwt.constants';
import { JwtStrategy } from '@auth/infrastructure/strategies/jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@users/domain/entity/user.entity';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let mockAuthService: jest.Mocked<AuthService>;

    const mockUser = new User({
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        passwordHash: 'hashedPassword',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    });

    const mockPayload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
    };

    beforeEach(async () => {
        // Создаем mock ConfigService с правильной реализацией
        const mockConfigServiceValue = {
            get: jest.fn((key: string) => {
                if (key === JWT_ENV_KEYS.SECRET) return 'test-secret';
                return undefined;
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtStrategy,
                {
                    provide: AuthService,
                    useValue: {
                        validateJwtPayload: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigServiceValue,
                },
            ],
        }).compile();

        strategy = module.get<JwtStrategy>(JwtStrategy);
        mockAuthService = module.get(AuthService);

        jest.clearAllMocks();
    });

    describe('validate', () => {
        it('should return user if payload is valid', async () => {
            mockAuthService.validateJwtPayload = jest
                .fn()
                .mockResolvedValue(mockUser);

            const result = await strategy.validate(mockPayload);

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const validateJwtPayloadSpy = mockAuthService.validateJwtPayload;
            expect(validateJwtPayloadSpy).toHaveBeenCalledWith(mockPayload);
            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            mockAuthService.validateJwtPayload.mockResolvedValue(null);

            await expect(strategy.validate(mockPayload)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(strategy.validate(mockPayload)).rejects.toThrow(
                'User not found or inactive',
            );
        });

        it('should throw UnauthorizedException if user is inactive', async () => {
            mockAuthService.validateJwtPayload.mockResolvedValue(null);

            await expect(strategy.validate(mockPayload)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
