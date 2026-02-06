import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from '@users/api/controllers/users.controller';
import { UsersService } from '@users/application/services/users.service';
import { UserRepository } from '@users/infrastructure/repositories/user.repository';
import { UserSchemaFactory } from '@users/infrastructure/schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: 'UserSchema',
                schema: UserSchemaFactory,
            },
        ]),
    ],
    controllers: [UsersController],
    providers: [UsersService, UserRepository],
    exports: [UsersService, UserRepository],
})
export class UsersModule {}
