import { useState } from 'react';
import { Typography, Box, CircularProgress, Alert, Tabs, Tab } from '@mui/material';
import { MainLayout } from '@widgets/layout/main-layout';
import {
    usePromoCodesAnalytics,
    useUsersAnalytics,
    usePromoCodeUsageHistory,
} from '@features/analytics';
import type {
    AnalyticsGetPromoCodesListParams,
    AnalyticsGetUsersListParams,
    AnalyticsGetPromoCodeUsageHistoryParams,
} from '@entities/analytics';
import { isSuccessResponse } from '@shared/lib/utils/error.utils';
import { DateFilter, type DatePreset } from '@shared/ui';
import {
    PromoCodesAnalyticsTable,
    UsersAnalyticsTable,
    PromoCodeUsageHistoryTable,
} from '@widgets/analytics';
import type { MRT_PaginationState, MRT_SortingState } from 'material-react-table';
import type { OnChangeFn } from '@tanstack/react-table';

/**
 * Страница аналитики
 */
export const AnalyticsPage = () => {
    const [activeTab, setActiveTab] = useState(0);

    // Инициализация дат для промокодов
    const getInitialDates = () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        return {
            from: last30Days.toISOString().split('T')[0],
            to: todayStr,
        };
    };

    const initialDates = getInitialDates();

    // Промокоды
    const [promoCodesDatePreset, setPromoCodesDatePreset] = useState<DatePreset>('last30days');
    const [promoCodesDateFrom, setPromoCodesDateFrom] = useState<string>(initialDates.from);
    const [promoCodesDateTo, setPromoCodesDateTo] = useState<string>(initialDates.to);
    const [promoCodesParams, setPromoCodesParams] = useState<AnalyticsGetPromoCodesListParams>({
        page: 1,
        limit: 10,
        datePreset: 'last30days',
        dateFrom: initialDates.from,
        dateTo: initialDates.to,
    });

    // Пользователи
    const [usersDatePreset, setUsersDatePreset] = useState<DatePreset>('last30days');
    const [usersDateFrom, setUsersDateFrom] = useState<string>(initialDates.from);
    const [usersDateTo, setUsersDateTo] = useState<string>(initialDates.to);
    const [usersParams, setUsersParams] = useState<AnalyticsGetUsersListParams>({
        page: 1,
        limit: 10,
        datePreset: 'last30days',
        dateFrom: initialDates.from,
        dateTo: initialDates.to,
    });

    // История
    const [historyDatePreset, setHistoryDatePreset] = useState<DatePreset>('last30days');
    const [historyDateFrom, setHistoryDateFrom] = useState<string>(initialDates.from);
    const [historyDateTo, setHistoryDateTo] = useState<string>(initialDates.to);
    const [historyParams, setHistoryParams] = useState<AnalyticsGetPromoCodeUsageHistoryParams>({
        page: 1,
        limit: 10,
        datePreset: 'last30days',
        dateFrom: initialDates.from,
        dateTo: initialDates.to,
    });

    const promoCodesQuery = usePromoCodesAnalytics(promoCodesParams);
    const usersQuery = useUsersAnalytics(usersParams);
    const historyQuery = usePromoCodeUsageHistory(historyParams);

    const handleTabChange = (_: unknown, newValue: number) => {
        setActiveTab(newValue);
    };

    // Обработчики для промокодов
    const handlePromoCodesDatePresetChange = (preset: DatePreset) => {
        setPromoCodesDatePreset(preset);
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        let dateFrom = '';
        let dateTo = todayStr;

        if (preset === 'today') {
            dateFrom = todayStr;
            dateTo = todayStr;
        } else if (preset === 'last7days') {
            const last7Days = new Date(today);
            last7Days.setDate(today.getDate() - 7);
            dateFrom = last7Days.toISOString().split('T')[0];
        } else if (preset === 'last30days') {
            const last30Days = new Date(today);
            last30Days.setDate(today.getDate() - 30);
            dateFrom = last30Days.toISOString().split('T')[0];
        }

        setPromoCodesDateFrom(dateFrom);
        setPromoCodesDateTo(dateTo);
        setPromoCodesParams({
            ...promoCodesParams,
            page: 1,
            datePreset: preset,
            dateFrom: preset === 'custom' ? promoCodesDateFrom : dateFrom,
            dateTo: preset === 'custom' ? promoCodesDateTo : dateTo,
        });
    };

    const handlePromoCodesDateFromChange = (date: string) => {
        setPromoCodesDateFrom(date);
        setPromoCodesParams({
            ...promoCodesParams,
            page: 1,
            dateFrom: date,
        });
    };

    const handlePromoCodesDateToChange = (date: string) => {
        setPromoCodesDateTo(date);
        setPromoCodesParams({
            ...promoCodesParams,
            page: 1,
            dateTo: date,
        });
    };

    // Обработчики для пользователей
    const handleUsersDatePresetChange = (preset: DatePreset) => {
        setUsersDatePreset(preset);
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        let dateFrom = '';
        let dateTo = todayStr;

        if (preset === 'today') {
            dateFrom = todayStr;
            dateTo = todayStr;
        } else if (preset === 'last7days') {
            const last7Days = new Date(today);
            last7Days.setDate(today.getDate() - 7);
            dateFrom = last7Days.toISOString().split('T')[0];
        } else if (preset === 'last30days') {
            const last30Days = new Date(today);
            last30Days.setDate(today.getDate() - 30);
            dateFrom = last30Days.toISOString().split('T')[0];
        }

        setUsersDateFrom(dateFrom);
        setUsersDateTo(dateTo);
        setUsersParams({
            ...usersParams,
            page: 1,
            datePreset: preset,
            dateFrom: preset === 'custom' ? usersDateFrom : dateFrom,
            dateTo: preset === 'custom' ? usersDateTo : dateTo,
        });
    };

    const handleUsersDateFromChange = (date: string) => {
        setUsersDateFrom(date);
        setUsersParams({
            ...usersParams,
            page: 1,
            dateFrom: date,
        });
    };

    const handleUsersDateToChange = (date: string) => {
        setUsersDateTo(date);
        setUsersParams({
            ...usersParams,
            page: 1,
            dateTo: date,
        });
    };

    // Обработчики для истории
    const handleHistoryDatePresetChange = (preset: DatePreset) => {
        setHistoryDatePreset(preset);
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        let dateFrom = '';
        let dateTo = todayStr;

        if (preset === 'today') {
            dateFrom = todayStr;
            dateTo = todayStr;
        } else if (preset === 'last7days') {
            const last7Days = new Date(today);
            last7Days.setDate(today.getDate() - 7);
            dateFrom = last7Days.toISOString().split('T')[0];
        } else if (preset === 'last30days') {
            const last30Days = new Date(today);
            last30Days.setDate(today.getDate() - 30);
            dateFrom = last30Days.toISOString().split('T')[0];
        }

        setHistoryDateFrom(dateFrom);
        setHistoryDateTo(dateTo);
        setHistoryParams({
            ...historyParams,
            page: 1,
            datePreset: preset,
            dateFrom: preset === 'custom' ? historyDateFrom : dateFrom,
            dateTo: preset === 'custom' ? historyDateTo : dateTo,
        });
    };

    const handleHistoryDateFromChange = (date: string) => {
        setHistoryDateFrom(date);
        setHistoryParams({
            ...historyParams,
            page: 1,
            dateFrom: date,
        });
    };

    const handleHistoryDateToChange = (date: string) => {
        setHistoryDateTo(date);
        setHistoryParams({
            ...historyParams,
            page: 1,
            dateTo: date,
        });
    };

    return (
        <MainLayout>
            <Typography variant="h4" gutterBottom>
                Аналитика
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Промокоды" />
                    <Tab label="Пользователи" />
                    <Tab label="История использований" />
                </Tabs>
            </Box>

            {activeTab === 0 && (
                <PromoCodesAnalyticsTab
                    query={promoCodesQuery}
                    params={promoCodesParams}
                    onParamsChange={setPromoCodesParams}
                    datePreset={promoCodesDatePreset}
                    dateFrom={promoCodesDateFrom}
                    dateTo={promoCodesDateTo}
                    onDatePresetChange={handlePromoCodesDatePresetChange}
                    onDateFromChange={handlePromoCodesDateFromChange}
                    onDateToChange={handlePromoCodesDateToChange}
                />
            )}

            {activeTab === 1 && (
                <UsersAnalyticsTab
                    query={usersQuery}
                    params={usersParams}
                    onParamsChange={setUsersParams}
                    datePreset={usersDatePreset}
                    dateFrom={usersDateFrom}
                    dateTo={usersDateTo}
                    onDatePresetChange={handleUsersDatePresetChange}
                    onDateFromChange={handleUsersDateFromChange}
                    onDateToChange={handleUsersDateToChange}
                />
            )}

            {activeTab === 2 && (
                <HistoryAnalyticsTab
                    query={historyQuery}
                    params={historyParams}
                    onParamsChange={setHistoryParams}
                    datePreset={historyDatePreset}
                    dateFrom={historyDateFrom}
                    dateTo={historyDateTo}
                    onDatePresetChange={handleHistoryDatePresetChange}
                    onDateFromChange={handleHistoryDateFromChange}
                    onDateToChange={handleHistoryDateToChange}
                />
            )}
        </MainLayout>
    );
};

