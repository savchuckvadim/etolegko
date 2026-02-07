/**
 * Константы кодов ошибок API
 * Соответствуют статус кодам HTTP и сообщениям с бэка
 */
export const HTTP_STATUS = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Константы сообщений об ошибках
 */
export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Unauthorized',
    INVALID_REFRESH_TOKEN: 'Invalid refresh token',
    TOKEN_EXPIRED: 'Token expired',
    VALIDATION_FAILED: 'Validation failed',
    NOT_FOUND: 'Not found',
    CONFLICT: 'Conflict',
    INTERNAL_SERVER_ERROR: 'Internal server error',
} as const;

/**
 * Типы для констант
 */
export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
