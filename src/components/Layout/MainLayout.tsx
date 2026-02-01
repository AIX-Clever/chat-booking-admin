'use client';

import * as React from 'react';
import { styled, useTheme, Theme, CSSObject, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import PeopleIcon from '@mui/icons-material/People';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ChatIcon from '@mui/icons-material/Chat';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import LanguageSelector from '../LanguageSelector';

import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    backdropFilter: 'blur(6px)',
    backgroundColor: alpha(theme.palette.background.default, 0.8),
    borderBottom: `1px dashed ${alpha(theme.palette.divider, 0.2)}`, // Minimal separator
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    color: theme.palette.text.primary,
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': {
                ...openedMixin(theme),
                borderRight: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
                backgroundColor: alpha(theme.palette.background.paper, 0.9), // Slightly different bg to distinguish, but kept minimal
            }
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': {
                ...closedMixin(theme),
                borderRight: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
            }
        }),
    }),
);

import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
const GET_TENANT_NAME = `
  query GetTenant($tenantId: ID) {
    getTenant(tenantId: $tenantId) {
      tenantId
      name
    }
  }
`;

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const theme = useTheme();
    const t = useTranslations('nav');
    const [open, setOpen] = React.useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const { authStatus, signOut } = useAuthenticator();
    const [tenantName, setTenantName] = React.useState<string>('');

    React.useEffect(() => {
        if (authStatus === 'unauthenticated' && pathname !== '/login') {
            router.push('/login');
        }
    }, [authStatus, pathname, router]);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    const handleLogout = () => {
        signOut();
    };

    React.useEffect(() => {
        async function checkTenantAuthorization() {
            if (authStatus === 'authenticated') {
                try {
                    const attributes = await fetchUserAttributes();
                    const tenantId = attributes['custom:tenantId'];

                    if (!tenantId) {
                        console.warn('User has no tenant association. Signing out.');
                        signOut();
                        router.push('/login?error=no_tenant');
                        return;
                    }

                    // Fetch tenant details to get name
                    try {
                        const client = generateClient();
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const response: any = await client.graphql({
                            query: GET_TENANT_NAME,
                            variables: { tenantId }
                        });

                        if (response.data && response.data.getTenant) {
                            setTenantName(response.data.getTenant.name);
                        }
                    } catch (err) {
                        console.error('Error fetching tenant details:', err);
                    }

                } catch (error) {
                    console.error('Error verifying tenant authorization:', error);
                }
            }
        }

        checkTenantAuthorization();
    }, [authStatus, signOut, router]);

    const operationsItems = [
        { text: t('dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
        { text: t('bookings'), icon: <CalendarMonthIcon />, path: '/bookings' },
        { text: t('availability'), icon: <EditCalendarIcon />, path: '/availability' },
    ];

    const aiConfigItems = [
        { text: t('workflows'), icon: <AccountTreeIcon />, path: '/workflows' },
        { text: t('knowledge'), icon: <MenuBookIcon />, path: '/knowledge' },
        { text: t('faqs'), icon: <QuizIcon />, path: '/faqs' },
    ];

    const widgetItems = [
        { text: t('chatWidget'), icon: <ChatIcon />, path: '/widgets/chat' },
    ];

    const resourcesItems = [
        { text: t('services'), icon: <DesignServicesIcon />, path: '/services' },
        { text: t('providers'), icon: <PeopleIcon />, path: '/providers' },
        { text: t('rooms'), icon: <MeetingRoomIcon />, path: '/rooms' },
    ];

    const systemItems = [
        { text: t('users'), icon: <ManageAccountsIcon />, path: '/users' },
        { text: t('settings'), icon: <SettingsIcon />, path: '/settings' },
    ];

    const allMenuItems = [...operationsItems, ...aiConfigItems, ...widgetItems, ...resourcesItems, ...systemItems];

    if (pathname === '/login') {
        return (
            <>
                <CssBaseline />
                {children}
            </>
        );
    }

    const renderMenuItems = (items: { text: string, icon: React.ReactNode, path: string }[]) => (
        items.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                    component={Link}
                    href={item.path}
                    selected={pathname.startsWith(item.path)}
                    sx={{
                        minHeight: 48,
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 0,
                            mr: open ? 3 : 'auto',
                            justifyContent: 'center',
                        }}
                    >
                        {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                </ListItemButton>
            </ListItem>
        ))
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" open={open}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        edge="start"
                        sx={{
                            marginRight: 5,
                            ...(open && { display: 'none' }),
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" noWrap component="div">
                            {allMenuItems.find(item => pathname.startsWith(item.path))?.text || 'Dashboard'}
                        </Typography>
                        {tenantName && (
                            <Typography variant="subtitle1" component="div" sx={{
                                opacity: 0.7,
                                borderLeft: '1px solid rgba(255,255,255,0.3)',
                                pl: 2,
                                fontWeight: 'medium'
                            }}>
                                {tenantName}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <ThemeSwitcher />
                        <LanguageSelector />
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer variant="permanent" open={open}>
                <DrawerHeader>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, ml: 2, opacity: open ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: 'bold' }}>
                        Hola Lucia
                    </Typography>
                    <IconButton onClick={handleDrawerClose}>
                        {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                    </IconButton>
                </DrawerHeader>
                <Divider />
                <List>
                    {renderMenuItems(operationsItems)}
                </List>
                <Divider />
                <List>
                    {renderMenuItems(aiConfigItems)}
                </List>
                <Divider />
                <List>{renderMenuItems(widgetItems)}</List>
                <Divider />
                <List>
                    {renderMenuItems(resourcesItems)}
                </List>
                <Divider />
                <List>
                    {renderMenuItems(systemItems)}
                </List>
                <Divider sx={{ mt: 'auto' }} />
                {/* Version Number */}
                <Box sx={{ px: 2.5, py: 1.5, opacity: open ? 0.6 : 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        v1.2.1
                    </Typography>
                </Box>
                <List>
                    <ListItem disablePadding sx={{ display: 'block' }}>
                        <ListItemButton
                            onClick={handleLogout}
                            sx={{
                                minHeight: 48,
                                justifyContent: open ? 'initial' : 'center',
                                px: 2.5,
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? 3 : 'auto',
                                    justifyContent: 'center',
                                    color: theme.palette.error.main
                                }}
                            >
                                <ExitToAppIcon />
                            </ListItemIcon>
                            <ListItemText
                                primary={t('logout')}
                                sx={{
                                    opacity: open ? 1 : 0,
                                    color: theme.palette.error.main
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <DrawerHeader />
                {children}
            </Box>
        </Box>
    );
}
