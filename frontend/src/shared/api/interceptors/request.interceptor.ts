import type { InternalAxiosRequestConfig } from 'axios';
import { axiosInstance } from '../axios-instance';

/**
 * Request interceptor для добавления токена авторизации
 */
export function setupRequestInterceptor(): void {
    axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = localStorage.getItem('accessToken');
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
