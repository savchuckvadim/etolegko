import axios, { type AxiosRequestConfig } from 'axios';
import { setupRequestInterceptor, setupResponseInterceptor } from './interceptors';
import { API_BASE_URL } from '@shared/config/api.config';

/**
 * Axios instance для API запросов
 * Настроен с interceptors для автоматической обработки токенов и ошибок
 */
export const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Настройка interceptors
setupRequestInterceptor();
setupResponseInterceptor();

/**
 * Custom instance для Orval
 * Используется для кодогенерации API клиентов
 *
 * Orval передает URL как первый параметр (string), а конфигурацию как второй (RequestInit)
 */
export const customInstance = <T>(
    config: string | AxiosRequestConfig,
    options?: RequestInit | AxiosRequestConfig,
): Promise<T> => {
    const source = axios.CancelToken.source();

    let axiosConfig: AxiosRequestConfig;

    if (typeof config === 'string') {
        // Первый параметр - URL (строка)
        // Второй параметр - RequestInit (Fetch API) или AxiosRequestConfig
        if (options && 'method' in options) {
            // Это RequestInit (Fetch API)
            const requestInit = options as RequestInit;
            axiosConfig = {
                url: config,
                method: requestInit.method as AxiosRequestConfig['method'],
                headers: requestInit.headers as AxiosRequestConfig['headers'],
                data: requestInit.body,
                cancelToken: source.token,
            };
        } else {
            // Это AxiosRequestConfig
            axiosConfig = {
                url: config,
                ...(options as AxiosRequestConfig),
                cancelToken: source.token,
            };
        }
    } else {
        // Первый параметр - AxiosRequestConfig
        axiosConfig = {
            ...config,
            ...(options as AxiosRequestConfig),
            cancelToken: source.token,
        };
    }

    const promise = axiosInstance(axiosConfig)
        .then((response) => {
            // Backend возвращает { result: T } для успешных ответов
            // Response interceptor уже извлек result, поэтому response.data = T
            // Orval ожидает структуру { status, data }
            return {
                status: response.status,
                data: response.data,
                headers: response.headers,
            } as T;
        })
        .catch((error) => {
            // Backend возвращает { message: string, errors?: string[] } для ошибок
            // Пробрасываем ошибку дальше для обработки в onError
            throw error;
        });

    // @ts-expect-error - cancel method exists on promise
    promise.cancel = () => {
        source.cancel('Query was cancelled');
    };

    return promise;
};
