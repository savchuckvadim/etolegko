# Backend: Testing Strategy

## Назначение

Стратегия тестирования для backend: unit тесты, интеграционные тесты, E2E тесты.

## Структура

```
src/
├── modules/
│   ├── users/
│   │   ├── __tests__/
│   │   │   ├── users.service.spec.ts
│   │   │   ├── users.controller.spec.ts
│   │   │   └── user.repository.spec.ts
│   │   └── e2e/
│   │       └── users.e2e-spec.ts
```

## Типы тестов

### 1. Unit Tests

Тестирование отдельных компонентов в изоляции.

**Пример: UsersService**

**`modules/users/__tests__/users.service.spec.ts`**
```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: UserRepository;
  let eventBus: EventBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'UserRepository',
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            exists: jest.fn(),
          },
        },
        {
          provide: 'EventBus',
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get('UserRepository');
    eventBus = module.get('EventBus');
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      };

      const mockUser = User.create({
        email: dto.email,
        passwordHash: 'hashed',
        name: dto.name,
      });

      jest.spyOn(repository, 'exists').mockResolvedValue(false);
      jest.spyOn(repository, 'create').mockResolvedValue(mockUser);
      jest.spyOn(eventBus, 'publish').mockResolvedValue(undefined);

      const result = await service.create(dto);

      expect(repository.exists).toHaveBeenCalledWith(dto.email);
      expect(repository.create).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
      expect(result.email).toBe(dto.email);
    });

    it('should throw ConflictException if user exists', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      };

      jest.spyOn(repository, 'exists').mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
```

### 2. Integration Tests

Тестирование взаимодействия компонентов с реальными зависимостями (БД).

**Пример: UserRepository**

**`modules/users/__tests__/user.repository.spec.ts`**
```typescript
describe('UserRepository (Integration)', () => {
  let repository: UserRepository;
  let model: Model<UserDocument>;
  let connection: Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: () => ({
            uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test',
          }),
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UserRepository],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
    connection = module.get<Connection>(getConnectionToken());
  });

  afterEach(async () => {
    await model.deleteMany({});
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('create', () => {
    it('should create a user in database', async () => {
      const user = User.create({
        email: 'test@example.com',
        passwordHash: 'hashed',
        name: 'Test User',
      });

      const result = await repository.create(user);

      expect(result.id).toBeDefined();
      expect(result.email).toBe(user.email);

      const saved = await model.findById(result.id);
      expect(saved).toBeDefined();
      expect(saved.email).toBe(user.email);
    });
  });
});
```

### 3. E2E Tests

Тестирование полного flow через HTTP запросы.

**Пример: Users E2E**

**`modules/users/e2e/users.e2e-spec.ts`**
```typescript
describe('Users (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Получение токена для тестов
    const authResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
      });

    authToken = authResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'Password123',
          name: 'New User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.email).toBe('newuser@example.com');
          expect(res.body.data.id).toBeDefined();
        });
    });

    it('should return 409 if user exists', async () => {
      // Создаём пользователя
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'duplicate@example.com',
          password: 'Password123',
          name: 'Duplicate User',
        });

      // Пытаемся создать ещё раз
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'duplicate@example.com',
          password: 'Password123',
          name: 'Duplicate User',
        })
        .expect(409);
    });
  });

  describe('/users (GET)', () => {
    it('should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.pagination).toBeDefined();
          expect(res.body.pagination.page).toBe(1);
        });
    });
  });
});
```

### 4. Domain Entity Tests

**`modules/promo-codes/domain/__tests__/promo-code.entity.spec.ts`**
```typescript
describe('PromoCode Entity', () => {
  describe('validateUsage', () => {
    it('should throw if promo code is not active', () => {
      const promoCode = PromoCode.create({
        code: 'TEST',
        discountPercent: 10,
        totalLimit: 100,
        perUserLimit: 1,
      });
      promoCode.deactivate();

      expect(() => {
        promoCode.validateUsage('user1', 0);
      }).toThrow(BusinessException);
    });

    it('should throw if total limit exceeded', () => {
      const promoCode = new PromoCode(
        'id',
        'TEST',
        10,
        100,
        1,
        100, // usedCount = totalLimit
        true,
      );

      expect(() => {
        promoCode.validateUsage('user1', 0);
      }).toThrow(BusinessException);
    });

    it('should throw if user limit exceeded', () => {
      const promoCode = PromoCode.create({
        code: 'TEST',
        discountPercent: 10,
        totalLimit: 100,
        perUserLimit: 1,
      });

      expect(() => {
        promoCode.validateUsage('user1', 1); // userUsageCount = perUserLimit
      }).toThrow(BusinessException);
    });

    it('should throw if expired', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const promoCode = new PromoCode(
        'id',
        'TEST',
        10,
        100,
        1,
        0,
        true,
        undefined,
        yesterday, // endsAt = yesterday
      );

      expect(() => {
        promoCode.validateUsage('user1', 0);
      }).toThrow(BusinessException);
    });

    it('should not throw if valid', () => {
      const promoCode = PromoCode.create({
        code: 'TEST',
        discountPercent: 10,
        totalLimit: 100,
        perUserLimit: 1,
      });

      expect(() => {
        promoCode.validateUsage('user1', 0);
      }).not.toThrow();
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate discount correctly', () => {
      const promoCode = PromoCode.create({
        code: 'TEST',
        discountPercent: 20,
        totalLimit: 100,
        perUserLimit: 1,
      });

      const discount = promoCode.calculateDiscount(1000);
      expect(discount).toBe(200);
    });
  });
});
```

## Test Configuration

**`jest.config.js`**
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

## Test Database Setup

**`test/setup.ts`**
```typescript
import { MongooseModule } from '@nestjs/mongoose';

export const getTestMongoModule = () => {
  return MongooseModule.forRootAsync({
    useFactory: () => ({
      uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test',
    }),
  });
};
```

## Coverage Goals

- Unit tests: > 80%
- Integration tests: > 70%
- E2E tests: основные сценарии

## Зависимости

- `@nestjs/testing`
- `jest`
- `ts-jest`
- `@types/jest`
- `supertest`
- `@types/supertest`
