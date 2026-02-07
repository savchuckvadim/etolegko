import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuthGetMe, type UserMeResponseDto } from '@entities/auth';
import { tokenStorage } from '@shared/lib';

export interface AuthContextValue {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: UserMeResponseDto | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

/**
 * Auth Context Provider - управляет состоянием аутентификации
 * Не использует router hooks, поэтому может быть вне Router
 */
export const AuthContextProvider = ({ children }: AuthProviderProps) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasTokens, setHasTokens] = useState(() => tokenStorage.hasTokens());
    const [isInitialCheck, setIsInitialCheck] = useState(true); // Флаг начальной проверки

    // Слушаем изменения localStorage для токенов
    useEffect(() => {
        const checkTokens = () => {
            setHasTokens(tokenStorage.hasTokens());
        };

        // Проверяем при монтировании
        checkTokens();

        // Слушаем события изменения localStorage (срабатывает при изменении в других вкладках)
        window.addEventListener('storage', checkTokens);
        
        // Слушаем кастомное событие для изменений в той же вкладке
        window.addEventListener('tokensUpdated', checkTokens);

        return () => {
            window.removeEventListener('storage', checkTokens);
            window.removeEventListener('tokensUpdated', checkTokens);
        };
    }, []);

    // Загружаем данные пользователя, если есть токены
    const {
        data: userData,
        isLoading,
        isError,
        refetch,
    } = useAuthGetMe(
        {
            query: {
                enabled: hasTokens, // Запрос выполняется только если есть токены
                retry: false, // Не повторяем запрос при ошибке
            },
        },
        undefined,
    );

    // Перезапрашиваем данные пользователя при появлении токенов
    useEffect(() => {
        if (hasTokens && !isLoading && !userData) {
            refetch();
        }
    }, [hasTokens, isLoading, userData, refetch]);

    // Отслеживаем завершение начальной проверки
    useEffect(() => {
        if (isInitialCheck) {
            // Если токенов нет, проверка завершена сразу
            if (!hasTokens) {
                setIsInitialCheck(false);
            }
            // Если токены есть, ждем завершения запроса
            else if (!isLoading) {
                setIsInitialCheck(false);
            }
        }
    }, [hasTokens, isLoading, isInitialCheck]);

    useEffect(() => {
        if (hasTokens && userData && 'status' in userData && userData.status === 200) {
            // Пользователь авторизован
            setIsAuthenticated(true);
        } else if (isError || !hasTokens) {
            // Пользователь не авторизован
            setIsAuthenticated(false);
            if (isError) {
                tokenStorage.clearTokens();
                setHasTokens(false);
            }
        }
    }, [hasTokens, userData, isError]);

    const value: AuthContextValue = {
        isAuthenticated,
        // Показываем загрузку во время начальной проверки или если идет запрос с токенами
        isLoading: isInitialCheck || (isLoading && hasTokens),
        user: userData && 'status' in userData && userData.status === 200 ? userData.data : null,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Auth Guard - компонент внутри роутера, выполняет редиректы
 * Должен быть внутри RouterProvider
 */
export const AuthGuard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        // Не выполняем редиректы во время загрузки
        if (isLoading) {
            return;
        }

        if (isAuthenticated) {
            // Пользователь авторизован
            // Если находимся на страницах логина/регистрации, редиректим на главную
            if (location.pathname === '/login' || location.pathname === '/register') {
                navigate('/', { replace: true });
            }
        } else {
            // Пользователь не авторизован
            // Если находимся на защищенной странице, редиректим на логин
            const isPublicRoute =
                location.pathname === '/login' ||
                location.pathname === '/register';

            if (!isPublicRoute) {
                navigate('/login', { replace: true });
            }
        }
    }, [isAuthenticated, isLoading, location.pathname, navigate]);

    // Показываем прелоадер во время проверки аутентификации
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return <Outlet />;
};

/**
 * Hook для использования контекста аутентификации
 */
export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthContextProvider');
    }
    return context;
};
