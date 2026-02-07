import { useState } from 'react';
import { Typography, Box, Button, CircularProgress, Alert } from '@mui/material';
import { MainLayout } from '@widgets/layout/main-layout';
import { useOrders } from '@features/orders';
import type { OrdersFindAllParams } from '@entities/orders';
import { isSuccessResponse } from '@shared/lib/utils/error.utils';
import { Pagination } from '@shared/ui';

/**
 * Страница управления заказами
 */
export const OrdersPage = () => {
    const [params, setParams] = useState<OrdersFindAllParams>({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });

    const { findAll, create, update, remove } = useOrders(params);

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
                <Alert severity="error">Ошибка при загрузке заказов</Alert>
            </MainLayout>
        );
    }

    const response = findAll.data;
    const data = isSuccessResponse(response) ? response.data : null;

    return (
        <MainLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Заказы</Typography>
                <Button variant="contained" color="primary">
                    Создать заказ
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
                        {data.items.map((order) => (
                            <Box
                                key={order.id}
                                sx={{
                                    p: 2,
                                    mb: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                }}
                            >
                                <Typography variant="body1">Заказ #{order.id}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Сумма: {order.amount} ₽
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
