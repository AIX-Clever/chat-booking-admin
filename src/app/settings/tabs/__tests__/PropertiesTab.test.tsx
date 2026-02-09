import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PropertiesTab from '../PropertiesTab';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { WidgetConfig } from '../../../../types/settings';

const theme = createTheme();

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock PlanGuard to just render children
jest.mock('@/components/PlanGuard', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock WidgetPreview to avoid complex rendering
jest.mock('../../components/WidgetPreview', () => ({
    __esModule: true,
    default: () => <div data-testid="widget-preview">Widget Preview</div>,
}));

const renderWithTheme = (ui: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {ui}
        </ThemeProvider>
    );
};

describe('PropertiesTab', () => {
    const mockWidgetConfig: WidgetConfig = {
        primaryColor: '#2563eb',
        position: 'bottom-right',
        language: 'es',
        welcomeMessages: {
            es: 'Hola ES',
            en: 'Hello EN',
            pt: 'Olá PT'
        }
    };

    const defaultProps = {
        widgetConfig: mockWidgetConfig,
        setWidgetConfig: jest.fn(),
        slug: 'test-slug',
        setSlug: jest.fn(),
        onSave: jest.fn(),
        logoUrl: 'https://example.com/logo.png'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the slug field and view link', () => {
        renderWithTheme(<PropertiesTab {...defaultProps} />);

        expect(screen.getByLabelText(/profileUrlSlug/)).toHaveValue('test-slug');
        expect(screen.getByText(/viewPage/)).toBeInTheDocument();
    });

    it('should call setSlug with sanitized value when slug changes', () => {
        renderWithTheme(<PropertiesTab {...defaultProps} />);

        const slugInput = screen.getByLabelText(/profileUrlSlug/);
        fireEvent.change(slugInput, { target: { value: 'New Slug 123!' } });

        // Sanitization: lower case, replace spaces with -, remove non-alphanumeric
        expect(defaultProps.setSlug).toHaveBeenCalledWith('new-slug-123');
    });

    it('should change editing language when clicking tabs', () => {
        renderWithTheme(<PropertiesTab {...defaultProps} />);

        // Find the tabs and click English
        const englishTab = screen.getByText('English');
        fireEvent.click(englishTab);

        // Check if the welcome message field now shows the English message
        const welcomeMessageField = screen.getByDisplayValue('Hello EN');
        expect(welcomeMessageField).toBeInTheDocument();
    });

    it('should call setWidgetConfig when welcome message changes', () => {
        renderWithTheme(<PropertiesTab {...defaultProps} />);

        const welcomeMessageField = screen.getByDisplayValue('Hola ES');
        fireEvent.change(welcomeMessageField, { target: { value: 'Nuevo Hola' } });

        expect(defaultProps.setWidgetConfig).toHaveBeenCalledWith({
            ...mockWidgetConfig,
            welcomeMessages: {
                ...mockWidgetConfig.welcomeMessages,
                es: 'Nuevo Hola'
            }
        });
    });

    it('should call setWidgetConfig when primary color preset is clicked', () => {
        renderWithTheme(<PropertiesTab {...defaultProps} />);

        // Default Blue preset
        const bluePreset = screen.getByTitle('Default Blue');
        fireEvent.click(bluePreset);

        expect(defaultProps.setWidgetConfig).toHaveBeenCalledWith({
            ...mockWidgetConfig,
            primaryColor: '#2563eb'
        });
    });

    it('should call navigator.clipboard when copy button is clicked', () => {
        // Mock clipboard
        const mockClipboard = {
            writeText: jest.fn().mockImplementation(() => Promise.resolve()),
        };
        Object.assign(navigator, {
            clipboard: mockClipboard,
        });

        renderWithTheme(<PropertiesTab {...defaultProps} />);

        const copyButton = screen.getByText(/copyLink/);
        fireEvent.click(copyButton);

        expect(mockClipboard.writeText).toHaveBeenCalledWith('https://agendar.holalucia.cl/test-slug');
    });

    it('should call setWidgetConfig when custom color is changed', () => {
        renderWithTheme(<PropertiesTab {...defaultProps} />);

        const colorInput = screen.getByTitle('Custom Color');
        fireEvent.change(colorInput, { target: { value: '#ff0000' } });

        expect(defaultProps.setWidgetConfig).toHaveBeenCalledWith({
            ...mockWidgetConfig,
            primaryColor: '#ff0000'
        });
    });

    it('should call setWidgetConfig when position is changed', () => {
        renderWithTheme(<PropertiesTab {...defaultProps} />);

        // Material UI Select requires finding the element and clicking it
        const positionSelect = screen.getByLabelText(/position/);
        fireEvent.mouseDown(positionSelect);

        const leftOption = screen.getByText(/positions.bottomLeft/);
        fireEvent.click(leftOption);

        expect(defaultProps.setWidgetConfig).toHaveBeenCalledWith({
            ...mockWidgetConfig,
            position: 'bottom-left'
        });
    });

    it('should call setWidgetConfig and update editing language when language is changed', () => {
        renderWithTheme(<PropertiesTab {...defaultProps} />);

        const languageSelect = screen.getByLabelText(/language/);
        fireEvent.mouseDown(languageSelect);

        const englishOption = screen.getByText(/languages.en/);
        fireEvent.click(englishOption);

        expect(defaultProps.setWidgetConfig).toHaveBeenCalledWith({
            ...mockWidgetConfig,
            language: 'en'
        });

        // It should also update the editing language tab (welcome message field should show EN message)
        const welcomeMessageField = screen.getByDisplayValue('Hello EN');
        expect(welcomeMessageField).toBeInTheDocument();
    });

    it('should handle empty slug and welcomeMessages in edge cases', () => {
        const edgeCaseProps = {
            ...defaultProps,
            slug: '',
            widgetConfig: {
                ...mockWidgetConfig,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                welcomeMessages: undefined as any
            }
        };
        renderWithTheme(<PropertiesTab {...edgeCaseProps} />);

        // Slug check in link href
        const viewLink = screen.getByRole('link', { name: /viewPage/ });
        expect(viewLink).toHaveAttribute('href', 'https://agendar.holalucia.cl/tu-slug');

        // Welcome message check (should be empty string if not present)
        const welcomeMessageField = screen.getByPlaceholderText(/Mensaje en ES/);
        expect(welcomeMessageField).toHaveValue('');


        // Should handle change when welcomeMessages is undefined
        fireEvent.change(welcomeMessageField, { target: { value: 'New Message' } });
        expect(defaultProps.setWidgetConfig).toHaveBeenCalled();
    });

    it('should call onSave when save button is clicked', () => {

        renderWithTheme(<PropertiesTab {...defaultProps} />);

        const saveButton = screen.getByText(/saveBranding/);
        fireEvent.click(saveButton);

        expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });
});
