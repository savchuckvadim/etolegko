import { memo, useMemo } from 'react';
import { Typography, Box, Tabs, Tab } from '@mui/material';
import { MainLayout } from '@widgets/layout/main-layout';
import { useAnalyticsPage } from '@features/analytics';
import { PromoCodesAnalyticsTab, UsersAnalyticsTab, HistoryAnalyticsTab } from '@widgets/analytics';

/**
 * Страница аналитики
 */
export const AnalyticsPage = memo(() => {
    const {
        activeTab,
        promoCodesDatePreset,
        promoCodesDateFrom,
        promoCodesDateTo,
        promoCodesParams,
        usersDatePreset,
        usersDateFrom,
        usersDateTo,
        usersParams,
        historyDatePreset,
        historyDateFrom,
        historyDateTo,
        historyParams,
        promoCodesQuery,
        usersQuery,
        historyQuery,
        handleTabChange,
        setPromoCodesParams,
        setUsersParams,
        setHistoryParams,
        handlePromoCodesDatePresetChange,
        handlePromoCodesDateFromChange,
        handlePromoCodesDateToChange,
        handleUsersDatePresetChange,
        handleUsersDateFromChange,
        handleUsersDateToChange,
        handleHistoryDatePresetChange,
        handleHistoryDateFromChange,
        handleHistoryDateToChange,
    } = useAnalyticsPage();

    const tabs = useMemo(
        () => [
            { label: 'Промокоды' },
            { label: 'Пользователи' },
            { label: 'История использований' },
        ],
        [],
    );

    return (
        <MainLayout>
            <Typography variant="h4" gutterBottom>
                Аналитика
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab.label} />
                    ))}
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
});

AnalyticsPage.displayName = 'AnalyticsPage';
