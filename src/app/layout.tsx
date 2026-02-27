import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import MainLayout from '../components/Layout/MainLayout';
import ThemeRegistry from '../components/ThemeRegistry/ThemeRegistry';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Hola Lucia - Panel de Control',
    description: 'Administra tus servicios, profesionales y reservas con la eficiencia de la IA.',
};

import AmplifyProvider from '../components/AmplifyProvider';
import { TenantProvider } from '../context/TenantContext';
import LocaleProvider from '../providers/LocaleProvider';
import { ToastProvider } from '../components/common/ToastContext';
import Script from 'next/script';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    return (
        <html lang="es">
            <body className={inter.className}>
                {recaptchaKey && (
                    <Script
                        src={`https://www.google.com/recaptcha/api.js?render=${recaptchaKey}`}
                        strategy="beforeInteractive"
                    />
                )}
                <AmplifyProvider>
                    <TenantProvider>
                        <LocaleProvider>
                            <ThemeRegistry>
                                <ToastProvider>
                                    <MainLayout>{children}</MainLayout>
                                </ToastProvider>
                            </ThemeRegistry>
                        </LocaleProvider>
                    </TenantProvider>
                </AmplifyProvider>
            </body>
        </html>
    );
}

