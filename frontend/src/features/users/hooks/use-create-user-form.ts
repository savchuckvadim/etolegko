import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useUsersCreate } from '@entities/users';
import type { CreateUserDto } from '@entities/users';
import {
    extractErrorData,
    getErrorMessage,
    isSuccessResponse,
} from '@shared/lib/utils/error.utils';
import { createUserSchema, type CreateUserFormData } from '../schemas/create-user.schema';

/**
 * Хук для управления формой создания пользователя
 * Инкапсулирует логику формы, валидацию и отправку запроса
 * НЕ изменяет токены текущего пользователя
 */
export const useCreateUserForm = (onSuccess?: () => void) => {
    const queryClient = useQueryClient();
    
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError: setFormError,
        clearErrors,
        reset,
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            password: '',
        },
    });

    const { mutate: createUser, isPending } = useUsersCreate({
        mutation: {
            onSuccess: (response) => {
                if (isSuccessResponse(response)) {
                    void queryClient.invalidateQueries({ queryKey: ['/users'] });
                    reset();
                    onSuccess?.();
                }
            },
            onError: (error: unknown) => {
                const errorData = extractErrorData(error);
                const errorMessage = getErrorMessage(errorData, 'Ошибка при создании пользователя');
                setFormError('root', { message: errorMessage });
            },
        },
    });

    const onSubmit = (data: CreateUserFormData) => {
        clearErrors();
        const createUserData: CreateUserDto = {
            email: data.email,
            password: data.password,
            name: data.name,
            phone: data.phone?.trim() || undefined,
        };
        
        createUser({ data: createUserData });
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isSubmitting: isSubmitting || isPending,
        reset,
    };
};
