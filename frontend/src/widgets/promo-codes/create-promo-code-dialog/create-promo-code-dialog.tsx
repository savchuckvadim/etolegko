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
import { useCreatePromoCodeForm } from '@features/promo-codes';

export interface CreatePromoCodeDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Модальное окно для создания нового промокода
 */
export const CreatePromoCodeDialog = ({ open, onClose }: CreatePromoCodeDialogProps) => {
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        reset,
    } = useCreatePromoCodeForm(() => {
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
                <DialogTitle>Создать промокод</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        {errors.root && (
                            <Alert severity="error" onClose={() => {}}>
                                {errors.root.message}
                            </Alert>
                        )}

                        <TextField
                            {...register('code')}
                            label="Код промокода"
                            fullWidth
                            disabled={isSubmitting}
                            error={!!errors.code}
                            helperText={errors.code?.message}
                            placeholder="SUMMER2024"
                        />

                        <TextField
                            {...register('discountPercent', { valueAsNumber: true })}
                            label="Процент скидки"
                            type="number"
                            fullWidth
                            disabled={isSubmitting}
                            error={!!errors.discountPercent}
                            helperText={errors.discountPercent?.message || 'От 1 до 100'}
                            inputProps={{ min: 1, max: 100 }}
                        />

                        <TextField
                            {...register('totalLimit', { valueAsNumber: true })}
                            label="Общий лимит использований"
                            type="number"
                            fullWidth
                            disabled={isSubmitting}
                            error={!!errors.totalLimit}
                            helperText={errors.totalLimit?.message}
                            inputProps={{ min: 1 }}
                        />

                        <TextField
                            {...register('perUserLimit', { valueAsNumber: true })}
                            label="Лимит использований на пользователя"
                            type="number"
                            fullWidth
                            disabled={isSubmitting}
                            error={!!errors.perUserLimit}
                            helperText={errors.perUserLimit?.message}
                            inputProps={{ min: 1 }}
                        />

                        <TextField
                            {...register('startsAt')}
                            label="Дата начала действия"
                            type="datetime-local"
                            fullWidth
                            disabled={isSubmitting}
                            error={!!errors.startsAt}
                            helperText={errors.startsAt?.message || 'Опционально'}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            {...register('endsAt')}
                            label="Дата окончания действия"
                            type="datetime-local"
                            fullWidth
                            disabled={isSubmitting}
                            error={!!errors.endsAt}
                            helperText={errors.endsAt?.message || 'Опционально'}
                            InputLabelProps={{ shrink: true }}
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
