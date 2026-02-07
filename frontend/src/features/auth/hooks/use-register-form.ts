import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthRegister } from '@entities/auth';
import type { RegisterDto } from '@entities/auth';
import { tokenStorage } from '@shared/lib';
import {
    extractErrorData,
    getErrorMessage,
    isSuccessResponse,
} from '@shared/lib/utils/error.utils';
import { registerSchema, type RegisterFormData } from '../schemas/register.schema';

/**
 * Хук для управления формой регистрации
 * Инкапсулирует логику формы, валидацию и отправку запроса
 */
export const useRegisterForm = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError: setFormError,
        clearErrors,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: undefined,
            password: '',
        },
    });

    const { mutate: registerUser, isPending } = useAuthRegister({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    const authData = response.data;
                    tokenStorage.setTokens(
                        authData.accessToken,
                        authData.refreshToken,
                    );
                    void queryClient.invalidateQueries({ queryKey: ['/auth/me'] });
                    // AuthGuard автоматически выполнит редирект
                }
            },
            onError: (error: unknown) => {
                const errorData = extractErrorData(error);
                const errorMessage = getErrorMessage(errorData, 'Ошибка при регистрации');
                setFormError('root', { message: errorMessage });
            },
        },
    });

    const onSubmit = (data: RegisterFormData) => {
        clearErrors();
        const registerData: RegisterDto = {
            email: data.email,
            password: data.password,
            name: data.name,
            phone: data.phone?.trim() || undefined,
        };
        registerUser({ data: registerData });
    };

    const goToLogin = () => {
        navigate('/login');
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isSubmitting: isSubmitting || isPending,
        goToLogin,
    };
};
