import { applyDecorators } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiConflictResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto';

/**
 * Декоратор для документирования ошибок API
 * Добавляет стандартные ответы об ошибках
 *
 * @param statusCodes - Массив HTTP статус кодов для документирования
 *
 * @example
 * ```typescript
 * @Post()
 * @ApiSuccessResponse(UserResponseDto)
 * @ApiErrorResponse([400, 409])
 * async create(@Body() dto: CreateUserDto) {
 *   return this.usersService.create(dto);
 * }
 * ```
 */
export const ApiErrorResponse = (
    statusCodes: (400 | 401 | 403 | 404 | 409 | 500)[] = [400, 500],
) => {
    const decorators: Array<ReturnType<typeof ApiBadRequestResponse>> = [];

    if (statusCodes.includes(400)) {
        decorators.push(
            ApiBadRequestResponse({
                description: 'Bad request / Validation error',
                type: ApiErrorResponseDto,
            }),
        );
    }

    if (statusCodes.includes(401)) {
        decorators.push(
            ApiUnauthorizedResponse({
                description: 'Unauthorized',
                type: ApiErrorResponseDto,
            }),
        );
    }

    if (statusCodes.includes(403)) {
        decorators.push(
            ApiForbiddenResponse({
                description: 'Forbidden',
                type: ApiErrorResponseDto,
            }),
        );
    }

    if (statusCodes.includes(404)) {
        decorators.push(
            ApiNotFoundResponse({
                description: 'Not found',
                type: ApiErrorResponseDto,
            }),
        );
    }

    if (statusCodes.includes(409)) {
        decorators.push(
            ApiConflictResponse({
                description: 'Conflict (e.g., resource already exists)',
                type: ApiErrorResponseDto,
            }),
        );
    }

    if (statusCodes.includes(500)) {
        decorators.push(
            ApiInternalServerErrorResponse({
                description: 'Internal server error',
                type: ApiErrorResponseDto,
            }),
        );
    }

    return applyDecorators(...decorators);
};
