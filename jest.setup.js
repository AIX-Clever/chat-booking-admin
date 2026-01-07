// Jest setup file
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            pathname: '/',
            query: {},
            asPath: '/',
        }
    },
    usePathname() {
        return '/'
    },
    useSearchParams() {
        return new URLSearchParams()
    },
}))

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key) => key,
    useLocale: () => 'en',
}))

// Suppress console errors during tests (optional)
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
}
