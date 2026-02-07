import { useState } from 'react';
import { Typography, Box, Button, CircularProgress, Alert, IconButton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { MainLayout } from '@widgets/layout/main-layout';
import { useOrders } from '@features/orders';
import type { OrdersFindAllParams, OrderResponseDto } from '@entities/orders';
import { isSuccessResponse } from '@shared/lib/utils/error.utils';
import { Pagination } from '@shared/ui';
import { CreateOrderDialog, UpdateOrderDialog } from '@widgets/orders';

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
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<OrderResponseDto | null>(null);

    const { findAll, remove } = useOrders(params);

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
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setIsCreateDialogOpen(true)}
                >
                    Создать заказ
                </Button>
            </Box>

            <CreateOrderDialog
                open={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
            />

            {editingOrder && (
                <UpdateOrderDialog
                    open={!!editingOrder}
                    onClose={() => setEditingOrder(null)}
                    order={editingOrder}
                />
            )}

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
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Box>
                                    <Typography variant="body1">Заказ #{order.id}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Сумма: {order.amount} ₽
                                        {order.promoCodeId && ` | Промокод ID: ${order.promoCodeId}`}
                                        {order.discountAmount && ` | Скидка: ${order.discountAmount} ₽`}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => setEditingOrder(order)}
                                        color="primary"
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            if (window.confirm('Вы уверены, что хотите удалить заказ?')) {
                                                remove.mutate({ id: order.id });
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
