import type { InternalAxiosRequestConfig } from 'axios';
import { axiosInstance } from '../axios-instance';
import { tokenStorage } from '@shared/lib';

/**
 * Request interceptor для добавления токена авторизации
 */
export function setupRequestInterceptor(): void {
    axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = tokenStorage.getAccessToken();
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        },
    );
}
