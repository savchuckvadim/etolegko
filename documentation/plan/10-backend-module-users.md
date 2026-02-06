# Backend: Users Module

## Назначение

Модуль для управления пользователями: регистрация, CRUD операции, управление активностью.

## Структура

```
src/
├── modules/
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── api/
│   │   │   ├── users.controller.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       ├── update-user.dto.ts
│   │   │       ├── user-query.dto.ts
│   │   │       └── user-response.dto.ts
│   │   ├── application/
│   │   │   ├── users.service.ts
│   │   │   ├── interfaces/
│   │   │   │   └── user-repository.interface.ts
│   │   │   └── events/
│   │   │       └── user-registered.event.ts
│   │   ├── domain/
│   │   │   ├── user.entity.ts
│   │   │   └── constants/
│   │   │       └── user-errors.const.ts
│   │   └── infrastructure/
│   │       ├── schemas/
│   │       │   └── user.schema.ts
│   │       └── repositories/
│   │           └── user.repository.ts
```

## Реализация

### 1. Domain Entity

**`modules/users/domain/user.entity.ts`**
```typescript
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    private passwordHash: string,
    public readonly name: string,
    public readonly phone?: string,
    private isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static create(data: {
    email: string;
    passwordHash: string;
    name: string;
    phone?: string;
  }): User {
    return new User(
      undefined as any, // Будет установлен при сохранении
      data.email,
      data.passwordHash,
      data.name,
      data.phone,
      true,
      new Date(),
      new Date(),
    );
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  updatePassword(newPasswordHash: string): void {
    this.passwordHash = newPasswordHash;
  }
}
```

### 2. DTO

**`modules/users/api/dto/create-user.dto.ts`**
```typescript
export class CreateUserDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty()
  password: string;

  @IsString()
  @MinLength(2)
  @ApiProperty()
  name: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  @ApiProperty({ required: false })
  phone?: string;
}
```

**`modules/users/api/dto/update-user.dto.ts`**
```typescript
export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @ApiProperty({ required: false })
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  @ApiProperty({ required: false })
  phone?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  isActive?: boolean;
}
```

**`modules/users/api/dto/user-query.dto.ts`**
```typescript
export class UserQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  search?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false })
  isActive?: boolean;
}
```

**`modules/users/api/dto/user-response.dto.ts`**
```typescript
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
```

### 3. Repository Interface

**`modules/users/application/interfaces/user-repository.interface.ts`**
```typescript
import { User } from '../../domain/user.entity';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(filter: UserFilter): Promise<{ items: User[]; total: number }>;
  create(user: User): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  exists(email: string): Promise<boolean>;
}
```

### 4. Repository Implementation

**`modules/users/infrastructure/repositories/user.repository.ts`**
```typescript
@Injectable()
export class UserRepository implements UserRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findAll(filter: UserFilter): Promise<{ items: User[]; total: number }> {
    const query = this.userModel.find();

    if (filter.search) {
      query.or([
        { email: { $regex: filter.search, $options: 'i' } },
        { name: { $regex: filter.search, $options: 'i' } },
      ]);
    }

    if (filter.isActive !== undefined) {
      query.where({ isActive: filter.isActive });
    }

    const total = await this.userModel.countDocuments(query.getQuery());
    
    query
      .skip((filter.page - 1) * filter.limit)
      .limit(filter.limit)
      .sort({ [filter.sortBy]: filter.sortOrder });

    const docs = await query.exec();
    return {
      items: docs.map((doc) => this.toEntity(doc)),
      total,
    };
  }

  async create(user: User): Promise<User> {
    const doc = await this.userModel.create({
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      phone: user.phone,
      isActive: user.getIsActive(),
    });

    return this.toEntity(doc);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const doc = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();

    if (!doc) {
      throw new NotFoundException('User', id);
    }

    return this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.userModel.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  private toEntity(doc: UserDocument): User {
    return new User(
      doc._id.toString(),
      doc.email,
      doc.passwordHash,
      doc.name,
      doc.phone,
      doc.isActive,
      doc.createdAt,
      doc.updatedAt,
    );
  }
}
```

### 5. Application Service

**`modules/users/application/users.service.ts`**
```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async create(dto: CreateUserDto): Promise<UserReadModel> {
    // Проверка существования
    const exists = await this.userRepository.exists(dto.email);
    if (exists) {
      throw new ConflictException('User with this email already exists');
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Создание entity
    const user = User.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      phone: dto.phone,
    });

    // Сохранение
    const savedUser = await this.userRepository.create(user);

    // Публикация события
    await this.eventBus.publish(
      new UserRegisteredEvent(
        savedUser.id,
        savedUser.email,
        savedUser.name,
        new Date(),
      ),
    );

    return UserMapper.toReadModel(savedUser);
  }

  async findAll(query: UserQueryDto): Promise<PaginatedResult<UserReadModel>> {
    const filter: UserFilter = {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      search: query.search,
      isActive: query.isActive,
    };

    const result = await this.userRepository.findAll(filter);

    return {
      items: result.items.map((user) => UserMapper.toReadModel(user)),
      total: result.total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findById(id: string): Promise<UserReadModel> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User', id);
    }
    return UserMapper.toReadModel(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserReadModel> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User', id);
    }

    const updateData: Partial<User> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.isActive !== undefined) {
      dto.isActive ? user.activate() : user.deactivate();
    }

    const updatedUser = await this.userRepository.update(id, updateData);
    return UserMapper.toReadModel(updatedUser);
  }

  async delete(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User', id);
    }
    await this.userRepository.delete(id);
  }
}
```

### 6. Controller

**`modules/users/api/users.controller.ts`**
```typescript
@Controller('users')
@ApiTags('Users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiPagination(UserResponseDto)
  @ApiOperation({ summary: 'Get all users' })
  async findAll(@Query() query: UserQueryDto): Promise<PaginatedResult<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
```

### 7. Module

**`modules/users/users.module.ts`**
```typescript
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    EventBusModule,
  ],
  providers: [
    UsersService,
    {
      provide: 'UserRepository',
      useClass: UserRepository,
    },
  ],
  controllers: [UsersController],
  exports: [UsersService, 'UserRepository'],
})
export class UsersModule {}
```

## Тестирование

- Unit тесты для UsersService
- Unit тесты для UserRepository
- E2E тесты для CRUD операций
- Тесты валидации

## Зависимости

- `@nestjs/mongoose`
- `mongoose`
- `bcrypt`
- `@types/bcrypt`
