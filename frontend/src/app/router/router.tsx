import { createBrowserRouter } from 'react-router-dom';
import { LoginPage, RegisterPage } from '@pages/auth';
import { AuthGuard } from '@processes/auth';
import { HomePage } from '@pages/home';
import { UsersPage } from '@pages/users';
import { PromoCodesPage } from '@pages/promo-codes';
import { OrdersPage } from '@pages/orders';
import { AnalyticsPage } from '@pages/analytics';

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
            {
                path: '/users',
                element: <UsersPage />,
            },
            {
                path: '/promo-codes',
                element: <PromoCodesPage />,
            },
            {
                path: '/orders',
                element: <OrdersPage />,
            },
            {
                path: '/analytics',
                element: <AnalyticsPage />,
            },
        ],
    },
]);
