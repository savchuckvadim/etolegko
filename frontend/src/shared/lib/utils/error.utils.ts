import type { ApiErrorResponseDto } from '@shared/api/generated/models';

/**
 * Проверяет, является ли ответ успешным (статус 200 или 201)
 */
export function isSuccessResponse(
    response: { status: number } | unknown,
): response is { status: 200 | 201; data: unknown } {
    return (
        typeof response === 'object' &&
        response !== null &&
        'status' in response &&
        (response.status === 200 || response.status === 201)
    );
}

/**
 * Извлекает сообщение об ошибке из ApiErrorResponseDto
 * Обрабатывает случаи, когда message может быть строкой или массивом
 * Приоритет: errors > message (массив) > message (строка)
 */
export function getErrorMessage(
    errorData: ApiErrorResponseDto | null | undefined,
    defaultMessage = 'Произошла ошибка',
): string {
    if (!errorData) {
        return defaultMessage;
    }

    // Приоритет 1: Если есть массив errors (валидационные ошибки), используем его
    if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        return errorData.errors.join(', ');
    }

    // Приоритет 2: Если message - массив, объединяем через запятую
    if (Array.isArray(errorData.message)) {
        return errorData.message.join(', ');
    }

    // Приоритет 3: Если message - строка, используем её
    if (typeof errorData.message === 'string' && errorData.message) {
        return errorData.message;
    }

    return defaultMessage;
}

/**
 * Извлекает ApiErrorResponseDto из ошибки TanStack Query/Orval
 */
export function extractErrorData(
    error: unknown,
): ApiErrorResponseDto | null {
    if (typeof error !== 'object' || error === null) {
        return null;
    }

    // Вариант 1: Orval формат { status, data }
    if ('data' in error) {
        const errorWithData = error as { data: unknown };
        const data = errorWithData.data;

        if (typeof data === 'object' && data !== null) {
            const errorData = data as { message?: unknown; errors?: unknown };
            // Проверяем, что это ApiErrorResponseDto (должен быть message или errors)
            if (
                'message' in errorData &&
                (typeof errorData.message === 'string' ||
                    Array.isArray(errorData.message))
            ) {
                return data as ApiErrorResponseDto;
            }
            // Или только errors (для валидационных ошибок)
            if (
                'errors' in errorData &&
                Array.isArray(errorData.errors) &&
                errorData.errors.length > 0
            ) {
                return {
                    message: 'Validation failed',
                    errors: errorData.errors as string[],
                } as ApiErrorResponseDto;
            }
        }
    }

    // Вариант 2: AxiosError формат { response: { data } }
    if ('response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        if (
            axiosError.response &&
            typeof axiosError.response === 'object' &&
            'data' in axiosError.response
        ) {
            const data = axiosError.response.data;
            if (typeof data === 'object' && data !== null) {
                const errorData = data as { message?: unknown; errors?: unknown };
                // Проверяем message
                if (
                    'message' in errorData &&
                    (typeof errorData.message === 'string' ||
                        Array.isArray(errorData.message))
                ) {
                    return data as ApiErrorResponseDto;
                }
                // Или только errors
                if (
                    'errors' in errorData &&
                    Array.isArray(errorData.errors) &&
                    errorData.errors.length > 0
                ) {
                    return {
                        message: 'Validation failed',
                        errors: errorData.errors as string[],
                    } as ApiErrorResponseDto;
                }
            }
        }
    }

    // Вариант 3: Прямой объект с message или errors (на случай, если ошибка уже распарсена)
    const directError = error as { message?: unknown; errors?: unknown };
    if ('message' in directError) {
        if (
            typeof directError.message === 'string' ||
            Array.isArray(directError.message)
        ) {
            return error as ApiErrorResponseDto;
        }
    }
    // Или только errors
    if (
        'errors' in directError &&
        Array.isArray(directError.errors) &&
        directError.errors.length > 0
    ) {
        return {
            message: 'Validation failed',
            errors: directError.errors as string[],
        } as ApiErrorResponseDto;
    }

    return null;
}
