import { PromoCodesController } from '@promo-codes/api/controllers/promo-codes.controller';
import { ApplyPromoCodeResponseDto } from '@promo-codes/api/dto/apply-promo-code-response.dto';
import { ApplyPromoCodeDto } from '@promo-codes/api/dto/apply-promo-code.dto';
import { CreatePromoCodeDto } from '@promo-codes/api/dto/create-promo-code.dto';
import { PromoCodeQueryDto } from '@promo-codes/api/dto/promo-code-query.dto';
import { PromoCodeResponseDto } from '@promo-codes/api/dto/promo-code-response.dto';
import { UpdatePromoCodeDto } from '@promo-codes/api/dto/update-promo-code.dto';
import { PromoCodeService } from '@promo-codes/application/services/promo-code.service';
import { ApplyPromoCodeUseCase } from '@promo-codes/application/use-cases/apply-promo-code.use-case';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginatedResult } from '@common/paginate/interfaces/paginated-result.interface';
import { User } from '@users/domain/entity/user.entity';

describe('PromoCodesController', () => {
    let controller: PromoCodesController;

    const mockPromoCodeResponse: PromoCodeResponseDto = {
        id: '507f1f77bcf86cd799439011',
        code: 'SUMMER2024',
        discountPercent: 20,
        totalLimit: 100,
        perUserLimit: 1,
        usedCount: 0,
        isActive: true,
        startsAt: new Date('2024-01-01'),
        endsAt: new Date('2024-12-31'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };

    const mockPaginatedResult: PaginatedResult<PromoCodeResponseDto> = {
        items: [mockPromoCodeResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
    };

    const mockApplyResponse: ApplyPromoCodeResponseDto = {
        discountAmount: 100,
        finalAmount: 400,
        promoCode: 'SUMMER2024',
    };

    const mockUser: User = {
        id: '507f1f77bcf86cd799439012',
        email: 'test@example.com',
        passwordHash: 'hash',
        name: 'Test User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockPromoCodeService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockApplyPromoCodeUseCase = {
        execute: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PromoCodesController],
            providers: [
                {
                    provide: PromoCodeService,
                    useValue: mockPromoCodeService,
                },
                {
                    provide: ApplyPromoCodeUseCase,
                    useValue: mockApplyPromoCodeUseCase,
                },
            ],
        }).compile();

        controller = module.get<PromoCodesController>(PromoCodesController);

        jest.clearAllMocks();
    });

    describe('create', () => {
        const createDto: CreatePromoCodeDto = {
            code: 'SUMMER2024',
            discountPercent: 20,
            totalLimit: 100,
            perUserLimit: 1,
            startsAt: new Date('2024-01-01'),
            endsAt: new Date('2024-12-31'),
        };

        it('should create a promo code', async () => {
            mockPromoCodeService.create.mockResolvedValue(
                mockPromoCodeResponse,
            );

            const result = await controller.create(createDto);

            expect(mockPromoCodeService.create).toHaveBeenCalledWith(createDto);
            expect(result).toEqual(mockPromoCodeResponse);
        });

        it('should throw ConflictException if promo code exists', async () => {
            mockPromoCodeService.create.mockRejectedValue(
                new ConflictException('Promo code already exists'),
            );

            await expect(controller.create(createDto)).rejects.toThrow(
                ConflictException,
            );
            expect(mockPromoCodeService.create).toHaveBeenCalledWith(createDto);
        });
    });

    describe('apply', () => {
        const applyDto: ApplyPromoCodeDto = {
            orderId: '507f1f77bcf86cd799439013',
            promoCode: 'SUMMER2024',
        };

        it('should apply promo code', async () => {
            mockApplyPromoCodeUseCase.execute.mockResolvedValue(
                mockApplyResponse,
            );

            const result = await controller.apply(applyDto, mockUser);

            expect(mockApplyPromoCodeUseCase.execute).toHaveBeenCalledWith(
                applyDto.orderId,
                applyDto.promoCode,
                mockUser.id,
                500, // orderAmount заглушка
            );
            expect(result).toEqual(mockApplyResponse);
        });

        it('should throw NotFoundException if promo code not found', async () => {
            mockApplyPromoCodeUseCase.execute.mockRejectedValue(
                new NotFoundException('Promo code SUMMER2024 not found'),
            );

            await expect(controller.apply(applyDto, mockUser)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('findAll', () => {
        const queryDto: PromoCodeQueryDto = {
            page: 1,
            limit: 10,
        };

        it('should return paginated promo codes', async () => {
            mockPromoCodeService.findAll.mockResolvedValue(mockPaginatedResult);

            const result = await controller.findAll(queryDto);

            expect(mockPromoCodeService.findAll).toHaveBeenCalledWith(queryDto);
            expect(result).toEqual(mockPaginatedResult);
            expect(result.items).toHaveLength(1);
        });

        it('should pass query parameters to service', async () => {
            const searchQuery: PromoCodeQueryDto = {
                ...queryDto,
                search: 'SUMMER',
                isActive: true,
            };

            mockPromoCodeService.findAll.mockResolvedValue(mockPaginatedResult);

            await controller.findAll(searchQuery);

            expect(mockPromoCodeService.findAll).toHaveBeenCalledWith(
                searchQuery,
            );
        });
    });

    describe('findById', () => {
        const promoCodeId = '507f1f77bcf86cd799439011';

        it('should return promo code by id', async () => {
            mockPromoCodeService.findById.mockResolvedValue(
                mockPromoCodeResponse,
            );

            const result = await controller.findById(promoCodeId);

            expect(mockPromoCodeService.findById).toHaveBeenCalledWith(
                promoCodeId,
            );
            expect(result).toEqual(mockPromoCodeResponse);
        });

        it('should throw NotFoundException if promo code not found', async () => {
            mockPromoCodeService.findById.mockRejectedValue(
                new NotFoundException(
                    `Promo code with ID ${promoCodeId} not found`,
                ),
            );

            await expect(controller.findById(promoCodeId)).rejects.toThrow(
                NotFoundException,
            );
            expect(mockPromoCodeService.findById).toHaveBeenCalledWith(
                promoCodeId,
            );
        });
    });

    describe('update', () => {
        const promoCodeId = '507f1f77bcf86cd799439011';
        const updateDto: UpdatePromoCodeDto = {
            discountPercent: 25,
            isActive: false,
        };

        const updatedPromoCode: PromoCodeResponseDto = {
            ...mockPromoCodeResponse,
            ...updateDto,
        };

        it('should update promo code', async () => {
            mockPromoCodeService.update.mockResolvedValue(updatedPromoCode);

            const result = await controller.update(promoCodeId, updateDto);

            expect(mockPromoCodeService.update).toHaveBeenCalledWith(
                promoCodeId,
                updateDto,
            );
            expect(result).toEqual(updatedPromoCode);
        });

        it('should throw NotFoundException if promo code not found', async () => {
            mockPromoCodeService.update.mockRejectedValue(
                new NotFoundException(
                    `Promo code with ID ${promoCodeId} not found`,
                ),
            );

            await expect(
                controller.update(promoCodeId, updateDto),
            ).rejects.toThrow(NotFoundException);
            expect(mockPromoCodeService.update).toHaveBeenCalledWith(
                promoCodeId,
                updateDto,
            );
        });
    });

    describe('remove', () => {
        const promoCodeId = '507f1f77bcf86cd799439011';

        it('should delete promo code', async () => {
            mockPromoCodeService.delete.mockResolvedValue(undefined);

            await controller.remove(promoCodeId);

            expect(mockPromoCodeService.delete).toHaveBeenCalledWith(
                promoCodeId,
            );
        });

        it('should throw NotFoundException if promo code not found', async () => {
            mockPromoCodeService.delete.mockRejectedValue(
                new NotFoundException(
                    `Promo code with ID ${promoCodeId} not found`,
                ),
            );

            await expect(controller.remove(promoCodeId)).rejects.toThrow(
                NotFoundException,
            );
            expect(mockPromoCodeService.delete).toHaveBeenCalledWith(
                promoCodeId,
            );
        });
    });
});
