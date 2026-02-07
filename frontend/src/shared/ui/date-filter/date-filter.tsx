import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

export type DatePreset = 'today' | 'last7days' | 'last30days' | 'custom';

export interface DateFilterProps {
    preset: DatePreset;
    dateFrom?: string;
    dateTo?: string;
    onPresetChange: (preset: DatePreset) => void;
    onDateFromChange: (date: string) => void;
    onDateToChange: (date: string) => void;
}

/**
 * Компонент фильтрации по датам с пресетами
 */
export const DateFilter = ({
    preset,
    dateFrom,
    dateTo,
    onPresetChange,
    onDateFromChange,
    onDateToChange,
}: DateFilterProps) => {
    const handlePresetChange = (event: SelectChangeEvent<DatePreset>) => {
        const newPreset = event.target.value as DatePreset;
        onPresetChange(newPreset);

        // Устанавливаем даты в зависимости от пресета
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        if (newPreset === 'today') {
            onDateFromChange(todayStr);
            onDateToChange(todayStr);
        } else if (newPreset === 'last7days') {
            const last7Days = new Date(today);
            last7Days.setDate(today.getDate() - 7);
            onDateFromChange(last7Days.toISOString().split('T')[0]);
            onDateToChange(todayStr);
        } else if (newPreset === 'last30days') {
            const last30Days = new Date(today);
            last30Days.setDate(today.getDate() - 30);
            onDateFromChange(last30Days.toISOString().split('T')[0]);
            onDateToChange(todayStr);
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Период</InputLabel>
                <Select
                    value={preset}
                    label="Период"
                    onChange={handlePresetChange}
                >
                    <MenuItem value="today">Сегодня</MenuItem>
                    <MenuItem value="last7days">Последние 7 дней</MenuItem>
                    <MenuItem value="last30days">Последние 30 дней</MenuItem>
                    <MenuItem value="custom">Произвольный</MenuItem>
                </Select>
            </FormControl>

            {preset === 'custom' && (
                <>
                    <TextField
                        label="С"
                        type="date"
                        value={dateFrom || ''}
                        onChange={(e) => onDateFromChange(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 200 }}
                    />
                    <TextField
                        label="По"
                        type="date"
                        value={dateTo || ''}
                        onChange={(e) => onDateToChange(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 200 }}
                    />
                </>
            )}
        </Box>
    );
};
