import { useState } from 'react';
import { Typography, Box, Button, CircularProgress, Alert, IconButton } from '@mui/material';
import { Edit, Delete, LocalOffer } from '@mui/icons-material';
import { MainLayout } from '@widgets/layout/main-layout';
import { usePromoCodes } from '@features/promo-codes';
import type { PromoCodesFindAllParams, PromoCodeResponseDto } from '@entities/promo-codes';
import { isSuccessResponse } from '@shared/lib/utils/error.utils';
import { Pagination } from '@shared/ui';
import {
    CreatePromoCodeDialog,
    UpdatePromoCodeDialog,
    ApplyPromoCodeDialog,
} from '@widgets/promo-codes';
import { useRemoveUser } from '@features/users';

/**
 * Страница управления промокодами
 */
export const PromoCodesPage = () => {
    const [params, setParams] = useState<PromoCodesFindAllParams>({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingPromoCode, setEditingPromoCode] = useState<PromoCodeResponseDto | null>(null);
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);

    const { findAll, remove } = usePromoCodes(params);

    const handlePageChange = (page: number) => {
        setParams((prev) => ({ ...prev, page }));
    };

    if (findAll.isLoading) {
        return (
            <MainLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            </MainLayout>
        );
    }

    if (findAll.isError) {
        return (
            <MainLayout>
                <Alert severity="error">Ошибка при загрузке промокодов</Alert>
            </MainLayout>
        );
    }

    const response = findAll.data;
    const data = isSuccessResponse(response) ? response.data : null;

    return (
        <MainLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Промокоды</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<LocalOffer />}
                        onClick={() => setIsApplyDialogOpen(true)}
                    >
                        Применить промокод
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        Создать промокод
                    </Button>
                </Box>
            </Box>

            <CreatePromoCodeDialog
                open={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
            />

            {editingPromoCode && (
                <UpdatePromoCodeDialog
                    open={!!editingPromoCode}
                    onClose={() => setEditingPromoCode(null)}
                    promoCode={editingPromoCode}
                />
            )}

            <ApplyPromoCodeDialog
                open={isApplyDialogOpen}
                onClose={() => setIsApplyDialogOpen(false)}
            />

            {data && (
                <>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Всего: {data.total} | Страница {data.page} из {data.totalPages}
                        </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        {data.items.map((promoCode) => (
                            <Box
                                key={promoCode.id}
                                sx={{
                                    p: 2,
                                    mb: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Box>
                                    <Typography variant="body1">
                                        {promoCode.code} {!promoCode.isActive && '(Неактивен)'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Скидка: {promoCode.discountPercent}% | Лимит: {promoCode.totalLimit} | На пользователя: {promoCode.perUserLimit}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setEditingPromoCode(promoCode)}
                                        color="primary"
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            if (window.confirm('Вы уверены, что хотите удалить промокод?')) {
                                                remove.mutate({ id: promoCode.id });
                                            }
                                        }}
                                        color="error"
                                        disabled={remove.isPending}
                                    >
                                        <Delete />
                                    </IconButton>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {data.totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                page={data.page}
                                totalPages={data.totalPages}
                                onPageChange={handlePageChange}
                                disabled={findAll.isLoading}
                            />
                        </Box>
                    )}
                </>
            )}
        </MainLayout>
    );
};
