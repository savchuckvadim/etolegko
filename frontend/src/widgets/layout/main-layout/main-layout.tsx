import { Box, Container } from '@mui/material';
import type { ReactNode } from 'react';
import { Header } from '../header';

export interface MainLayoutProps {
    children: ReactNode;
}

/**
 * Основной layout с Header
 */
export const MainLayout = ({ children }: MainLayoutProps) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <Box component="main" sx={{ flexGrow: 1 }}>
                <Container maxWidth="xl" sx={{ py: 4 }}>
                    {children}
                </Container>
            </Box>
        </Box>
    );
};
