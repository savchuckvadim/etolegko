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
 */
export const customInstance = <T>(
    config: AxiosRequestConfig,
    options?: AxiosRequestConfig,
): Promise<T> => {
    const source = axios.CancelToken.source();
    const promise = axiosInstance({
        ...config,
        ...options,
        cancelToken: source.token,
    }).then(({ data }) => data);

    // @ts-expect-error - cancel method exists on promise
    promise.cancel = () => {
        source.cancel('Query was cancelled');
    };

    return promise;
};
