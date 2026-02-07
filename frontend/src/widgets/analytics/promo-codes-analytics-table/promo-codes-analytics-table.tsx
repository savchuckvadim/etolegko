import { useMemo } from 'react';
import {
    MaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
    type MRT_SortingState,
} from 'material-react-table';
import type { OnChangeFn } from '@tanstack/react-table';
import type { PromoCodeAnalyticsDto } from '@shared/api/generated/models';

interface PromoCodesAnalyticsTableProps {
    data: PromoCodeAnalyticsDto[];
    total: number;
    page: number;
    limit: number;
    onPaginationChange: OnChangeFn<MRT_PaginationState>;
    onSortingChange: OnChangeFn<MRT_SortingState>;
    isLoading?: boolean;
}

/**
 * Таблица аналитики промокодов
 */
export const PromoCodesAnalyticsTable = ({
    data,
    total,
    page,
    limit,
    onPaginationChange,
    onSortingChange,
    isLoading = false,
}: PromoCodesAnalyticsTableProps) => {
    const columns = useMemo<MRT_ColumnDef<PromoCodeAnalyticsDto>[]>(
        () => [
            {
                accessorKey: 'promo_code',
                header: 'Промокод',
                size: 150,
            },
            {
                accessorKey: 'usage_count',
                header: 'Количество использований',
                size: 150,
            },
            {
                accessorKey: 'total_discount',
                header: 'Общая сумма скидки',
                size: 150,
                Cell: ({ cell }) => `${Number(cell.getValue()).toFixed(2)} ₽`,
            },
            {
                accessorKey: 'total_revenue',
                header: 'Общая выручка',
                size: 150,
                Cell: ({ cell }) => `${Number(cell.getValue()).toFixed(2)} ₽`,
            },
            {
                accessorKey: 'unique_users',
                header: 'Уникальных пользователей',
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
