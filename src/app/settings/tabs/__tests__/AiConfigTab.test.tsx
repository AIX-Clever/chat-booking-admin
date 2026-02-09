
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AiConfigTab from '../AiConfigTab';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock PlanGuard to just render children
jest.mock('@/components/PlanGuard', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="plan-guard">{children}</div>,
}));

const renderWithTheme = (ui: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {ui}
        </ThemeProvider>
    );
};

describe('AiConfigTab', () => {
    const defaultProps = {
        aiMode: 'fsm',
        setAiMode: jest.fn(),
        ragEnabled: false,
        setRagEnabled: jest.fn(),
        currentPlan: 'BUSINESS',
        onUpgradeClick: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render all intelligence modes', () => {
        renderWithTheme(<AiConfigTab {...defaultProps} />);

        expect(screen.getByText('modes.fsm.name')).toBeInTheDocument();
        expect(screen.getByText('modes.nlp.name')).toBeInTheDocument();
        expect(screen.getByText('modes.agent.name')).toBeInTheDocument();
    });

    it('should call setAiMode when a sufficient plan mode is clicked', () => {
        renderWithTheme(<AiConfigTab {...defaultProps} />);

        // BUSINESS plan can select NLP
        const nlpCard = screen.getByText('modes.nlp.name').closest('.MuiCard-root');
        fireEvent.click(nlpCard!);

        expect(defaultProps.setAiMode).toHaveBeenCalledWith('nlp');
    });

    it('should call onUpgradeClick when an insufficient plan mode is clicked', () => {
        const proProps = { ...defaultProps, currentPlan: 'PRO' };
        renderWithTheme(<AiConfigTab {...proProps} />);

        // PRO plan cannot select NLP (requires BUSINESS)
        const nlpCard = screen.getByText('modes.nlp.name').closest('.MuiCard-root');
        fireEvent.click(nlpCard!);

        expect(defaultProps.onUpgradeClick).toHaveBeenCalled();
        expect(defaultProps.setAiMode).not.toHaveBeenCalled();
    });

    it('should show lock icon and upgrade message for locked modes', () => {
        const liteProps = { ...defaultProps, currentPlan: 'LITE' };
        renderWithTheme(<AiConfigTab {...liteProps} />);

        // BUSINESS mode (NLP) should be locked for LITE
        expect(screen.getAllByText('requiresUpgrade').length).toBeGreaterThan(0);
    });

    it('should toggle RAG when switch is clicked', () => {
        // Change mode to NLP to enable RAG switch (it's disabled for FSM)
        renderWithTheme(<AiConfigTab {...defaultProps} aiMode="nlp" />);

        const ragSwitch = screen.getByRole('checkbox');
        fireEvent.click(ragSwitch);

        expect(defaultProps.setRagEnabled).toHaveBeenCalledWith(true);
    });

    it('should disable RAG switch when mode is FSM', () => {
        renderWithTheme(<AiConfigTab {...defaultProps} aiMode="fsm" />);

        const ragSwitch = screen.getByRole('checkbox');
        expect(ragSwitch).toBeDisabled();

        // Should show warning alert
        expect(screen.getByText('ragRequirement')).toBeInTheDocument();
    });

    it('should handle edge case where currentPlan is unknown', () => {
        renderWithTheme(<AiConfigTab {...defaultProps} currentPlan="UNKNOWN" />);

        // Should default to lowest level (0) which locks all modes except LITE/FSM
        const fsmCard = screen.getByText('modes.fsm.name').closest('.MuiCard-root');
        fireEvent.click(fsmCard!);

        // FSM requires LITE, UNKNOWN level 0 is not enough if LITE is 1
        // But PLAN_LEVELS['LITE'] is 1.
        expect(defaultProps.onUpgradeClick).toHaveBeenCalled();
    });
});
