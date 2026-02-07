import { useAuth } from '@processes/auth';
import { Box, Typography, Button } from '@mui/material';
import { tokenStorage } from '@shared/lib';

export const HomePage = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    const handleLogout = () => {
        tokenStorage.clearTokens();
        window.location.href = '/login';
    };

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Главная страница
            </Typography>
            {isAuthenticated && user ? (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Добро пожаловать, {user.name}!
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        Email: {user.email}
                    </Typography>
                    {user.phone && (
                        <Typography variant="body1" gutterBottom>
                            Телефон: {user.phone}
                        </Typography>
                    )}
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleLogout}
                        sx={{ mt: 2 }}
                    >
                        Выйти
                    </Button>
                </Box>
            ) : (
                <Typography variant="body1">
                    Вы не авторизованы
                </Typography>
            )}
        </Box>
    );
};