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
import { Pagination } from '@shared/ui';

/**
 * Страница аналитики
 */
export const AnalyticsPage = () => {
    const [activeTab, setActiveTab] = useState(0);

    const [promoCodesParams, setPromoCodesParams] = useState<AnalyticsGetPromoCodesListParams>({
        page: 1,
        limit: 10,
    });

    const [usersParams, setUsersParams] = useState<AnalyticsGetUsersListParams>({
        page: 1,
        limit: 10,
    });

    const [historyParams, setHistoryParams] = useState<AnalyticsGetPromoCodeUsageHistoryParams>({
        page: 1,
        limit: 10,
    });

    const promoCodesQuery = usePromoCodesAnalytics(promoCodesParams);
    const usersQuery = useUsersAnalytics(usersParams);
    const historyQuery = usePromoCodeUsageHistory(historyParams);

    const handleTabChange = (_: unknown, newValue: number) => {
        setActiveTab(newValue);
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
                <AnalyticsTab
                    query={promoCodesQuery}
                    params={promoCodesParams}
                    onParamsChange={setPromoCodesParams}
                    title="Аналитика промокодов"
                />
            )}

            {activeTab === 1 && (
                <AnalyticsTab
                    query={usersQuery}
                    params={usersParams}
                    onParamsChange={setUsersParams}
                    title="Аналитика пользователей"
                />
            )}

            {activeTab === 2 && (
                <AnalyticsTab
                    query={historyQuery}
                    params={historyParams}
                    onParamsChange={setHistoryParams}
                    title="История использований промокодов"
                />
            )}
        </MainLayout>
    );
};

interface AnalyticsTabProps {
    query: ReturnType<typeof usePromoCodesAnalytics> | ReturnType<typeof useUsersAnalytics> | ReturnType<typeof usePromoCodeUsageHistory>;
    params: AnalyticsGetPromoCodesListParams | AnalyticsGetUsersListParams | AnalyticsGetPromoCodeUsageHistoryParams;
    onParamsChange: (params: AnalyticsGetPromoCodesListParams | AnalyticsGetUsersListParams | AnalyticsGetPromoCodeUsageHistoryParams) => void;
    title: string;
}

const AnalyticsTab = ({ query, params, onParamsChange, title }: AnalyticsTabProps) => {
    const handlePageChange = (page: number) => {
        onParamsChange({ ...params, page });
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
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Всего: {data.total} | Страница {data.page} из {data.totalPages}
                </Typography>
            </Box>

            {/* Таблица данных будет здесь */}

            {data.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        page={data.page}
                        totalPages={data.totalPages}
                        onPageChange={handlePageChange}
                        disabled={query.isLoading}
                    />
                </Box>
            )}
        </>
    );
};
