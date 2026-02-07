import { CreatePromoCodeDto } from '@promo-codes/api/dto/create-promo-code.dto';
import { PromoCodeQueryDto } from '@promo-codes/api/dto/promo-code-query.dto';
import { UpdatePromoCodeDto } from '@promo-codes/api/dto/update-promo-code.dto';
import { PromoCodeService } from '@promo-codes/application/services/promo-code.service';
import { PromoCode } from '@promo-codes/domain/entity/promo-code.entity';
import { PromoCodeRepository } from '@promo-codes/infrastructure/repositories/promo-code.repository';
import { PromoCodeDocument } from '@promo-codes/infrastructure/schemas/promo-code.schema';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('PromoCodeService', () => {
    let service: PromoCodeService;

    const mockPromoCode = new PromoCode({
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
    });

    const mockPromoCodeDocument = {
        _id: { toString: () => mockPromoCode.id },
        code: mockPromoCode.code,
        discountPercent: mockPromoCode.discountPercent,
        totalLimit: mockPromoCode.totalLimit,
        perUserLimit: mockPromoCode.perUserLimit,
        usedCount: mockPromoCode.usedCount,
        isActive: mockPromoCode.isActive,
        startsAt: mockPromoCode.startsAt,
        endsAt: mockPromoCode.endsAt,
        createdAt: mockPromoCode.createdAt,
        updatedAt: mockPromoCode.updatedAt,
    } as unknown as PromoCodeDocument;

    const mockPromoCodeRepository = {
        existsByCode: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        findByCode: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        getModel: jest.fn(),
        mapDocumentToEntity: jest.fn(),
    };

    const mockModel = {
        find: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn(),
        countDocuments: jest.fn().mockReturnThis(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PromoCodeService,
                {
                    provide: PromoCodeRepository,
                    useValue: mockPromoCodeRepository,
                },
            ],
        }).compile();

        service = module.get<PromoCodeService>(PromoCodeService);

        jest.clearAllMocks();
        Object.values(mockPromoCodeRepository).forEach(mock => {
            if (jest.isMockFunction(mock)) {
                mock.mockReset();
            }
        });
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

        it('should create a promo code successfully', async () => {
            mockPromoCodeRepository.existsByCode.mockResolvedValue(false);
            mockPromoCodeRepository.create.mockResolvedValue(mockPromoCode);

            const result = await service.create(createDto);

            expect(mockPromoCodeRepository.existsByCode).toHaveBeenCalledWith(
                createDto.code.toUpperCase(),
            );
            expect(mockPromoCodeRepository.create).toHaveBeenCalled();
            expect(result).toMatchObject({
                code: createDto.code.toUpperCase(),
                discountPercent: createDto.discountPercent,
                totalLimit: createDto.totalLimit,
                perUserLimit: createDto.perUserLimit,
                isActive: true,
                usedCount: 0,
            });
            expect(result.id).toBeDefined();
        });

        it('should throw ConflictException if promo code already exists', async () => {
            mockPromoCodeRepository.existsByCode.mockResolvedValue(true);

            await expect(service.create(createDto)).rejects.toThrow(
                ConflictException,
            );
            await expect(service.create(createDto)).rejects.toThrow(
                'Promo code already exists',
            );
            expect(mockPromoCodeRepository.create).not.toHaveBeenCalled();
        });

        it('should convert code to uppercase', async () => {
            const dtoWithLowercase: CreatePromoCodeDto = {
                ...createDto,
                code: 'summer2024',
            };

            const createdPromoCode = {
                ...mockPromoCode,
                code: 'SUMMER2024',
            };

            mockPromoCodeRepository.existsByCode.mockResolvedValue(false);
            mockPromoCodeRepository.create.mockResolvedValue(createdPromoCode);

            const result = await service.create(dtoWithLowercase);

            expect(mockPromoCodeRepository.existsByCode).toHaveBeenCalledWith(
                'SUMMER2024',
            );
            expect(result.code).toBe('SUMMER2024');
        });
    });

    describe('findAll', () => {
        const queryDto: PromoCodeQueryDto = {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        };

        it('should return paginated promo codes', async () => {
            const mockDocs = [mockPromoCodeDocument];
            const mockTotal = 1;

            mockPromoCodeRepository.getModel.mockReturnValue(mockModel);
            mockModel.exec
                .mockResolvedValueOnce(mockDocs)
                .mockResolvedValueOnce(mockTotal);
            mockPromoCodeRepository.mapDocumentToEntity.mockReturnValue(
                mockPromoCode,
            );

            const result = await service.findAll(queryDto);

            expect(result).toHaveProperty('items');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('limit');
            expect(result.items).toHaveLength(1);
            expect(result.total).toBe(mockTotal);
        });

        it('should apply search filter', async () => {
            const searchQuery: PromoCodeQueryDto = {
                ...queryDto,
                search: 'SUMMER',
            };

            mockPromoCodeRepository.getModel.mockReturnValue(mockModel);
            mockModel.exec
                .mockResolvedValueOnce([mockPromoCodeDocument])
                .mockResolvedValueOnce(1);
            mockPromoCodeRepository.mapDocumentToEntity.mockReturnValue(
                mockPromoCode,
            );

            await service.findAll(searchQuery);

            expect(mockModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    code: expect.objectContaining({
                        $regex: 'SUMMER',
                        $options: 'i',
                    }) as Record<string, unknown>,
                }) as Record<string, unknown>,
            );
        });

        it('should apply isActive filter', async () => {
            const activeQuery: PromoCodeQueryDto = {
                ...queryDto,
                isActive: true,
            };

            mockPromoCodeRepository.getModel.mockReturnValue(mockModel);
            mockModel.exec
                .mockResolvedValueOnce([mockPromoCodeDocument])
                .mockResolvedValueOnce(1);
            mockPromoCodeRepository.mapDocumentToEntity.mockReturnValue(
                mockPromoCode,
            );

            await service.findAll(activeQuery);

            expect(mockModel.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    isActive: true,
                }),
            );
        });

        it('should use default pagination values', async () => {
            const emptyQuery: PromoCodeQueryDto = {};

            mockPromoCodeRepository.getModel.mockReturnValue(mockModel);
            mockModel.exec.mockResolvedValueOnce([]).mockResolvedValueOnce(0);
            mockPromoCodeRepository.mapDocumentToEntity.mockReturnValue(
                mockPromoCode,
            );

            const result = await service.findAll(emptyQuery);

            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
        });
    });

    describe('findById', () => {
        it('should return promo code by id', async () => {
            mockPromoCodeRepository.findById.mockResolvedValue(mockPromoCode);

            const result = await service.findById(mockPromoCode.id);

            expect(mockPromoCodeRepository.findById).toHaveBeenCalledWith(
                mockPromoCode.id,
            );
            expect(result).toMatchObject({
                id: mockPromoCode.id,
                code: mockPromoCode.code,
                discountPercent: mockPromoCode.discountPercent,
            });
        });

        it('should throw NotFoundException if promo code not found', async () => {
            mockPromoCodeRepository.findById.mockResolvedValue(null);

            await expect(service.findById('invalid-id')).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.findById('invalid-id')).rejects.toThrow(
                'Promo code with ID invalid-id not found',
            );
        });
    });

    describe('findByCode', () => {
        it('should return promo code by code', async () => {
            mockPromoCodeRepository.findByCode.mockResolvedValue(mockPromoCode);

            const result = await service.findByCode('SUMMER2024');

            expect(mockPromoCodeRepository.findByCode).toHaveBeenCalledWith(
                'SUMMER2024',
            );
            expect(result).toEqual(mockPromoCode);
        });

        it('should convert code to uppercase', async () => {
            mockPromoCodeRepository.findByCode.mockResolvedValue(mockPromoCode);

            await service.findByCode('summer2024');

            expect(mockPromoCodeRepository.findByCode).toHaveBeenCalledWith(
                'SUMMER2024',
            );
        });

        it('should return null if promo code not found', async () => {
            mockPromoCodeRepository.findByCode.mockResolvedValue(null);

            const result = await service.findByCode('INVALID');

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        const updateDto: UpdatePromoCodeDto = {
            discountPercent: 25,
            isActive: false,
        };

        const updatedPromoCode = new PromoCode({
            ...mockPromoCode,
            discountPercent: 25,
            isActive: false,
        });

        it('should update promo code successfully', async () => {
            mockPromoCodeRepository.findById.mockResolvedValue(mockPromoCode);
            mockPromoCodeRepository.update.mockResolvedValue(updatedPromoCode);

            const result = await service.update(mockPromoCode.id, updateDto);

            expect(mockPromoCodeRepository.findById).toHaveBeenCalledWith(
                mockPromoCode.id,
            );
            expect(mockPromoCodeRepository.update).toHaveBeenCalled();
            expect(result.discountPercent).toBe(updateDto.discountPercent);
            expect(result.isActive).toBe(updateDto.isActive);
        });

        it('should throw NotFoundException if promo code not found before update', async () => {
            mockPromoCodeRepository.findById.mockResolvedValue(null);

            await expect(
                service.update('invalid-id', updateDto),
            ).rejects.toThrow(NotFoundException);
            expect(mockPromoCodeRepository.update).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException if promo code not found after update', async () => {
            mockPromoCodeRepository.findById.mockResolvedValue(mockPromoCode);
            mockPromoCodeRepository.update.mockResolvedValue(null);

            await expect(
                service.update(mockPromoCode.id, updateDto),
            ).rejects.toThrow(NotFoundException);
        });

        it('should activate promo code when isActive is true', async () => {
            const activateDto: UpdatePromoCodeDto = {
                isActive: true,
            };

            const activatedPromoCode = new PromoCode({
                ...mockPromoCode,
                isActive: true,
            });

            mockPromoCodeRepository.findById.mockResolvedValue(mockPromoCode);
            mockPromoCodeRepository.update.mockResolvedValue(
                activatedPromoCode,
            );

            const result = await service.update(mockPromoCode.id, activateDto);

            expect(result.isActive).toBe(true);
        });

        it('should update only provided fields', async () => {
            const partialDto: UpdatePromoCodeDto = {
                discountPercent: 30,
            };

            const partiallyUpdatedPromoCode = new PromoCode({
                ...mockPromoCode,
                discountPercent: 30,
            });

            mockPromoCodeRepository.findById.mockResolvedValue(mockPromoCode);
            mockPromoCodeRepository.update.mockResolvedValue(
                partiallyUpdatedPromoCode,
            );

            const result = await service.update(mockPromoCode.id, partialDto);

            expect(result.discountPercent).toBe(partialDto.discountPercent);
            expect(result.isActive).toBe(mockPromoCode.isActive);
        });
    });

    describe('delete', () => {
        it('should delete promo code successfully', async () => {
            mockPromoCodeRepository.findById.mockResolvedValue(mockPromoCode);
            mockPromoCodeRepository.delete.mockResolvedValue(undefined);

            await service.delete(mockPromoCode.id);

            expect(mockPromoCodeRepository.findById).toHaveBeenCalledWith(
                mockPromoCode.id,
            );
            expect(mockPromoCodeRepository.delete).toHaveBeenCalledWith(
                mockPromoCode.id,
            );
        });

        it('should throw NotFoundException if promo code not found', async () => {
            mockPromoCodeRepository.findById.mockResolvedValue(null);

            await expect(service.delete('invalid-id')).rejects.toThrow(
                NotFoundException,
            );
            expect(mockPromoCodeRepository.delete).not.toHaveBeenCalled();
        });
    });
});
