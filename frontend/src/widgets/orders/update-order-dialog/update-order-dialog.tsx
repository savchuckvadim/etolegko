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
import { useUpdateOrderForm } from '@features/orders';
import type { OrderResponseDto } from '@entities/orders';

export interface UpdateOrderDialogProps {
    open: boolean;
    onClose: () => void;
    order: OrderResponseDto;
}

/**
 * Модальное окно для обновления заказа
 */
export const UpdateOrderDialog = ({ open, onClose, order }: UpdateOrderDialogProps) => {
    const { register, handleSubmit, errors, isSubmitting, reset } = useUpdateOrderForm(
        order.id,
        () => {
            onClose();
        },
    );

    const handleClose = () => {
        if (!isSubmitting) {
            reset();
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <Box component="form" onSubmit={handleSubmit}>
                <DialogTitle>Обновить заказ #{order.id}</DialogTitle>
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
                            defaultValue={order.amount}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={isSubmitting}>
                        Отмена
                    </Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : 'Обновить'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};
