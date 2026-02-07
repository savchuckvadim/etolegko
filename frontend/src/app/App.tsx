import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './providers/query-provider';
import { AppThemeProvider } from './providers/theme-provider';
import { router } from './router/router';

function App() {
    return (
        <AppThemeProvider>
            <QueryProvider>
                <RouterProvider router={router} />
            </QueryProvider>
        </AppThemeProvider>
    );
}

export default App;
