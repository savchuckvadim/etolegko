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
import { useApplyPromoCodeForm } from '@features/promo-codes';

export interface ApplyPromoCodeDialogProps {
    open: boolean;
    onClose: () => void;
    orderId?: string;
}

/**
 * Модальное окно для применения промокода к заказу
 */
export const ApplyPromoCodeDialog = ({ open, onClose, orderId }: ApplyPromoCodeDialogProps) => {
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        reset,
    } = useApplyPromoCodeForm(() => {
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
                <DialogTitle>Применить промокод</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        {errors.root && (
                            <Alert severity="error" onClose={() => {}}>
                                {errors.root.message}
                            </Alert>
                        )}

                        <TextField
                            {...register('orderId')}
                            label="ID заказа"
                            fullWidth
                            disabled={isSubmitting || !!orderId}
                            error={!!errors.orderId}
                            helperText={errors.orderId?.message}
                            defaultValue={orderId}
                        />

                        <TextField
                            {...register('promoCode')}
                            label="Код промокода"
                            fullWidth
                            disabled={isSubmitting}
                            error={!!errors.promoCode}
                            helperText={errors.promoCode?.message}
                            placeholder="SUMMER2024"
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
                        {isSubmitting ? <CircularProgress size={24} /> : 'Применить'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};
