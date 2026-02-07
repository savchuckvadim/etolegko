import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '@processes/auth';
import { tokenStorage } from '@shared/lib';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Header компонент с навигацией и кнопкой выхода
 */
export const Header = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        tokenStorage.clearTokens();
        // AuthGuard автоматически выполнит редирект на /login
    };

    const navItems = [
        { label: 'Главная', path: '/' },
        { label: 'Пользователи', path: '/users' },
        { label: 'Промокоды', path: '/promo-codes' },
        { label: 'Заказы', path: '/orders' },
        { label: 'Аналитика', path: '/analytics' },
    ];

    if (!isAuthenticated) {
        return null;
    }

    return (
        <AppBar position="sticky" sx={{ top: 0, zIndex: 1100 }}>
            <Toolbar>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ mr: 4, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    PromoCode Manager
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
                    {navItems.map((item) => (
                        <Button
                            key={item.path}
                            color="inherit"
                            onClick={() => navigate(item.path)}
                            variant={location.pathname === item.path ? 'outlined' : 'text'}
                            sx={{
                                borderColor:
                                    location.pathname === item.path ? 'white' : 'transparent',
                            }}
                        >
                            {item.label}
                        </Button>
                    ))}
                </Box>
                {user && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2">{user.name}</Typography>
                        <Button color="inherit" onClick={handleLogout}>
                            Выйти
                        </Button>
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};
