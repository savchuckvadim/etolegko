import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './providers/query-provider';
import { AppThemeProvider } from './providers/theme-provider';
import { AuthContextProvider } from '@processes/auth';
import { router } from './router/router';

function App() {
    return (
        <AppThemeProvider>
            <QueryProvider>
                <AuthContextProvider>
                    <RouterProvider router={router} />
                </AuthContextProvider>
            </QueryProvider>
        </AppThemeProvider>
    );
}

export default App;
