/**
 * Утилиты для работы с токенами в localStorage
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const tokenStorage = {
    /**
     * Сохранить access token
     */
    setAccessToken: (token: string): void => {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
        // Отправляем событие для обновления состояния в AuthContext
        window.dispatchEvent(new Event('tokensUpdated'));
    },

    /**
     * Получить access token
     */
    getAccessToken: (): string | null => {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },

    /**
     * Удалить access token
     */
    removeAccessToken: (): void => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    },

    /**
     * Сохранить refresh token
     */
    setRefreshToken: (token: string): void => {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
        // Отправляем событие для обновления состояния в AuthContext
        window.dispatchEvent(new Event('tokensUpdated'));
    },

    /**
     * Получить refresh token
     */
    getRefreshToken: (): string | null => {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    /**
     * Удалить refresh token
     */
    removeRefreshToken: (): void => {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },

    /**
     * Сохранить оба токена
     */
    setTokens: (accessToken: string, refreshToken: string): void => {
        tokenStorage.setAccessToken(accessToken);
        tokenStorage.setRefreshToken(refreshToken);
    },

    /**
     * Очистить все токены
     */
    clearTokens: (): void => {
        tokenStorage.removeAccessToken();
        tokenStorage.removeRefreshToken();
        // Отправляем событие для обновления состояния в AuthContext
        window.dispatchEvent(new Event('tokensUpdated'));
    },

    /**
     * Проверить, есть ли токены
     */
    hasTokens: (): boolean => {
        return tokenStorage.getAccessToken() !== null && tokenStorage.getRefreshToken() !== null;
    },
};
