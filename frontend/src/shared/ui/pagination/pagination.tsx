import { Pagination as MuiPagination, PaginationItem } from '@mui/material';
import type { PaginatedResponse } from '../types';

export interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
}

/**
 * Компонент пагинации для таблиц
 */
export const Pagination = ({
    page,
    totalPages,
    onPageChange,
    disabled = false,
}: PaginationProps) => {
    return (
        <MuiPagination
            count={totalPages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            disabled={disabled}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
            renderItem={(item) => <PaginationItem {...item} disabled={disabled || item.disabled} />}
        />
    );
};
