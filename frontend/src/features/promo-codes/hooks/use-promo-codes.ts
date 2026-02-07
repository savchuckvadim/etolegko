import { useQueryClient } from '@tanstack/react-query';
import {
    usePromoCodesCreate,
    usePromoCodesFindAll,
    usePromoCodesFindById,
    usePromoCodesUpdate,
    usePromoCodesRemove,
    usePromoCodesApply,
    type CreatePromoCodeDto,
    type UpdatePromoCodeDto,
    type ApplyPromoCodeDto,
    type PromoCodesFindAllParams,
} from '@entities/promo-codes';
import {
    extractErrorData,
    getErrorMessage,
    isSuccessResponse,
} from '@shared/lib/utils/error.utils';

/**
 * Хук для работы с промокодами (CRUD + Pagination)
 */
export const usePromoCodes = (params?: PromoCodesFindAllParams) => {
    const queryClient = useQueryClient();

    // Получение списка с пагинацией
    const findAllQuery = usePromoCodesFindAll(params, {
        query: {
            enabled: true,
        },
    });

    // Создание
    const createMutation = usePromoCodesCreate({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    void queryClient.invalidateQueries({ queryKey: ['/promo-codes'] });
                }
            },
        },
    });

    // Обновление
    const updateMutation = usePromoCodesUpdate({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    void queryClient.invalidateQueries({ queryKey: ['/promo-codes'] });
                }
            },
        },
    });

    // Удаление
    const removeMutation = usePromoCodesRemove({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: ['/promo-codes'] });
            },
        },
    });

    // Применение промокода
    const applyMutation = usePromoCodesApply({
        mutation: {
            onSuccess: () => {
                // Инвалидируем промокоды и заказы
                void queryClient.invalidateQueries({ queryKey: ['/promo-codes'] });
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
        apply: applyMutation,
    };
};

/**
 * Хук для получения одного промокода
 */
export const usePromoCode = (id: string | undefined) => {
    return usePromoCodesFindById(id ?? '', {
        query: {
            enabled: !!id,
        },
    });
};
