# Mongoose Architecture - Production Standard

## Принципы архитектуры

### ✅ Правильно (Production-стандарт)

1. **Domain Entities** - чистая бизнес-логика, без зависимостей от Mongoose
2. **Mongoose Schemas** - только для работы с БД
3. **Маппинг Document -> Entity** - всегда возвращаем Entity, никогда Document
4. **Repositories** - абстракция над Mongoose, скрывает детали реализации

### ❌ Неправильно

1. ❌ Возвращать `Document` напрямую из сервисов
2. ❌ Использовать `Document` в бизнес-логике
3. ❌ Зависимость от Mongoose в domain entities
4. ❌ Прямое использование Mongoose моделей в сервисах

---

## Структура

```
src/modules/shared/database/
├── entities/              # Domain Entities (чистая бизнес-логика)
│   ├── user.entity.ts
│   ├── promo-code.entity.ts
│   └── index.ts
├── schemas/              # Mongoose Schemas (только для БД)
│   ├── user.schema.ts
│   ├── promo-code.schema.ts
│   └── index.ts
├── repositories/         # Repositories (маппинг Document -> Entity)
│   ├── base.repository.ts
│   ├── user.repository.ts
│   └── index.ts
└── mongo/               # Mongoose модуль и сервис
    ├── mongo.module.ts
    └── mongo.service.ts
```

---

## Domain Entities

**Чистые классы без зависимостей от Mongoose:**

```typescript
// entities/user.entity.ts
export class User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
```

---

## Mongoose Schemas

**Только для работы с БД, всегда с маппером:**

```typescript
// schemas/user.schema.ts
@Schema({ timestamps: true, collection: 'users' })
export class UserSchema {
  @Prop({ required: true, unique: true })
  email: string;
  
  @Prop({ required: true })
  passwordHash: string;
  
  // ... остальные поля
}

export type UserDocument = HydratedDocument<UserSchema>;

// ✅ ВАЖНО: Всегда маппим Document -> Entity
export function mapUserDocumentToEntity(doc: UserDocument): User {
  return new User({
    id: doc._id.toString(),
    email: doc.email,
    // ... остальные поля
  });
}
```

---

## Repositories

**Абстракция над Mongoose, всегда возвращает Entity:**

```typescript
// repositories/user.repository.ts
@Injectable()
export class UserRepository extends BaseRepository<UserDocument, User> {
  constructor(@InjectModel('UserSchema') private readonly userModel: Model<UserDocument>) {
    super(userModel);
  }

  protected mapToEntity(document: UserDocument): User {
    return mapUserDocumentToEntity(document);
  }

  // ✅ Всегда возвращаем Entity
  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ email }).exec();
    return doc ? this.mapToEntity(doc) : null;
  }
}
```

---

## Использование в сервисах

**Пример правильного использования:**

```typescript
// users/users.service.ts
@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  // ✅ Работаем только с Entity
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    // ✅ Создаем через репозиторий, получаем Entity
    return this.userRepository.create({
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
      name: data.name,
      phone: data.phone,
      isActive: true,
    });
  }
}
```

---

## Типизация

### ✅ Правильная типизация

```typescript
// Всегда работаем с Entity
const user: User = await this.userRepository.findById(id);
// TypeScript знает все поля User
console.log(user.email); // ✅ Типизировано
console.log(user.name);  // ✅ Типизировано
```

### ❌ Плохая типизация

```typescript
// ❌ НЕ ДЕЛАТЬ ТАК
const userDoc: UserDocument = await this.userModel.findById(id);
// Document имеет много лишних полей Mongoose
```

---

## Регистрация схем в модулях

```typescript
// users/users.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, UserSchemaFactory } from '../shared/database/schemas/user.schema';
import { UserRepository } from '../shared/database/repositories/user.repository';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'UserSchema', schema: UserSchemaFactory },
    ]),
  ],
  providers: [UserRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## Транзакции

```typescript
// Использование транзакций через MongoService
async applyPromoCode(orderId: string, promoCode: string, userId: string) {
  const session = await this.mongoService.startSession();
  
  try {
    return await session.withTransaction(async () => {
      // Все операции в транзакции
      const promo = await this.promoCodeRepository.findByCode(promoCode);
      // ...
    });
  } finally {
    await session.endSession();
  }
}
```

---

## Преимущества этой архитектуры

1. ✅ **Строгая типизация** - работаем только с Entity
2. ✅ **Чистая архитектура** - domain entities не зависят от Mongoose
3. ✅ **Тестируемость** - легко мокировать репозитории
4. ✅ **Гибкость** - можно заменить Mongoose на другой ODM без изменения бизнес-логики
5. ✅ **Production-ready** - стандартный подход в NestJS

---

## Ссылки

- [NestJS Mongoose Documentation](https://docs.nestjs.com/techniques/mongodb)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
