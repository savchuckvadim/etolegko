/**
 * Конфигурация API
 * Вынесено в отдельный файл, чтобы Orval не анализировал import.meta при генерации кода
 */

// Получаем baseURL из переменных окружения
// В runtime Vite корректно обработает import.meta.env
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
export const API_BASE_URL =
    (import.meta.env?.VITE_API_BASE_URL as string | undefined) ||
    'http://localhost:3000';
