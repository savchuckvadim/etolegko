import { memo, useMemo, useCallback } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import type { AnalyticsGetUsersListParams } from '@entities/analytics';
import { isSuccessResponse } from '@shared/lib/utils/error.utils';
import { DateFilter, type DatePreset } from '@shared/ui';
import { UsersAnalyticsTable } from '../users-analytics-table';
import type { MRT_PaginationState, MRT_SortingState } from 'material-react-table';
import type { OnChangeFn } from '@tanstack/react-table';
import type { useUsersAnalytics } from '@features/analytics';

interface UsersAnalyticsTabProps {
    query: ReturnType<typeof useUsersAnalytics>;
    params: AnalyticsGetUsersListParams;
    onParamsChange: (params: AnalyticsGetUsersListParams) => void;
    datePreset: DatePreset;
    dateFrom?: string;
    dateTo?: string;
    onDatePresetChange: (preset: DatePreset) => void;
    onDateFromChange: (date: string) => void;
    onDateToChange: (date: string) => void;
}

export const UsersAnalyticsTab = memo(
    ({
        query,
        params,
        onParamsChange,
        datePreset,
        dateFrom,
        dateTo,
        onDatePresetChange,
        onDateFromChange,
        onDateToChange,
    }: UsersAnalyticsTabProps) => {
        const handlePaginationChange: OnChangeFn<MRT_PaginationState> = useCallback(
            (updaterOrValue) => {
                const pagination =
                    typeof updaterOrValue === 'function'
                        ? updaterOrValue({
                              pageIndex: (params.page || 1) - 1,
                              pageSize: params.limit || 10,
                          })
                        : updaterOrValue;
                onParamsChange({
                    ...params,
                    page: pagination.pageIndex + 1,
                    limit: pagination.pageSize,
                });
            },
            [params, onParamsChange],
        );

        const handleSortingChange: OnChangeFn<MRT_SortingState> = useCallback(
            (updaterOrValue) => {
                const sorting =
                    typeof updaterOrValue === 'function' ? updaterOrValue([]) : updaterOrValue;
                if (sorting.length > 0) {
                    const sort = sorting[0];
                    onParamsChange({
                        ...params,
                        page: 1,
                        sortBy: sort.id,
                        sortOrder: sort.desc ? 'desc' : 'asc',
                    });
                }
            },
            [params, onParamsChange],
        );

        const responseData = useMemo(() => {
            if (!query.data) return null;
            return isSuccessResponse(query.data) ? query.data.data : null;
        }, [query.data]);

        if (query.isLoading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (query.isError) {
            return <Alert severity="error">Ошибка при загрузке данных</Alert>;
        }

        if (!responseData) {
            return <Alert severity="info">Нет данных</Alert>;
        }

        return (
            <>
                <DateFilter
                    preset={datePreset}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onPresetChange={onDatePresetChange}
                    onDateFromChange={onDateFromChange}
                    onDateToChange={onDateToChange}
                />

                <UsersAnalyticsTable
                    data={responseData.items}
                    total={responseData.total}
                    page={responseData.page}
                    limit={responseData.limit}
                    onPaginationChange={handlePaginationChange}
                    onSortingChange={handleSortingChange}
                    isLoading={query.isLoading}
                />
            </>
        );
    },
);

UsersAnalyticsTab.displayName = 'UsersAnalyticsTab';
