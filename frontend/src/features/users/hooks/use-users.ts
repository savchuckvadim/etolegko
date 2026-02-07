import { useQueryClient } from '@tanstack/react-query';
import {
    useUsersCreate,
    useUsersFindAll,
    useUsersFindOne,
    useUsersUpdate,
    useUsersRemove,
    type UsersFindAllParams,
} from '@entities/users';
import {
    extractErrorData,
    getErrorMessage,
    isSuccessResponse,
} from '@shared/lib/utils/error.utils';

/**
 * Хук для работы с пользователями (CRUD + Pagination)
 */
export const useUsers = (params?: UsersFindAllParams) => {
    const queryClient = useQueryClient();

    // Получение списка с пагинацией
    const findAllQuery = useUsersFindAll(params, {
        query: {
            enabled: true,
        },
    });

    // Создание
    const createMutation = useUsersCreate({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    // Инвалидируем список пользователей
                    void queryClient.invalidateQueries({ queryKey: ['/users'] });
                }
            },
        },
    });

    // Обновление
    const updateMutation = useUsersUpdate({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    // Инвалидируем список и конкретного пользователя
                    void queryClient.invalidateQueries({ queryKey: ['/users'] });
                }
            },
        },
    });

    // Удаление
    const removeMutation = useUsersRemove({
        mutation: {
            onSuccess: () => {
                // Инвалидируем список пользователей
                void queryClient.invalidateQueries({ queryKey: ['/users'] });
            },
        },
    });

    return {
        // Query
        findAll: findAllQuery,
        // Mutations
        create: createMutation,
        update: updateMutation,
        remove: removeMutation,
    };
};

/**
 * Хук для получения одного пользователя
 */
export const useUser = (id: string | undefined) => {
    return useUsersFindOne(id ?? '', {
        query: {
            enabled: !!id,
        },
    });
};

/**
 * Хук для создания пользователя с обработкой ошибок
 */
export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useUsersCreate({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    void queryClient.invalidateQueries({ queryKey: ['/users'] });
                }
            },
            onError: (error) => {
                const errorData = extractErrorData(error);
                const errorMessage = getErrorMessage(errorData, 'Ошибка при создании пользователя');
                console.error(errorMessage);
            },
        },
    });
};

/**
 * Хук для обновления пользователя с обработкой ошибок
 */
export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useUsersUpdate({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    void queryClient.invalidateQueries({ queryKey: ['/users'] });
                }
            },
            onError: (error) => {
                const errorData = extractErrorData(error);
                const errorMessage = getErrorMessage(
                    errorData,
                    'Ошибка при обновлении пользователя',
                );
                console.error(errorMessage);
            },
        },
    });
};

/**
 * Хук для удаления пользователя с обработкой ошибок
 */
export const useRemoveUser = () => {
    const queryClient = useQueryClient();

    return useUsersRemove({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: ['/users'] });
            },
            onError: (error) => {
                const errorData = extractErrorData(error);
                const errorMessage = getErrorMessage(errorData, 'Ошибка при удалении пользователя');
                console.error(errorMessage);
            },
        },
    });
};
