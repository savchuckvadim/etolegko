import { Card as MuiCard, CardContent, CardActions, CardHeader } from '@mui/material';
import type { ReactNode } from 'react';

export interface CardProps {
    title?: string;
    children: ReactNode;
    actions?: ReactNode;
    variant?: 'elevation' | 'outlined';
}

/**
 * Универсальный компонент карточки
 */
export const Card = ({
    title,
    children,
    actions,
    variant = 'elevation',
}: CardProps) => {
    return (
        <MuiCard variant={variant}>
            {title && <CardHeader title={title} />}
            <CardContent>{children}</CardContent>
            {actions && <CardActions>{actions}</CardActions>}
        </MuiCard>
    );
};
