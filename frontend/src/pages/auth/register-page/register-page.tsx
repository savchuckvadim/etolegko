import { Box, Container } from '@mui/material';
import { RegisterForm } from '@widgets/auth';

/**
 * Страница регистрации
 */
export const RegisterPage = () => {
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
            <Container maxWidth="sm" sx={{ width: '100%' }}>
                <RegisterForm />
            </Container>
        </Box>
    );
};
