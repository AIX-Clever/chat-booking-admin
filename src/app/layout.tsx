import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import MainLayout from '../components/Layout/MainLayout';
import ThemeRegistry from '../components/ThemeRegistry/ThemeRegistry';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Chat Booking Admin',
    description: 'Admin panel for Chat Booking SaaS',
};

import AmplifyProvider from '../components/AmplifyProvider';
import { TenantProvider } from '../context/TenantContext';
import LocaleProvider from '../providers/LocaleProvider';
import { ToastProvider } from '../components/common/ToastContext';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
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

