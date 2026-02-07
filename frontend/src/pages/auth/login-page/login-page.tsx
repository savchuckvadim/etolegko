import { Box, Container } from '@mui/material';
import { LoginForm } from '@widgets/auth';

/**
 * Страница логина
 */
export const LoginPage = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                width: '100vw',
                px: 2,
            }}
        >
            <Container maxWidth="sm" sx={{
                width: '100%', 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <LoginForm />
            </Container>
        </Box>
    );
};
