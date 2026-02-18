'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    Tooltip
} from '@mui/material';
import { useTranslations } from 'next-intl';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useTenant } from '../../context/TenantContext';
import { LIST_TENANT_USERS, INVITE_USER, UPDATE_USER_ROLE, REMOVE_USER, RESET_USER_PASSWORD, RESEND_INVITATION } from '../../graphql/user-queries';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import UpgradeModal from '../../components/common/UpgradeModal';

interface TenantUser {
    userId: string;
    email: string;
    name?: string;
    role: 'OWNER' | 'ADMIN' | 'USER';
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING_INVITATION';
    createdAt: string;
    lastLogin?: string;
}

const PLAN_LIMITS = {
    LITE: 1,
    PRO: 5,
    BUSINESS: 20,
    ENTERPRISE: -1 // Unlimited
};

const client = generateClient();

export default function UsersPage() {
    const t = useTranslations('users');
    const tCommon = useTranslations('common');
    const { tenant, loading: tenantLoading } = useTenant();
    console.log('[UsersPage] Initial render - tenant:', tenant, 'tenantLoading:', tenantLoading);
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    // Reset Password State
    const [resetDialogOpen, setResetDialogOpen] = useState(false);
    const [userToReset, setUserToReset] = useState<TenantUser | null>(null);
    const [resetting, setResetting] = useState(false);

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<'ADMIN' | 'USER'>('USER');
    const [inviting, setInviting] = useState(false);

    const fetchUsers = React.useCallback(async () => {
        try {
            setLoading(true);
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const response: unknown = await client.graphql({
                query: LIST_TENANT_USERS,
                authToken: token
            });

            const typedResponse = response as { data: { listTenantUsers: TenantUser[] } };
            console.log('[UsersPage] LIST_TENANT_USERS response:', typedResponse);
            setUsers(typedResponse.data.listTenantUsers || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(t('messages.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        console.log('[UsersPage] useEffect triggered - tenantLoading:', tenantLoading);
        if (!tenantLoading) {
            console.log('[UsersPage] Calling fetchUsers()...');
            fetchUsers();
        }
    }, [tenantLoading, fetchUsers]);

    const handleInviteUser = async () => {
        if (!inviteEmail) {
            setError(t('messages.emailRequired'));
            return;
        }

        // Check plan limits
        const plan = tenant?.plan || 'LITE';
        const maxUsers = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
        const activeUsers = users.filter(u => u.status !== 'INACTIVE').length;

        if (maxUsers !== -1 && activeUsers >= maxUsers) {
            setError(t('messages.planLimitError', { plan, max: maxUsers }));
            return;
        }

        try {
            setInviting(true);
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            await client.graphql({
                query: INVITE_USER,
                variables: {
                    input: {
                        email: inviteEmail,
                        name: inviteName || undefined,
                        role: inviteRole
                    }
                },
                authToken: token
            });

            setInviteDialogOpen(false);
            setInviteEmail('');
            setInviteName('');
            setInviteRole('USER');
            fetchUsers();
        } catch (err: unknown) {
            console.error('Error inviting user:', err);
            const error = err as { errors?: Array<{ message: string }> };
            setError(error.errors?.[0]?.message || t('dialogs.inviteError') || 'Failed to invite user');
        } finally {
            setInviting(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            await client.graphql({
                query: UPDATE_USER_ROLE,
                variables: {
                    input: {
                        userId,
                        role: newRole
                    }
                },
                authToken: token
            });

            fetchUsers();
            setEditDialogOpen(false);
            setSelectedUser(null);
        } catch (err: unknown) {
            console.error('Error updating role:', err);
            const error = err as { errors?: Array<{ message: string }> };
            setError(error.errors?.[0]?.message || 'Failed to update role');
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!confirm(t('dialogs.removeUserConfirm'))) return;

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            await client.graphql({
                query: REMOVE_USER,
                variables: { userId },
                authToken: token
            });

            fetchUsers();
        } catch (err: unknown) {
            console.error('Error removing user:', err);
            const error = err as { errors?: Array<{ message: string }> };
            setError(error.errors?.[0]?.message || 'Failed to remove user');
        }
    };

    const handleResetPassword = async () => {
        if (!userToReset) return;

        try {
            setResetting(true);
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const isPending = userToReset.status === 'PENDING_INVITATION';

            await client.graphql({
                query: isPending ? RESEND_INVITATION : RESET_USER_PASSWORD,
                variables: { userId: userToReset.userId },
                authToken: token
            });

            // Show success message
            const message = isPending ? t('messages.invitationResent', { email: userToReset.email }) : t('messages.passwordResetSent', { email: userToReset.email });
            alert(message);

            setResetDialogOpen(false);
            setUserToReset(null);
        } catch (err: unknown) {
            console.error('Error resetting password:', err);
            const error = err as { errors?: Array<{ message: string }> };
            setError(error.errors?.[0]?.message || 'Failed to reset password');
        } finally {
            setResetting(false);
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'OWNER': return 'error';
            case 'ADMIN': return 'warning';
            case 'USER': return 'default';
            default: return 'default';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'success';
            case 'PENDING_INVITATION': return 'warning';
            case 'INACTIVE': return 'default';
            default: return 'default';
        }
    };

    const plan = tenant?.plan || 'LITE';
    const maxUsers = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
    const activeUsers = users.filter(u => u.status !== 'INACTIVE').length;
    console.log('[UsersPage] Plan calculation - plan:', plan, 'maxUsers:', maxUsers, 'activeUsers:', activeUsers);
    const canInviteMore = maxUsers === -1 || activeUsers < maxUsers;

    if (tenantLoading || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <div>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {t('title')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                        {t('activeUsers', { current: activeUsers, max: maxUsers === -1 ? '∞' : maxUsers, plan })}
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => {
                        if (canInviteMore) {
                            setInviteDialogOpen(true);
                        } else {
                            setUpgradeModalOpen(true);
                        }
                    }}
                // Removed disabled so it's clickable for upgrade
                >
                    {t('inviteUser')}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {!canInviteMore && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {t('planLimitReached', { plan })}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('table.email')}</TableCell>
                            <TableCell>{t('table.name')}</TableCell>
                            <TableCell>{t('table.role')}</TableCell>
                            <TableCell>{t('table.status')}</TableCell>
                            <TableCell>{t('table.created')}</TableCell>
                            <TableCell align="right">{t('table.actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.userId}>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.name || '-'}</TableCell>
                                <TableCell>
                                    <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                                </TableCell>
                                <TableCell>
                                    <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
                                </TableCell>
                                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell align="right">
                                    {user.role !== 'OWNER' && (
                                        <>
                                            <Tooltip title={tCommon('edit')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setEditDialogOpen(true);
                                                    }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={user.status === 'PENDING_INVITATION' ? t('dialogs.resendInvitation') : (user.status === 'INACTIVE' ? t('dialogs.userInactive') : t('dialogs.resetPassword'))}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setUserToReset(user);
                                                        setResetDialogOpen(true);
                                                    }}
                                                    color={user.status === 'PENDING_INVITATION' ? "primary" : "warning"}
                                                    disabled={user.status === 'INACTIVE'}
                                                >
                                                    {user.status === 'PENDING_INVITATION' ? <PersonAddIcon fontSize="small" /> : <VpnKeyIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Remove User">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveUser(user.userId)}
                                                    color="error"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Invite User Dialog */}
            <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{t('dialogs.inviteTitle')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label={t('form.email')}
                            type="email"
                            fullWidth
                            required
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <TextField
                            label={t('form.name')}
                            fullWidth
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                        />
                        <FormControl fullWidth>
                            <InputLabel>{t('form.role')}</InputLabel>
                            <Select
                                value={inviteRole}
                                label={t('form.role')}
                                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'USER')}
                            >
                                <MenuItem value="USER">{t('form.roleUser')}</MenuItem>
                                <MenuItem value="ADMIN">{t('form.roleAdmin')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteDialogOpen(false)}>{tCommon('cancel')}</Button>
                    <Button
                        onClick={handleInviteUser}
                        variant="contained"
                        disabled={inviting || !inviteEmail}
                    >
                        {inviting ? t('dialogs.inviting') : t('dialogs.sendInvitation')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{t('dialogs.editRoleTitle')}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="body2" mb={2}>
                            {t('form.userLabel', { email: selectedUser?.email })}
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel>{t('form.newRole')}</InputLabel>
                            <Select
                                value={selectedUser?.role || 'USER'}
                                label={t('form.newRole')}
                                onChange={(e) => setSelectedUser(prev => prev ? { ...prev, role: e.target.value as 'OWNER' | 'ADMIN' | 'USER' } : null)}
                            >
                                <MenuItem value="USER">{t('form.roleUser')}</MenuItem>
                                <MenuItem value="ADMIN">{t('form.roleAdmin')}</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>{tCommon('cancel')}</Button>
                    <Button
                        onClick={() => selectedUser && handleUpdateRole(selectedUser.userId, selectedUser.role)}
                        variant="contained"
                    >
                        {t('dialogs.updateRole')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reset Password Confirmation Dialog */}
            <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
                <DialogTitle>{userToReset?.status === 'PENDING_INVITATION' ? t('dialogs.resendInvitationTitle') : t('dialogs.resetPasswordTitle')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {userToReset?.status === 'PENDING_INVITATION'
                            ? t('dialogs.resendInvitationConfirm', { email: userToReset?.email })
                            : t('dialogs.resetPasswordConfirm', { email: userToReset?.email })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {userToReset?.status === 'PENDING_INVITATION'
                            ? t('dialogs.resendInvitationInfo')
                            : t('dialogs.resetPasswordInfo')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetDialogOpen(false)} disabled={resetting}>{tCommon('cancel')}</Button>
                    <Button
                        onClick={handleResetPassword}
                        color={userToReset?.status === 'PENDING_INVITATION' ? "primary" : "warning"}
                        variant="contained"
                        disabled={resetting}
                    >
                        {resetting ? t('dialogs.sending') : (userToReset?.status === 'PENDING_INVITATION' ? t('dialogs.resendInvitation') : t('dialogs.resetPassword'))}
                    </Button>
                </DialogActions>
            </Dialog>

            <UpgradeModal
                open={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                feature="TEAM"
                currentPlan={plan}
            />
        </Box>
    );
}
