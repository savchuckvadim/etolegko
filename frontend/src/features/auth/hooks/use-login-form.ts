import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthLogin } from '@entities/auth';
import type { LoginDto } from '@entities/auth';
import { tokenStorage } from '@shared/lib';
import {
    extractErrorData,
    getErrorMessage,
    isSuccessResponse,
} from '@shared/lib/utils/error.utils';
import { loginSchema, type LoginFormData } from '../schemas/login.schema';

/**
 * Хук для управления формой логина
 * Инкапсулирует логику формы, валидацию и отправку запроса
 */
export const useLoginForm = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError: setFormError,
        clearErrors,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const { mutate: login, isPending } = useAuthLogin({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    const authData = response.data;
                    tokenStorage.setTokens(authData.accessToken, authData.refreshToken);
                    void queryClient.invalidateQueries({ queryKey: ['/auth/me'] });
                    // AuthGuard автоматически выполнит редирект
                }
            },
            onError: (error: unknown) => {
                const errorData = extractErrorData(error);
                const errorMessage = getErrorMessage(errorData, 'Ошибка при входе');
                setFormError('root', { message: errorMessage });
            },
        },
    });

    const onSubmit = (data: LoginFormData) => {
        clearErrors();
        const loginData: LoginDto = {
            email: data.email,
            password: data.password,
        };
        login({ data: loginData });
    };

    const goToRegister = () => {
        navigate('/register');
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isSubmitting: isSubmitting || isPending,
        goToRegister,
    };
};
