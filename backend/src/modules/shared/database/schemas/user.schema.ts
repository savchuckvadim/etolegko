import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from '../entities/user.entity';

/**
 * Mongoose Schema - только для работы с БД
 * НЕ возвращаем Document напрямую, только через маппинг в Entity
 */
@Schema({ timestamps: true, collection: 'users' })
export class UserSchema {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchemaFactory = SchemaFactory.createForClass(UserSchema);

// Индексы
UserSchemaFactory.index({ email: 1 }, { unique: true });
UserSchemaFactory.index({ isActive: 1 });

export type UserDocument = HydratedDocument<UserSchema> & {
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Маппер: Document -> Entity
 * Всегда используем этот маппер, никогда не возвращаем Document напрямую
 */
export function mapUserDocumentToEntity(doc: UserDocument): User {
  return new User({
    id: doc._id.toString(),
    email: doc.email,
    passwordHash: doc.passwordHash,
    name: doc.name,
    phone: doc.phone,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}
