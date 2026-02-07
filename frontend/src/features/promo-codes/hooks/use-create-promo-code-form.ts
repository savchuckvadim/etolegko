import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { usePromoCodesCreate } from '@entities/promo-codes';
import type { CreatePromoCodeDto } from '@entities/promo-codes';
import {
    extractErrorData,
    getErrorMessage,
    isSuccessResponse,
} from '@shared/lib/utils/error.utils';
import {
    createPromoCodeSchema,
    type CreatePromoCodeFormData,
} from '../schemas/create-promo-code.schema';

/**
 * Хук для управления формой создания промокода
 */
export const useCreatePromoCodeForm = (onSuccess?: () => void) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError: setFormError,
        clearErrors,
        reset,
    } = useForm<CreatePromoCodeFormData>({
        resolver: zodResolver(createPromoCodeSchema),
        defaultValues: {
            code: '',
            discountPercent: 10,
            totalLimit: 100,
            perUserLimit: 1,
            startsAt: '',
            endsAt: '',
        },
    });

    const { mutate: createPromoCode, isPending } = usePromoCodesCreate({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    void queryClient.invalidateQueries({ queryKey: ['/promo-codes'] });
                    reset();
                    onSuccess?.();
                }
            },
            onError: (error: unknown) => {
                const errorData = extractErrorData(error);
                const errorMessage = getErrorMessage(errorData, 'Ошибка при создании промокода');
                setFormError('root', { message: errorMessage });
            },
        },
    });

    const onSubmit = (data: CreatePromoCodeFormData) => {
        clearErrors();
        const createPromoCodeData: CreatePromoCodeDto = {
            code: data.code,
            discountPercent: data.discountPercent,
            totalLimit: data.totalLimit,
            perUserLimit: data.perUserLimit,
            startsAt: data.startsAt || undefined,
            endsAt: data.endsAt || undefined,
        };

        createPromoCode({ data: createPromoCodeData });
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isSubmitting: isSubmitting || isPending,
        reset,
    };
};
