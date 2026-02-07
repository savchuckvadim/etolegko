import { createBrowserRouter } from 'react-router-dom';
import { LoginPage, RegisterPage } from '@pages/auth';
import { AuthGuard } from '@processes/auth';
import { HomePage } from '@pages/home';


/**
 * Компонент главной страницы с примером использования useAuth
 */


export const router = createBrowserRouter([
    {
        element: <AuthGuard />,
        children: [
            {
                path: '/',
                element: <HomePage />,
            },
            {
                path: '/login',
                element: <LoginPage />,
            },
            {
                path: '/register',
                element: <RegisterPage />,
            },
        ],
    },
]);
