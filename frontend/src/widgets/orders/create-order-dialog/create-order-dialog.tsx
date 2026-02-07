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
import { useCreateOrderForm } from '@features/orders';

export interface CreateOrderDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Модальное окно для создания нового заказа
 */
export const CreateOrderDialog = ({ open, onClose }: CreateOrderDialogProps) => {
    const { register, handleSubmit, errors, isSubmitting, reset } = useCreateOrderForm(() => {
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
                <DialogTitle>Создать заказ</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        {errors.root && (
                            <Alert severity="error" onClose={() => {}}>
                                {errors.root.message}
                            </Alert>
                        )}

                        <TextField
                            {...register('amount', { valueAsNumber: true })}
                            label="Сумма заказа"
                            type="number"
                            fullWidth
                            disabled={isSubmitting}
                            error={!!errors.amount}
                            helperText={errors.amount?.message}
                            inputProps={{ min: 0, step: 0.01 }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={isSubmitting}>
                        Отмена
                    </Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Создать'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};