interface PromoCodesAnalyticsTabProps {
    query: ReturnType<typeof usePromoCodesAnalytics>;
    params: AnalyticsGetPromoCodesListParams;
    onParamsChange: (params: AnalyticsGetPromoCodesListParams) => void;
    datePreset: DatePreset;
    dateFrom?: string;
    dateTo?: string;
    onDatePresetChange: (preset: DatePreset) => void;
    onDateFromChange: (date: string) => void;
    onDateToChange: (date: string) => void;
}

const PromoCodesAnalyticsTab = ({
    query,
    params,
    onParamsChange,
    datePreset,
    dateFrom,
    dateTo,
    onDatePresetChange,
    onDateFromChange,
    onDateToChange,
}: PromoCodesAnalyticsTabProps) => {
    const handlePaginationChange: OnChangeFn<MRT_PaginationState> = (updaterOrValue) => {
        const pagination = typeof updaterOrValue === 'function' 
            ? updaterOrValue({ pageIndex: (params.page || 1) - 1, pageSize: params.limit || 10 })
            : updaterOrValue;
        onParamsChange({
            ...params,
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
        });
    };

    const handleSortingChange: OnChangeFn<MRT_SortingState> = (updaterOrValue) => {
        const sorting = typeof updaterOrValue === 'function'
            ? updaterOrValue([])
            : updaterOrValue;
        if (sorting.length > 0) {
            const sort = sorting[0];
            onParamsChange({
                ...params,
                page: 1,
                sortBy: sort.id,
                sortOrder: sort.desc ? 'desc' : 'asc',
            });
        }
    };

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

    const response = query.data;
    const data = isSuccessResponse(response) ? response.data : null;

    if (!data) {
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

            <PromoCodesAnalyticsTable
                data={data.items}
                total={data.total}
                page={data.page}
                limit={data.limit}
                onPaginationChange={handlePaginationChange}
                onSortingChange={handleSortingChange}
                isLoading={query.isLoading}
            />
        </>
    );
};

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

