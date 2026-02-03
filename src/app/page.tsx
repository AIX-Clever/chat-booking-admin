'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';

export default function Home() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only redirect if we are actually at the root path,
        // preventing SPA fallbacks (like /services) from breaking.
        if (pathname === '/') {
            router.push('/bookings');
        }
    }, [pathname, router]);

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
}

