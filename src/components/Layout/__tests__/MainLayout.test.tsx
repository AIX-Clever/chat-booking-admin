import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainLayout from '../MainLayout';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTenant } from '../../../context/TenantContext';
import { navigateTo } from '../../../utils/navigation';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

// Mock all the things
jest.mock('@aws-amplify/ui-react', () => ({
    useAuthenticator: jest.fn()
}));

jest.mock('aws-amplify/auth', () => ({
    fetchUserAttributes: jest.fn()
}));

jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn().mockReturnValue({
        graphql: jest.fn()
    })
}));

jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
    useRouter: jest.fn()
}));

jest.mock('next-intl', () => ({
    useTranslations: jest.fn().mockReturnValue((key: string) => key)
}));

jest.mock('../../../context/TenantContext', () => ({
    useTenant: jest.fn()
}));

jest.mock('../../../utils/navigation', () => ({
    navigateTo: jest.fn(),
    getCurrentUrl: jest.fn().mockReturnValue('http://localhost/')
}));

// Mock sub-components to reduce noise
jest.mock('../../ThemeSwitcher/ThemeSwitcher', () => ({
    __esModule: true,
    default: () => <div data-testid="theme-switcher">ThemeSwitcher</div>
}));

jest.mock('../../LanguageSelector', () => ({
    __esModule: true,
    default: () => <div data-testid="language-selector">LanguageSelector</div>
}));

jest.mock('../../common/PlanBadge', () => ({
    __esModule: true,
    default: ({ plan }: { plan: string }) => <div data-testid="plan-badge">{plan}</div>
}));

const renderWithTheme = (ui: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {ui}
        </ThemeProvider>
    );
};

describe('MainLayout component', () => {
    const mockSignOut = jest.fn();
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuthenticator as jest.Mock).mockReturnValue({
            authStatus: 'authenticated',
            signOut: mockSignOut
        });
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush
        });
        (usePathname as jest.Mock).mockReturnValue('/dashboard');
        (useTenant as jest.Mock).mockReturnValue({
            tenant: { plan: 'PRO', status: 'ACTIVE' }
        });
    });

    it('should render children when authenticated and active', () => {
        renderWithTheme(
            <MainLayout>
                <div data-testid="children">Content</div>
            </MainLayout>
        );
        expect(screen.getByTestId('children')).toBeInTheDocument();
        expect(screen.getAllByText('dashboard').length).toBeGreaterThan(0);
    });

    it('should redirect to login if unauthenticated', () => {
        (useAuthenticator as jest.Mock).mockReturnValue({
            authStatus: 'unauthenticated',
            signOut: mockSignOut
        });

        renderWithTheme(<MainLayout><div>Content</div></MainLayout>);

        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should show PENDING_PAYMENT screen when status is pending', () => {
        (useTenant as jest.Mock).mockReturnValue({
            tenant: { plan: 'LITE', status: 'PENDING_PAYMENT', tenantId: 't1' }
        });

        renderWithTheme(<MainLayout><div>Content</div></MainLayout>);

        expect(screen.getByText('¡Casi listo! 🚀')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Completar Pago'));
        expect(navigateTo).toHaveBeenCalled();
    });

    it('should call signOut when logging out', () => {
        renderWithTheme(<MainLayout><div>Content</div></MainLayout>);

        // Find logout button (might need to open drawer if closed, but it's open by default in test)
        fireEvent.click(screen.getByText('logout'));
        expect(mockSignOut).toHaveBeenCalled();
    });
});
