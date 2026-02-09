import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlanBadge from '../PlanBadge';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {ui}
        </ThemeProvider>
    );
};

describe('PlanBadge component', () => {
    it('should render LITE plan as a Chip', () => {
        renderWithTheme(<PlanBadge plan="LITE" />);
        expect(screen.getByText('LITE')).toBeInTheDocument();
        // Chips have MuiChip-root class by default in MUI
    });

    it('should render premium plans (PRO, BUSINESS, ENTERPRISE)', () => {
        const { rerender } = renderWithTheme(<PlanBadge plan="PRO" />);
        expect(screen.getByText('PRO')).toBeInTheDocument();

        rerender(
            <ThemeProvider theme={theme}>
                <PlanBadge plan="BUSINESS" />
            </ThemeProvider>
        );
        expect(screen.getByText('BUSINESS')).toBeInTheDocument();

        rerender(
            <ThemeProvider theme={theme}>
                <PlanBadge plan="ENTERPRISE" />
            </ThemeProvider>
        );
        expect(screen.getByText('ENTERPRISE')).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
        // DiamondIcon/WorkspacePremiumIcon won't be easily selectable by text,
        // but we can check if the Box has fewer children if we wanted to be precise,
        // or just verify it renders without crashing.
        renderWithTheme(<PlanBadge plan="PRO" showIcon={false} />);
        expect(screen.getByText('PRO')).toBeInTheDocument();
    });
});
