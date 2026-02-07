import { CreatePromoCodeDto } from '@promo-codes/api/dto/create-promo-code.dto';
import { PromoCodeQueryDto } from '@promo-codes/api/dto/promo-code-query.dto';
import { PromoCodeResponseDto } from '@promo-codes/api/dto/promo-code-response.dto';
import { UpdatePromoCodeDto } from '@promo-codes/api/dto/update-promo-code.dto';
import { PromoCode } from '@promo-codes/domain/entity/promo-code.entity';
import { PromoCodeRepository } from '@promo-codes/infrastructure/repositories/promo-code.repository';
import { PromoCodeDocument } from '@promo-codes/infrastructure/schemas/promo-code.schema';
import { ClientSession } from 'mongoose';
import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '@common/paginate/interfaces/paginated-result.interface';
import { PaginationUtil } from '@common/paginate/utils/pagination.util';

@Injectable()
export class PromoCodeService {
    constructor(private readonly promoCodeRepository: PromoCodeRepository) {}

    /**
     * Создать промокод
     */
    async create(dto: CreatePromoCodeDto): Promise<PromoCodeResponseDto> {
        // Нормализация кода в верхний регистр
        const normalizedCode = dto.code.toUpperCase();

        // Проверка существования
        const exists =
            await this.promoCodeRepository.existsByCode(normalizedCode);
        if (exists) {
            throw new ConflictException('Promo code already exists');
        }

        // Создание entity
        const promoCode = new PromoCode({
            code: normalizedCode,
            discountPercent: dto.discountPercent,
            totalLimit: dto.totalLimit,
            perUserLimit: dto.perUserLimit,
            usedCount: 0,
            isActive: true,
            startsAt: dto.startsAt,
            endsAt: dto.endsAt,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Сохранение
        const savedPromoCode = await this.promoCodeRepository.create(promoCode);

        return this.toResponseDto(savedPromoCode);
    }

    /**
     * Получить все промокоды с пагинацией
     */
    async findAll(
        query: PromoCodeQueryDto,
    ): Promise<PaginatedResult<PromoCodeResponseDto>> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'desc';

        // Построение фильтра
        const filter: Record<string, any> = {};

        if (query.search) {
            filter.code = {
                $regex: query.search.toUpperCase(),
                $options: 'i',
            };
        }

        if (query.isActive !== undefined) {
            filter.isActive = query.isActive;
        }

        // Получение данных с пагинацией
        const skip = PaginationUtil.getSkip(page, limit);
        const sort: Record<string, 1 | -1> = {
            [sortBy]: sortOrder === 'asc' ? 1 : -1,
        };

        // Используем прямой доступ к модели для пагинации
        const promoCodeModel = this.promoCodeRepository.getModel();
        const [docs, total] = await Promise.all([
            promoCodeModel
                .find(filter)
                .skip(skip)
                .limit(limit)
                .sort(sort)
                .exec(),
            promoCodeModel.countDocuments(filter).exec(),
        ]);

        const items = docs.map((doc: PromoCodeDocument) => {
            const promoCode = this.promoCodeRepository.mapDocumentToEntity(doc);
            return this.toResponseDto(promoCode);
        });

        return PaginationUtil.createPaginatedResult(items, total, page, limit);
    }

    /**
     * Получить промокод по ID
     */
    async findById(id: string): Promise<PromoCodeResponseDto> {
        const promoCode = await this.promoCodeRepository.findById(id);
        if (!promoCode) {
            throw new NotFoundException(`Promo code with ID ${id} not found`);
        }
        return this.toResponseDto(promoCode);
    }

    /**
     * Получить промокод по коду
     */
    async findByCode(
        code: string,
        session?: ClientSession,
    ): Promise<PromoCode | null> {
        return this.promoCodeRepository.findByCode(code.toUpperCase(), session);
    }

    /**
     * Обновить промокод
     */
    async update(
        id: string,
        dto: UpdatePromoCodeDto,
    ): Promise<PromoCodeResponseDto> {
        const promoCode = await this.promoCodeRepository.findById(id);
        if (!promoCode) {
            throw new NotFoundException(`Promo code with ID ${id} not found`);
        }

        // Обновление полей
        const updateData: Partial<PromoCode> = {};
        if (dto.discountPercent !== undefined) {
            updateData.discountPercent = dto.discountPercent;
        }
        if (dto.isActive !== undefined) {
            if (dto.isActive) {
                promoCode.activate();
            } else {
                promoCode.deactivate();
            }
            updateData.isActive = promoCode.isActive;
        }

        const updatedPromoCode = await this.promoCodeRepository.update(
            id,
            updateData as Partial<PromoCodeDocument>,
        );
        if (!updatedPromoCode) {
            throw new NotFoundException(`Promo code with ID ${id} not found`);
        }

        return this.toResponseDto(updatedPromoCode);
    }

    /**
     * Удалить промокод
     */
    async delete(id: string): Promise<void> {
        const promoCode = await this.promoCodeRepository.findById(id);
        if (!promoCode) {
            throw new NotFoundException(`Promo code with ID ${id} not found`);
        }
        await this.promoCodeRepository.delete(id);
    }

    /**
     * Преобразование Entity в Response DTO
     */
    private toResponseDto(promoCode: PromoCode): PromoCodeResponseDto {
        return {
            id: promoCode.id,
            code: promoCode.code,
            discountPercent: promoCode.discountPercent,
            totalLimit: promoCode.totalLimit,
            perUserLimit: promoCode.perUserLimit,
            usedCount: promoCode.usedCount,
            isActive: promoCode.isActive,
            startsAt: promoCode.startsAt,
            endsAt: promoCode.endsAt,
            createdAt: promoCode.createdAt,
            updatedAt: promoCode.updatedAt,
        };
    }
}
