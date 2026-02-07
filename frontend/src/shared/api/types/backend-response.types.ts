/**
 * Типы для ответов с бэка
 * Backend всегда возвращает { result: T } для успешных ответов
 */

/**
 * Успешный ответ с бэка
 */
export interface BackendSuccessResponse<T> {
    result: T;
}

/**
 * Ошибка с бэка
 */
export interface BackendErrorResponse {
    message: string;
    errors?: string[];
}

/**
 * Type guard для проверки успешного ответа
 */
export function isBackendSuccessResponse<T>(data: unknown): data is BackendSuccessResponse<T> {
    return (
        typeof data === 'object' &&
        data !== null &&
        'result' in data &&
        data.result !== undefined &&
        !('message' in data)
    );
}

/**
 * Type guard для проверки ошибки
 */
export function isBackendErrorResponse(data: unknown): data is BackendErrorResponse {
    return (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof (data as BackendErrorResponse).message === 'string'
    );
}
