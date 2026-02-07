import { useMemo } from 'react';
import {
    MaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
    type MRT_SortingState,
} from 'material-react-table';
import type { OnChangeFn } from '@tanstack/react-table';
import type { PromoCodeUsageHistoryDto } from '@shared/api/generated/models';

interface PromoCodeUsageHistoryTableProps {
    data: PromoCodeUsageHistoryDto[];
    total: number;
    page: number;
    limit: number;
    onPaginationChange: OnChangeFn<MRT_PaginationState>;
    onSortingChange: OnChangeFn<MRT_SortingState>;
    isLoading?: boolean;
}

/**
 * Таблица истории использований промокодов
 */
export const PromoCodeUsageHistoryTable = ({
    data,
    total,
    page,
    limit,
    onPaginationChange,
    onSortingChange,
    isLoading = false,
}: PromoCodeUsageHistoryTableProps) => {
    const columns = useMemo<MRT_ColumnDef<PromoCodeUsageHistoryDto>[]>(
        () => [
            {
                accessorKey: 'promo_code',
                header: 'Промокод',
                size: 150,
            },
            {
                accessorKey: 'user_id',
                header: 'ID пользователя',
                size: 200,
            },
            {
                accessorKey: 'order_id',
                header: 'ID заказа',
                size: 200,
            },
            {
                accessorKey: 'order_amount',
                header: 'Сумма заказа',
                size: 150,
                Cell: ({ cell }) => `${Number(cell.getValue()).toFixed(2)} ₽`,
            },
            {
                accessorKey: 'discount_amount',
                header: 'Сумма скидки',
                size: 150,
                Cell: ({ cell }) => `${Number(cell.getValue()).toFixed(2)} ₽`,
            },
            {
                accessorKey: 'created_at',
                header: 'Дата использования',
                size: 200,
                Cell: ({ cell }) => {
                    const date = new Date(cell.getValue() as string);
                    return date.toLocaleString('ru-RU');
                },
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