const UsersAnalyticsTab = ({
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
    const handlePaginationChange: OnChangeFn<MRT_PaginationState> = (updaterOrValue) => {
        const pagination = typeof updaterOrValue === 'function' 
            ? updaterOrValue({ pageIndex: (params.page || 1) - 1, pageSize: params.limit || 10 })
            : updaterOrValue;
        onParamsChange({
            ...params,
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
        });
    };

    const handleSortingChange: OnChangeFn<MRT_SortingState> = (updaterOrValue) => {
        const sorting = typeof updaterOrValue === 'function'
            ? updaterOrValue([])
            : updaterOrValue;
        if (sorting.length > 0) {
            const sort = sorting[0];
            onParamsChange({
                ...params,
                page: 1,
                sortBy: sort.id,
                sortOrder: sort.desc ? 'desc' : 'asc',
            });
        }
    };

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

    const response = query.data;
    const data = isSuccessResponse(response) ? response.data : null;

    if (!data) {
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
                data={data.items}
                total={data.total}
                page={data.page}
                limit={data.limit}
                onPaginationChange={handlePaginationChange}
                onSortingChange={handleSortingChange}
                isLoading={query.isLoading}
            />
        </>
    );
};

interface HistoryAnalyticsTabProps {
    query: ReturnType<typeof usePromoCodeUsageHistory>;
    params: AnalyticsGetPromoCodeUsageHistoryParams;
    onParamsChange: (params: AnalyticsGetPromoCodeUsageHistoryParams) => void;
    datePreset: DatePreset;
    dateFrom?: string;
    dateTo?: string;
    onDatePresetChange: (preset: DatePreset) => void;
    onDateFromChange: (date: string) => void;
    onDateToChange: (date: string) => void;
}

const HistoryAnalyticsTab = ({
    query,
    params,
    onParamsChange,
    datePreset,
    dateFrom,
    dateTo,
    onDatePresetChange,
    onDateFromChange,
    onDateToChange,
}: HistoryAnalyticsTabProps) => {
    const handlePaginationChange: OnChangeFn<MRT_PaginationState> = (updaterOrValue) => {
        const pagination = typeof updaterOrValue === 'function' 
            ? updaterOrValue({ pageIndex: (params.page || 1) - 1, pageSize: params.limit || 10 })
            : updaterOrValue;
        onParamsChange({
            ...params,
            page: pagination.pageIndex + 1,
            limit: pagination.pageSize,
        });
    };

    const handleSortingChange: OnChangeFn<MRT_SortingState> = (updaterOrValue) => {
        const sorting = typeof updaterOrValue === 'function'
            ? updaterOrValue([])
            : updaterOrValue;
        if (sorting.length > 0) {
            const sort = sorting[0];
            onParamsChange({
                ...params,
                page: 1,
                sortBy: sort.id,
                sortOrder: sort.desc ? 'desc' : 'asc',
            });
        }
    };

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

    const response = query.data;
    const data = isSuccessResponse(response) ? response.data : null;

    if (!data) {
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

            <PromoCodeUsageHistoryTable
                data={data.items}
                total={data.total}
                page={data.page}
                limit={data.limit}
                onPaginationChange={handlePaginationChange}
                onSortingChange={handleSortingChange}
                isLoading={query.isLoading}
            />
        </>
    );
};
