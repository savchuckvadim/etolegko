import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRepository } from '@shared/database/repositories/base.repository';
import { User } from '@users/domain/entity/user.entity';
import {
    mapUserDocumentToEntity,
    UserDocument,
} from '@users/infrastructure/schemas/user.schema';

/**
 * User Repository
 * Всегда возвращает Entity, никогда Document
 * Находится в infrastructure слое модуля users
 */
@Injectable()
export class UserRepository extends BaseRepository<UserDocument, User> {
    constructor(
        @InjectModel('UserSchema')
        private readonly userModel: Model<UserDocument>,
    ) {
        super(userModel);
    }

    protected mapToEntity(document: UserDocument): User {
        return mapUserDocumentToEntity(document);
    }

    /**
     * Найти по email
     */
    async findByEmail(email: string): Promise<User | null> {
        return this.findOne({ email: email.toLowerCase() });
    }

    /**
     * Проверить существование по email
     */
    async existsByEmail(email: string): Promise<boolean> {
        const user = await this.userModel
            .findOne({ email: email.toLowerCase() })
            .exec();
        return !!user;
    }

    /**
     * Получить модель для прямого доступа (используется для пагинации)
     */
    getModel(): Model<UserDocument> {
        return this.userModel;
    }
}
