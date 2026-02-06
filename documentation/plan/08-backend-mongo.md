# Backend: MongoDB Setup

## Назначение

Настройка MongoDB как источника истины для транзакционных операций. Использование Mongoose для работы с данными.

## Структура

```
src/
├── modules/
│   ├── shared/
│   │   ├── database/
│   │   │   ├── mongo/
│   │   │   │   ├── mongo.module.ts
│   │   │   │   ├── mongo.service.ts
│   │   │   │   └── mongo.config.ts
│   │   │   └── schemas/
│   │   │       ├── user.schema.ts
│   │   │       ├── promo-code.schema.ts
│   │   │       ├── order.schema.ts
│   │   │       └── promo-code-usage.schema.ts
```

## Реализация

### 1. MongoDB Module

**`modules/shared/database/mongo/mongo.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoService } from './mongo.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('MONGODB_DB_NAME'),
        retryWrites: true,
        w: 'majority',
      }),
    }),
  ],
  providers: [MongoService],
  exports: [MongoService, MongooseModule],
})
export class MongoModule {}
```

### 2. MongoDB Service

**`modules/shared/database/mongo/mongo.service.ts`**
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  constructor(@InjectConnection() private connection: Connection) {}

  async onModuleInit() {
    await this.connection.on('connected', () => {
      console.log('MongoDB connected');
    });

    await this.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
  }

  async onModuleDestroy() {
    await this.connection.close();
  }

  isConnected(): boolean {
    return this.connection.readyState === 1;
  }

  async getConnection(): Promise<Connection> {
    return this.connection;
  }

  async startSession() {
    return this.connection.startSession();
  }
}
```

### 3. User Schema

**`modules/shared/database/schemas/user.schema.ts`**
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
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

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Индексы
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ isActive: 1 });
```

### 4. PromoCode Schema

**`modules/shared/database/schemas/promo-code.schema.ts`**
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromoCodeDocument = PromoCode & Document;

@Schema({ timestamps: true })
export class PromoCode {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, min: 0, max: 100 })
  discountPercent: number;

  @Prop({ required: true, min: 0 })
  totalLimit: number;

  @Prop({ required: true, min: 0 })
  perUserLimit: number;

  @Prop({ default: 0, min: 0 })
  usedCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  startsAt?: Date;

  @Prop()
  endsAt?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PromoCodeSchema = SchemaFactory.createForClass(PromoCode);

// Индексы
PromoCodeSchema.index({ code: 1 }, { unique: true });
PromoCodeSchema.index({ isActive: 1 });
PromoCodeSchema.index({ startsAt: 1, endsAt: 1 });
```

### 5. Order Schema

**`modules/shared/database/schemas/order.schema.ts`**
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'PromoCode' })
  promoCodeId?: Types.ObjectId;

  @Prop({ min: 0 })
  discountAmount?: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Индексы
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ promoCodeId: 1 });
```

### 6. PromoCodeUsage Schema

**`modules/shared/database/schemas/promo-code-usage.schema.ts`**
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PromoCodeUsageDocument = PromoCodeUsage & Document;

@Schema({ timestamps: true })
export class PromoCodeUsage {
  @Prop({ type: Types.ObjectId, ref: 'PromoCode', required: true })
  promoCodeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  discountAmount: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const PromoCodeUsageSchema =
  SchemaFactory.createForClass(PromoCodeUsage);

// Индексы
PromoCodeUsageSchema.index({ promoCodeId: 1, userId: 1 });
PromoCodeUsageSchema.index({ orderId: 1 }, { unique: true });
PromoCodeUsageSchema.index({ createdAt: -1 });
```

### 7. Регистрация схем в модулях

**`modules/users/users.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../shared/database/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  // ...
})
export class UsersModule {}
```

## Транзакции

### Пример использования транзакции

```typescript
async applyPromoCode(orderId: string, promoCode: string, userId: string) {
  const session = await this.mongoService.startSession();

  try {
    return await session.withTransaction(async () => {
      // 1. Найти промокод
      const promo = await this.promoCodeModel
        .findOne({ code: promoCode, isActive: true })
        .session(session);

      if (!promo) {
        throw new NotFoundException('Promo code not found');
      }

      // 2. Проверить лимиты
      if (promo.usedCount >= promo.totalLimit) {
        throw new BusinessException('Promo code limit exceeded', 'LIMIT_EXCEEDED');
      }

      // 3. Обновить заказ
      const order = await this.orderModel
        .findByIdAndUpdate(
          orderId,
          { promoCodeId: promo._id, discountAmount: calculatedDiscount },
          { session, new: true },
        );

      // 4. Увеличить счётчик использований
      await this.promoCodeModel
        .findByIdAndUpdate(promo._id, { $inc: { usedCount: 1 } }, { session });

      // 5. Создать запись использования
      await this.promoCodeUsageModel.create([{
        promoCodeId: promo._id,
        userId,
        orderId: order._id,
        discountAmount: calculatedDiscount,
      }], { session });

      return order;
    });
  } finally {
    await session.endSession();
  }
}
```

## Валидация

### Custom Validators

```typescript
// Проверка уникальности email
UserSchema.path('email').validate(async function (value: string) {
  const count = await this.constructor.countDocuments({ email: value });
  return count === 0;
}, 'Email already exists');
```

### Pre/Post Hooks

```typescript
// Хеширование пароля перед сохранением
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});
```

## Миграции

### Использование migrate-mongo

**`migrate-mongo-config.js`**
```javascript
module.exports = {
  mongodb: {
    url: process.env.MONGODB_URI,
    databaseName: process.env.MONGODB_DB_NAME,
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
};
```

**Пример миграции:**
```javascript
// migrations/001-add-user-indexes.js
module.exports = {
  async up(db) {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  },
  async down(db) {
    await db.collection('users').dropIndex('email_1');
  },
};
```

## Конфигурация

**`.env`**
```env
MONGODB_URI=mongodb://localhost:27017/promo_code_manager
MONGODB_DB_NAME=promo_code_manager
```

## Health Check

```typescript
@Get('health/mongo')
async mongoHealth() {
  return {
    status: this.mongoService.isConnected() ? 'ok' : 'error',
    readyState: this.connection.readyState,
  };
}
```

## Тестирование

- Unit тесты для схем
- Интеграционные тесты с тестовой БД
- Тесты транзакций
- Тесты валидации

## Зависимости

- `@nestjs/mongoose`
- `mongoose`
- `migrate-mongo` (для миграций)
