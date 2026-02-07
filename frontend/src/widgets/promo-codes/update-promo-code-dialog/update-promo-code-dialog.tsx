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
    FormControlLabel,
    Switch,
} from '@mui/material';
import { useUpdatePromoCodeForm } from '@features/promo-codes';
import type { PromoCodeResponseDto } from '@entities/promo-codes';

export interface UpdatePromoCodeDialogProps {
    open: boolean;
    onClose: () => void;
    promoCode: PromoCodeResponseDto;
}

/**
 * Модальное окно для обновления промокода
 */
export const UpdatePromoCodeDialog = ({ open, onClose, promoCode }: UpdatePromoCodeDialogProps) => {
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        reset,
    } = useUpdatePromoCodeForm(promoCode.id, () => {
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
                <DialogTitle>Обновить промокод: {promoCode.code}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        {errors.root && (
                            <Alert severity="error" onClose={() => {}}>
                                {errors.root.message}
                            </Alert>
                        )}

                        <TextField
                            {...register('discountPercent', { valueAsNumber: true })}
                            label="Процент скидки"
                            type="number"
                            fullWidth
                            disabled={isSubmitting}
                            error={!!errors.discountPercent}
                            helperText={errors.discountPercent?.message || 'От 1 до 100'}
                            inputProps={{ min: 1, max: 100 }}
                            defaultValue={promoCode.discountPercent}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    {...register('isActive')}
                                    defaultChecked={promoCode.isActive}
                                    disabled={isSubmitting}
                                />
                            }
                            label="Активен"
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
                        {isSubmitting ? <CircularProgress size={24} /> : 'Обновить'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};
