import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { useRegisterForm } from '@features/auth';

/**
 * Форма регистрации
 * Использует react-hook-form и хук useRegisterForm для управления состоянием
 */
export const RegisterForm = () => {
    const { register, handleSubmit, errors, isSubmitting, goToLogin } = useRegisterForm();

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxWidth: 400,
                width: '100%',
            }}
        >
            <Typography variant="h5" component="h1" gutterBottom>
                Регистрация
            </Typography>

            {errors.root && (
                <Alert severity="error" onClose={() => {}}>
                    {errors.root.message}
                </Alert>
            )}

            <TextField
                {...register('name')}
                label="Имя"
                fullWidth
                disabled={isSubmitting}
                autoComplete="name"
                error={!!errors.name}
                helperText={errors.name?.message}
            />

            <TextField
                {...register('email')}
                label="Email"
                type="email"
                fullWidth
                disabled={isSubmitting}
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
            />

            <TextField
                {...register('phone')}
                label="Телефон"
                type="tel"
                fullWidth
                disabled={isSubmitting}
                autoComplete="tel"
                error={!!errors.phone}
                helperText={errors.phone?.message}
            />

            <TextField
                {...register('password')}
                label="Пароль"
                type="password"
                fullWidth
                disabled={isSubmitting}
                autoComplete="new-password"
                error={!!errors.password}
                helperText={
                    errors.password?.message ||
                    'Пароль должен содержать заглавные, строчные буквы и цифры'
                }
            />

            <Button type="submit" variant="contained" fullWidth disabled={isSubmitting}>
                {isSubmitting ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
            </Button>

            <Button variant="text" fullWidth onClick={goToLogin} disabled={isSubmitting}>
                Уже есть аккаунт? Войти
            </Button>
        </Box>
    );
};
