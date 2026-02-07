import { useQueryClient } from '@tanstack/react-query';
import {
    useOrdersCreate,
    useOrdersFindAll,
    useOrdersFindById,
    useOrdersUpdate,
    useOrdersRemove,
    type CreateOrderDto,
    type UpdateOrderDto,
    type OrdersFindAllParams,
} from '@entities/orders';
import {
    extractErrorData,
    getErrorMessage,
    isSuccessResponse,
} from '@shared/lib/utils/error.utils';

/**
 * Хук для работы с заказами (CRUD + Pagination)
 */
export const useOrders = (params?: OrdersFindAllParams) => {
    const queryClient = useQueryClient();

    // Получение списка с пагинацией
    const findAllQuery = useOrdersFindAll(params, {
        query: {
            enabled: true,
        },
    });

    // Создание
    const createMutation = useOrdersCreate({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    void queryClient.invalidateQueries({ queryKey: ['/orders'] });
                }
            },
        },
    });

    // Обновление
    const updateMutation = useOrdersUpdate({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    void queryClient.invalidateQueries({ queryKey: ['/orders'] });
                }
            },
        },
    });

    // Удаление
    const removeMutation = useOrdersRemove({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: ['/orders'] });
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
 * Хук для получения одного заказа
 */
export const useOrder = (id: string | undefined) => {
    return useOrdersFindById(id ?? '', {
        query: {
            enabled: !!id,
        },
    });
};
