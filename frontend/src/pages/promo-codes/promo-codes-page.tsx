import { useState } from 'react';
import { Typography, Box, Button, CircularProgress, Alert } from '@mui/material';
import { MainLayout } from '@widgets/layout/main-layout';
import { usePromoCodes } from '@features/promo-codes';
import type { PromoCodesFindAllParams } from '@entities/promo-codes';
import { isSuccessResponse } from '@shared/lib/utils/error.utils';
import { Pagination } from '@shared/ui';

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

    const { findAll, create, update, remove, apply } = usePromoCodes(params);

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
                <Button variant="contained" color="primary">
                    Создать промокод
                </Button>
            </Box>

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
                                }}
                            >
                                <Typography variant="body1">{promoCode.code}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Скидка: {promoCode.discountPercent}%
                                </Typography>
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
