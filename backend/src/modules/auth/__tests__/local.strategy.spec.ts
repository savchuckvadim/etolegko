import { AuthService } from '@auth/application/services/auth.service';
import { LocalStrategy } from '@auth/infrastructure/strategies/local.strategy';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@users/domain/entity/user.entity';

describe('LocalStrategy', () => {
    let strategy: LocalStrategy;
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

    const email = 'test@example.com';
    const password = 'password123';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LocalStrategy,
                {
                    provide: AuthService,
                    useValue: {
                        validateUser: jest.fn(),
                    },
                },
            ],
        }).compile();

        strategy = module.get<LocalStrategy>(LocalStrategy);
        mockAuthService = module.get(AuthService);

        jest.clearAllMocks();
    });

    describe('validate', () => {
        it('should return user if credentials are valid', async () => {
            mockAuthService.validateUser = jest
                .fn()
                .mockResolvedValue(mockUser);

            const result = await strategy.validate(email, password);

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const validateUserSpy = mockAuthService.validateUser;
            expect(validateUserSpy).toHaveBeenCalledWith(email, password);
            expect(result).toEqual(mockUser);
        });

        it('should throw UnauthorizedException if user not found', async () => {
            mockAuthService.validateUser.mockResolvedValue(null);

            await expect(strategy.validate(email, password)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(strategy.validate(email, password)).rejects.toThrow(
                'Invalid email or password',
            );
        });

        it('should throw UnauthorizedException if password is invalid', async () => {
            mockAuthService.validateUser.mockResolvedValue(null);

            await expect(strategy.validate(email, password)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
