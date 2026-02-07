import { useState } from 'react';
import { Typography, Box, Button, CircularProgress, Alert } from '@mui/material';
import { MainLayout } from '@widgets/layout/main-layout';
import { useUsers } from '@features/users';
import type { UsersFindAllParams } from '@entities/users';
import { isSuccessResponse } from '@shared/lib/utils/error.utils';
import { Pagination } from '@shared/ui';

/**
 * Страница управления пользователями
 */
export const UsersPage = () => {
    const [params, setParams] = useState<UsersFindAllParams>({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });

    const { findAll, create, update, remove } = useUsers(params);

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
                <Alert severity="error">Ошибка при загрузке пользователей</Alert>
            </MainLayout>
        );
    }

    const response = findAll.data;
    const data = isSuccessResponse(response) ? response.data : null;

    return (
        <MainLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Пользователи</Typography>
                <Button variant="contained" color="primary">
                    Создать пользователя
                </Button>
            </Box>

            {data && (
                <>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Всего: {data.total} | Страница {data.page} из {data.totalPages}
                        </Typography>
                    </Box>

                    {/* Таблица пользователей будет здесь */}
                    <Box sx={{ mb: 3 }}>
                        {data.items.map((user) => (
                            <Box
                                key={user.id}
                                sx={{
                                    p: 2,
                                    mb: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                }}
                            >
                                <Typography variant="body1">{user.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {user.email}
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
