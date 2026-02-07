import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useOrdersUpdate } from '@entities/orders';
import type { UpdateOrderDto } from '@entities/orders';
import {
    extractErrorData,
    getErrorMessage,
    isSuccessResponse,
} from '@shared/lib/utils/error.utils';
import { updateOrderSchema, type UpdateOrderFormData } from '../schemas/update-order.schema';

/**
 * Хук для управления формой обновления заказа
 */
export const useUpdateOrderForm = (orderId: string, onSuccess?: () => void) => {
    const queryClient = useQueryClient();
    
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError: setFormError,
        clearErrors,
        reset,
    } = useForm<UpdateOrderFormData>({
        resolver: zodResolver(updateOrderSchema),
        defaultValues: {
            amount: undefined,
        },
    });

    const { mutate: updateOrder, isPending } = useOrdersUpdate({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    void queryClient.invalidateQueries({ queryKey: ['/orders'] });
                    reset();
                    onSuccess?.();
                }
            },
            onError: (error: unknown) => {
                const errorData = extractErrorData(error);
                const errorMessage = getErrorMessage(errorData, 'Ошибка при обновлении заказа');
                setFormError('root', { message: errorMessage });
            },
        },
    });

    const onSubmit = (data: UpdateOrderFormData) => {
        clearErrors();
        const updateOrderData: UpdateOrderDto = {
            amount: data.amount,
        };
        
        updateOrder({ id: orderId, data: updateOrderData });
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isSubmitting: isSubmitting || isPending,
        reset,
    };
};
