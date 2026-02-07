import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { usePromoCodesUpdate } from '@entities/promo-codes';
import type { UpdatePromoCodeDto } from '@entities/promo-codes';
import {
    extractErrorData,
    getErrorMessage,
    isSuccessResponse,
} from '@shared/lib/utils/error.utils';
import {
    updatePromoCodeSchema,
    type UpdatePromoCodeFormData,
} from '../schemas/update-promo-code.schema';

/**
 * Хук для управления формой обновления промокода
 */
export const useUpdatePromoCodeForm = (promoCodeId: string, onSuccess?: () => void) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError: setFormError,
        clearErrors,
        reset,
    } = useForm<UpdatePromoCodeFormData>({
        resolver: zodResolver(updatePromoCodeSchema),
        defaultValues: {
            discountPercent: undefined,
            isActive: undefined,
        },
    });

    const { mutate: updatePromoCode, isPending } = usePromoCodesUpdate({
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
                const errorMessage = getErrorMessage(errorData, 'Ошибка при обновлении промокода');
                setFormError('root', { message: errorMessage });
            },
        },
    });

    const onSubmit = (data: UpdatePromoCodeFormData) => {
        clearErrors();
        const updatePromoCodeData: UpdatePromoCodeDto = {
            discountPercent: data.discountPercent,
            isActive: data.isActive,
        };

        updatePromoCode({ id: promoCodeId, data: updatePromoCodeData });
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isSubmitting: isSubmitting || isPending,
        reset,
    };
};
