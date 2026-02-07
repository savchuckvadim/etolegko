import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useCreateUserForm } from '@features/users';

export interface CreateUserDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Модальное окно для создания нового пользователя
 */
export const CreateUserDialog = ({ open, onClose }: CreateUserDialogProps) => {
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        reset,
    } = useCreateUserForm(() => {
        onClose();
    });

    const handleClose = () => {
        if (!isSubmitting) {
            reset();
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <Box component="form" onSubmit={handleSubmit}>
                <DialogTitle>Создать пользователя</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        {errors.root && (
                            <Alert severity="error" onClose={() => {}}>
                                {errors.root.message}
                            </Alert>
                        )}

                        <TextField
                            {...register('name')}
                            label="Имя"
                            fullWidth
                            disabled={isSubmitting}
                            autoComplete="name"
                            error={!!errors.name}
                            helperText={errors.name?.message}
                        />

                        <TextField
                            {...register('email')}
                            label="Email"
                            type="email"
                            fullWidth
                            disabled={isSubmitting}
                            autoComplete="email"
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />

                        <TextField
                            {...register('phone')}
                            label="Телефон"
                            type="tel"
                            fullWidth
                            disabled={isSubmitting}
                            autoComplete="tel"
                            error={!!errors.phone}
                            helperText={errors.phone?.message}
                        />

                        <TextField
                            {...register('password')}
                            label="Пароль"
                            type="password"
                            fullWidth
                            disabled={isSubmitting}
                            autoComplete="new-password"
                            error={!!errors.password}
                            helperText={errors.password?.message || 'Пароль должен содержать заглавные, строчные буквы и цифры'}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={isSubmitting}>
                        Отмена
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : 'Создать'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};
