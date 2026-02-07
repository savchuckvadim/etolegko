import {
    Box,
    Button,
    TextField,
    Typography,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useLoginForm } from '@features/auth';

/**
 * Форма логина
 * Использует react-hook-form и хук useLoginForm для управления состоянием
 */
export const LoginForm = () => {
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        goToRegister,
    } = useLoginForm();

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
                Вход
            </Typography>

            {errors.root && (
                <Alert severity="error" onClose={() => {}}>
                    {errors.root.message}
                </Alert>
            )}

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
                {...register('password')}
                label="Пароль"
                type="password"
                fullWidth
                disabled={isSubmitting}
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
            />

            <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isSubmitting}
            >
                {isSubmitting ? <CircularProgress size={24} /> : 'Войти'}
            </Button>

            <Button
                variant="text"
                fullWidth
                onClick={goToRegister}
                disabled={isSubmitting}
            >
                Нет аккаунта? Зарегистрироваться
            </Button>
        </Box>
    );
};
