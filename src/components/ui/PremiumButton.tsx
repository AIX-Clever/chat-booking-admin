import React from 'react';
import { Button, ButtonProps } from '@mui/material';

interface PremiumButtonProps extends Omit<ButtonProps, 'variant'> {
    variant?: 'primary' | 'ghost' | 'contained' | 'outlined' | 'text';
}

export default function PremiumButton({ children, variant, ...props }: PremiumButtonProps) {
    // Basic implementation that maps 'primary' and 'ghost' to standard MUI variants
    const muiVariant = variant === 'primary' ? 'contained' : (variant === 'ghost' ? 'text' : variant);

    return (
        <Button variant={muiVariant} {...props}>
            {children}
        </Button>
    );
}
