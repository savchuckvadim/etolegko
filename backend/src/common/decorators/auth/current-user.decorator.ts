import { Request } from 'express';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@users/domain/entity/user.entity';

interface RequestWithUser extends Request {
    user?: User;
}

/**
 * Декоратор для получения текущего пользователя из request
 * Используется вместе с JwtAuthGuard
 *
 * @example
 * ```typescript
 * @Get('me')
 * @UseGuards(JwtAuthGuard)
 * async getMe(@CurrentUser() user: User) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext): User | string | null => {
        const request = ctx.switchToHttp().getRequest<RequestWithUser>();
        const user = request.user;

        if (!user) {
            return null;
        }

        // Если передан параметр, возвращаем конкретное поле
        if (data) {
            return (user as Record<string, unknown>)[data] as string;
        }
        return user;
    },
);
