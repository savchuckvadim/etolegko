import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { axiosInstance } from '../axios-instance';
import { HTTP_STATUS } from '../constants/error-codes.const';
import { refreshAccessToken } from '../utils/refresh-token.util';
import { tokenStorage } from '@shared/lib';
import {
    isBackendSuccessResponse,
    isBackendErrorResponse,
} from '../types/backend-response.types';

/**
 * Response interceptor для обработки ответов и ошибок
 */
export function setupResponseInterceptor(): void {
    // Обработка успешных ответов
    axiosInstance.interceptors.response.use(
        (response: AxiosResponse) => {
            // Backend возвращает { result: ... }, извлекаем result
            if (isBackendSuccessResponse(response.data)) {
                return { ...response, data: response.data.result };
            }
            return response;
        },
        // Обработка ошибок
        async (error: AxiosError) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & {
                _retry?: boolean;
            };

            // Обработка 401 (Unauthorized) - токен истёк или невалиден
            if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
                // Проверяем, что это не запрос на refresh (чтобы избежать бесконечного цикла)
                const isRefreshRequest = originalRequest.url?.includes(
                    '/auth/refresh',
                );
                const alreadyRetried = originalRequest._retry === true;

                if (isRefreshRequest || alreadyRetried) {
                    // Refresh token невалиден или истёк, перенаправляем на логин
                    tokenStorage.clearTokens();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // Пытаемся обновить токен
                const refreshToken = tokenStorage.getRefreshToken();
                if (!refreshToken) {
                    // Refresh token отсутствует, перенаправляем на логин
                    tokenStorage.clearTokens();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                try {
                    // Помечаем запрос, чтобы избежать повторных попыток
                    originalRequest._retry = true;

                    // Обновляем токен
                    const newAccessToken = await refreshAccessToken(
                        refreshToken,
                    );
                    tokenStorage.setAccessToken(newAccessToken);

                    // Повторяем оригинальный запрос с новым токеном
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    }
                    return axiosInstance.request(originalRequest);
                } catch (refreshError) {
                    // Refresh token невалиден или истёк, перенаправляем на логин
                    tokenStorage.clearTokens();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            }

            // Для остальных ошибок проверяем структуру ответа и пробрасываем дальше
            if (error.response?.data && isBackendErrorResponse(error.response.data)) {
                // Ошибка имеет правильную структуру с бэка
                return Promise.reject(error);
            }

            // Для остальных ошибок просто пробрасываем их дальше
            return Promise.reject(error);
        },
    );
}
