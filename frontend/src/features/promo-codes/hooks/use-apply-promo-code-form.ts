import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { usePromoCodesApply } from '@entities/promo-codes';
import type { ApplyPromoCodeDto } from '@entities/promo-codes';
import {
    extractErrorData,
    getErrorMessage,
    isSuccessResponse,
} from '@shared/lib/utils/error.utils';
import {
    applyPromoCodeSchema,
    type ApplyPromoCodeFormData,
} from '../schemas/apply-promo-code.schema';

/**
 * Хук для управления формой применения промокода
 */
export const useApplyPromoCodeForm = (onSuccess?: () => void) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError: setFormError,
        clearErrors,
        reset,
    } = useForm<ApplyPromoCodeFormData>({
        resolver: zodResolver(applyPromoCodeSchema),
        defaultValues: {
            orderId: '',
            promoCode: '',
        },
    });

    const { mutate: applyPromoCode, isPending } = usePromoCodesApply({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    void queryClient.invalidateQueries({ queryKey: ['/promo-codes'] });
                    void queryClient.invalidateQueries({ queryKey: ['/orders'] });
                    reset();
                    onSuccess?.();
                }
            },
            onError: (error: unknown) => {
                const errorData = extractErrorData(error);
                const errorMessage = getErrorMessage(errorData, 'Ошибка при применении промокода');
                setFormError('root', { message: errorMessage });
            },
        },
    });

    const onSubmit = (data: ApplyPromoCodeFormData) => {
        clearErrors();
        const applyPromoCodeData: ApplyPromoCodeDto = {
            orderId: data.orderId,
            promoCode: data.promoCode,
        };

        applyPromoCode({ data: applyPromoCodeData });
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isSubmitting: isSubmitting || isPending,
        reset,
    };
};
