import { useState, useCallback, useMemo } from 'react';
import type {
    AnalyticsGetPromoCodesListParams,
    AnalyticsGetUsersListParams,
    AnalyticsGetPromoCodeUsageHistoryParams,
} from '@entities/analytics';
import type { DatePreset } from '@shared/ui';
import {
    usePromoCodesAnalytics,
    useUsersAnalytics,
    usePromoCodeUsageHistory,
} from './use-analytics';

/**
 * Хук для управления состоянием страницы аналитики
 */
export const useAnalyticsPage = () => {
    // Инициализация дат для всех вкладок
    const getInitialDates = useCallback(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        return {
            from: last30Days.toISOString().split('T')[0],
            to: todayStr,
        };
    }, []);

    const initialDates = useMemo(() => getInitialDates(), [getInitialDates]);

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

    // Активная вкладка
    const [activeTab, setActiveTab] = useState(0);

    // Запросы данных
    const promoCodesQuery = usePromoCodesAnalytics(promoCodesParams);
    const usersQuery = useUsersAnalytics(usersParams);
    const historyQuery = usePromoCodeUsageHistory(historyParams);

    // Обработчик смены вкладки
    const handleTabChange = useCallback((_: unknown, newValue: number) => {
        setActiveTab(newValue);
    }, []);

    // Вспомогательная функция для вычисления дат по пресету
    const calculateDatesForPreset = useCallback((preset: DatePreset) => {
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

        return { dateFrom, dateTo };
    }, []);

    // Обработчики для промокодов
    const handlePromoCodesDatePresetChange = useCallback((preset: DatePreset) => {
        setPromoCodesDatePreset(preset);
        const { dateFrom, dateTo } = calculateDatesForPreset(preset);
        setPromoCodesDateFrom(dateFrom);
        setPromoCodesDateTo(dateTo);
        setPromoCodesParams((prev) => ({
            ...prev,
            page: 1,
            datePreset: preset,
            dateFrom: preset === 'custom' ? promoCodesDateFrom : dateFrom,
            dateTo: preset === 'custom' ? promoCodesDateTo : dateTo,
        }));
    }, [calculateDatesForPreset, promoCodesDateFrom, promoCodesDateTo]);

    const handlePromoCodesDateFromChange = useCallback((date: string) => {
        setPromoCodesDateFrom(date);
        setPromoCodesParams((prev) => ({
            ...prev,
            page: 1,
            dateFrom: date,
        }));
    }, []);

    const handlePromoCodesDateToChange = useCallback((date: string) => {
        setPromoCodesDateTo(date);
        setPromoCodesParams((prev) => ({
            ...prev,
            page: 1,
            dateTo: date,
        }));
    }, []);

    // Обработчики для пользователей
    const handleUsersDatePresetChange = useCallback((preset: DatePreset) => {
        setUsersDatePreset(preset);
        const { dateFrom, dateTo } = calculateDatesForPreset(preset);
        setUsersDateFrom(dateFrom);
        setUsersDateTo(dateTo);
        setUsersParams((prev) => ({
            ...prev,
            page: 1,
            datePreset: preset,
            dateFrom: preset === 'custom' ? usersDateFrom : dateFrom,
            dateTo: preset === 'custom' ? usersDateTo : dateTo,
        }));
    }, [calculateDatesForPreset, usersDateFrom, usersDateTo]);

    const handleUsersDateFromChange = useCallback((date: string) => {
        setUsersDateFrom(date);
        setUsersParams((prev) => ({
            ...prev,
            page: 1,
            dateFrom: date,
        }));
    }, []);

    const handleUsersDateToChange = useCallback((date: string) => {
        setUsersDateTo(date);
        setUsersParams((prev) => ({
            ...prev,
            page: 1,
            dateTo: date,
        }));
    }, []);

    // Обработчики для истории
    const handleHistoryDatePresetChange = useCallback((preset: DatePreset) => {
        setHistoryDatePreset(preset);
        const { dateFrom, dateTo } = calculateDatesForPreset(preset);
        setHistoryDateFrom(dateFrom);
        setHistoryDateTo(dateTo);
        setHistoryParams((prev) => ({
            ...prev,
            page: 1,
            datePreset: preset,
            dateFrom: preset === 'custom' ? historyDateFrom : dateFrom,
            dateTo: preset === 'custom' ? historyDateTo : dateTo,
        }));
    }, [calculateDatesForPreset, historyDateFrom, historyDateTo]);

    const handleHistoryDateFromChange = useCallback((date: string) => {
        setHistoryDateFrom(date);
        setHistoryParams((prev) => ({
            ...prev,
            page: 1,
            dateFrom: date,
        }));
    }, []);

    const handleHistoryDateToChange = useCallback((date: string) => {
        setHistoryDateTo(date);
        setHistoryParams((prev) => ({
            ...prev,
            page: 1,
            dateTo: date,
        }));
    }, []);

    return {
        // Состояние
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
        // Запросы
        promoCodesQuery,
        usersQuery,
        historyQuery,
        // Обработчики
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
    };
};
