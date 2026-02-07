import axios from 'axios';
import { HTTP_STATUS } from '../constants/error-codes.const';
import type { BackendSuccessResponse } from '../types/backend-response.types';
import { API_BASE_URL } from '@shared/config/api.config';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Интерфейс ответа от /auth/refresh
 */
export interface RefreshTokenResponse {
    accessToken: string;
}

/**
 * Обновление access token через refresh token
 * @param refreshToken - Refresh token из localStorage
 * @returns Новый access token
 * @throws Error если refresh token невалиден или истёк
 */
export async function refreshAccessToken(
    refreshToken: string,
): Promise<string> {
    try {
        const response = await axios.post<
            BackendSuccessResponse<RefreshTokenResponse>
        >(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
        });

        // Backend возвращает { result: { accessToken: string } }
        const data = response.data;
        const accessToken = data.result?.accessToken;

        if (!accessToken) {
            throw new Error('Access token not found in response');
        }

        return accessToken;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
                throw new Error('Invalid or expired refresh token');
            }
            throw new Error(
                error.response?.data?.message || 'Failed to refresh token',
            );
        }
        throw error;
    }
}
