import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';
import { User } from '../entities/user.entity';
import { UserDocument, mapUserDocumentToEntity } from '../schemas/user.schema';

/**
 * User Repository
 * Всегда возвращает Entity, никогда Document
 */
@Injectable()
export class UserRepository extends BaseRepository<UserDocument, User> {
  constructor(@InjectModel('UserSchema') private readonly userModel: Model<UserDocument>) {
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
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
    return !!user;
  }
}
