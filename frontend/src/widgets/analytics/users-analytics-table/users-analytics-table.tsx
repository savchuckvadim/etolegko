import { useMemo } from 'react';
import {
    MaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
    type MRT_SortingState,
} from 'material-react-table';
import type { OnChangeFn } from '@tanstack/react-table';
import type { UserAnalyticsDto } from '@shared/api/generated/models';

interface UsersAnalyticsTableProps {
    data: UserAnalyticsDto[];
    total: number;
    page: number;
    limit: number;
    onPaginationChange: OnChangeFn<MRT_PaginationState>;
    onSortingChange: OnChangeFn<MRT_SortingState>;
    isLoading?: boolean;
}

/**
 * Таблица аналитики пользователей
 */
export const UsersAnalyticsTable = ({
    data,
    total,
    page,
    limit,
    onPaginationChange,
    onSortingChange,
    isLoading = false,
}: UsersAnalyticsTableProps) => {
    const columns = useMemo<MRT_ColumnDef<UserAnalyticsDto>[]>(
        () => [
            {
                accessorKey: 'user_id',
                header: 'ID пользователя',
                size: 200,
            },
            {
                accessorKey: 'orders_count',
                header: 'Количество заказов',
                size: 150,
            },
            {
                accessorKey: 'total_amount',
                header: 'Общая сумма',
                size: 150,
                Cell: ({ cell }) => `${Number(cell.getValue()).toFixed(2)} ₽`,
            },
            {
                accessorKey: 'promo_codes_used',
                header: 'Использовано промокодов',
                size: 150,
            },
        ],
        [],
    );

    return (
        <MaterialReactTable
            columns={columns}
            data={data}
            enableColumnActions={false}
            enableColumnFilters={false}
            enablePagination
            enableSorting
            manualPagination
            manualSorting
            rowCount={total}
            state={{
                pagination: {
                    pageIndex: page - 1,
                    pageSize: limit,
                },
                isLoading,
            }}
            onPaginationChange={onPaginationChange}
            onSortingChange={onSortingChange}
            muiTableContainerProps={{ sx: { maxHeight: '600px' } }}
        />
    );
};
