import { useAuth } from '@processes/auth';
import { Box, Typography } from '@mui/material';
import { MainLayout } from '@widgets/layout/main-layout';

export const HomePage = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <MainLayout>
                <div>Загрузка...</div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
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
                </Box>
            ) : (
                <Typography variant="body1">
                    Вы не авторизованы
                </Typography>
            )}
        </MainLayout>
    );
};