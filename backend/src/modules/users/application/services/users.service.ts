import * as bcrypt from 'bcrypt';
import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PaginatedResult } from '@common/paginate/interfaces/paginated-result.interface';
import { PaginationUtil } from '@common/paginate/utils/pagination.util';
import { CreateUserDto } from '@users/api/dto/create-user.dto';
import { UpdateUserDto } from '@users/api/dto/update-user.dto';
import { UserQueryDto } from '@users/api/dto/user-query.dto';
import { UserResponseDto } from '@users/api/dto/user-response.dto';
import { User } from '@users/domain/entity/user.entity';
import { UserRepository } from '@users/infrastructure/repositories/user.repository';
import { UserDocument } from '@users/infrastructure/schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UserRepository) {}

    /**
     * Создать пользователя
     */
    async create(dto: CreateUserDto): Promise<UserResponseDto> {
        // Проверка существования (email уже в нижнем регистре благодаря @IsEmailWithLowerCase)
        const exists = await this.userRepository.existsByEmail(dto.email);
        if (exists) {
            throw new ConflictException('User with this email already exists');
        }

        // Хеширование пароля
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const passwordHash: string = await bcrypt.hash(dto.password, 10);

        // Создание entity
        const user = new User({
            email: dto.email, // email уже в нижнем регистре
            passwordHash,
            name: dto.name,
            phone: dto.phone,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Сохранение
        const savedUser = await this.userRepository.create(user);

        return this.toResponseDto(savedUser);
    }

    /**
     * Получить всех пользователей с пагинацией
     */
    async findAll(
        query: UserQueryDto,
    ): Promise<PaginatedResult<UserResponseDto>> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = (query.sortOrder || 'desc') as 'asc' | 'desc';

        // Построение фильтра
        const filter: Record<string, any> = {};

        if (query.search) {
            filter.$or = [
                {
                    email: {
                        $regex: query.search,
                        $options: 'i',
                    },
                },
                {
                    name: {
                        $regex: query.search,
                        $options: 'i',
                    },
                },
            ];
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
        const userModel = this.userRepository.getModel();
        const [docs, total] = await Promise.all([
            userModel.find(filter).skip(skip).limit(limit).sort(sort).exec(),
            userModel.countDocuments(filter).exec(),
        ]);

        const items = docs.map((doc: UserDocument) => {
            const user = this.userRepository.mapDocumentToEntity(doc);
            return this.toResponseDto(user);
        });

        return PaginationUtil.createPaginatedResult(items, total, page, limit);
    }

    /**
     * Получить пользователя по ID
     */
    async findById(id: string): Promise<UserResponseDto> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return this.toResponseDto(user);
    }

    /**
     * Обновить пользователя
     */
    async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Обновление полей
        const updateData: Partial<User> = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.phone !== undefined) updateData.phone = dto.phone;
        if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

        const updatedUser = await this.userRepository.update(
            id,
            updateData as Partial<UserDocument>,
        );
        if (!updatedUser) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return this.toResponseDto(updatedUser);
    }

    /**
     * Удалить пользователя
     */
    async delete(id: string): Promise<void> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        await this.userRepository.delete(id);
    }

    /**
     * Получить пользователя по email (для аутентификации)
     * Возвращает Entity с passwordHash
     */
    async findByEmailForAuth(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }

    /**
     * Преобразование Entity в Response DTO
     */
    private toResponseDto(user: User): UserResponseDto {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
