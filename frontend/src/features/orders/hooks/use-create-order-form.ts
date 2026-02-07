import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useOrdersCreate } from '@entities/orders';
import type { CreateOrderDto } from '@entities/orders';
import {
    extractErrorData,
    getErrorMessage,
    isSuccessResponse,
} from '@shared/lib/utils/error.utils';
import { createOrderSchema, type CreateOrderFormData } from '../schemas/create-order.schema';

/**
 * Хук для управления формой создания заказа
 */
export const useCreateOrderForm = (onSuccess?: () => void) => {
    const queryClient = useQueryClient();
    
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError: setFormError,
        clearErrors,
        reset,
    } = useForm<CreateOrderFormData>({
        resolver: zodResolver(createOrderSchema),
        defaultValues: {
            amount: 0,
        },
    });

    const { mutate: createOrder, isPending } = useOrdersCreate({
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
                const errorMessage = getErrorMessage(errorData, 'Ошибка при создании заказа');
                setFormError('root', { message: errorMessage });
            },
        },
    });

    const onSubmit = (data: CreateOrderFormData) => {
        clearErrors();
        const createOrderData: CreateOrderDto = {
            amount: data.amount,
        };
        
        createOrder({ data: createOrderData });
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isSubmitting: isSubmitting || isPending,
        reset,
    };
};
