import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <div>Home Page</div>,
    },
    {
        path: '/login',
        element: <div>Login Page</div>,
    },
    {
        path: '/register',
        element: <div>Register Page</div>,
    },
]);
