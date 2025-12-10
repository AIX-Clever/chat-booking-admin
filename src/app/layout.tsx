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

// ...

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AmplifyProvider>
                    <ThemeRegistry>
                        <MainLayout>{children}</MainLayout>
                    </ThemeRegistry>
                </AmplifyProvider>
            </body>
        </html>
    );
}
