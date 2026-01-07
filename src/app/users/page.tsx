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
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { useTenant } from '../../context/TenantContext';
import { LIST_TENANT_USERS, INVITE_USER, UPDATE_USER_ROLE, REMOVE_USER } from '../../graphql/user-queries';

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

export default function UsersPage() {
    const { tenant, loading: tenantLoading } = useTenant();
    const [users, setUsers] = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<'ADMIN' | 'USER'>('USER');
    const [inviting, setInviting] = useState(false);

    const client = generateClient();

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
            setUsers(typedResponse.data.listTenantUsers || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [client]);

    useEffect(() => {
        if (!tenantLoading) {
            fetchUsers();
        }
    }, [tenantLoading, fetchUsers]);

    const handleInviteUser = async () => {
        if (!inviteEmail) {
            setError('Email is required');
            return;
        }

        // Check plan limits
        const plan = tenant?.plan || 'LITE';
        const maxUsers = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
        const activeUsers = users.filter(u => u.status !== 'INACTIVE').length;

        if (maxUsers !== -1 && activeUsers >= maxUsers) {
            setError(`Your ${plan} plan allows maximum ${maxUsers} user(s). Please upgrade to add more users.`);
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
            setError(error.errors?.[0]?.message || 'Failed to invite user');
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
        if (!confirm('Are you sure you want to remove this user?')) return;

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
                        User Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={1}>
                        Active Users: {activeUsers} / {maxUsers === -1 ? '∞' : maxUsers} ({plan} Plan)
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setInviteDialogOpen(true)}
                    disabled={!canInviteMore}
                >
                    Invite User
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {!canInviteMore && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    You have reached the maximum number of users for your {plan} plan. Upgrade to add more users.
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Email</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align="right">Actions</TableCell>
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
                                            <Tooltip title="Change Role">
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
                <DialogTitle>Invite New User</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Email"
                            type="email"
                            fullWidth
                            required
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <TextField
                            label="Name (optional)"
                            fullWidth
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={inviteRole}
                                label="Role"
                                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'USER')}
                            >
                                <MenuItem value="USER">User (Read-only)</MenuItem>
                                <MenuItem value="ADMIN">Admin (Can manage data)</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleInviteUser}
                        variant="contained"
                        disabled={inviting || !inviteEmail}
                    >
                        {inviting ? 'Inviting...' : 'Send Invitation'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Role Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Change User Role</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="body2" mb={2}>
                            User: {selectedUser?.email}
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel>New Role</InputLabel>
                            <Select
                                value={selectedUser?.role || 'USER'}
                                label="New Role"
                                onChange={(e) => setSelectedUser(prev => prev ? { ...prev, role: e.target.value as 'OWNER' | 'ADMIN' | 'USER' } : null)}
                            >
                                <MenuItem value="USER">User (Read-only)</MenuItem>
                                <MenuItem value="ADMIN">Admin (Can manage data)</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => selectedUser && handleUpdateRole(selectedUser.userId, selectedUser.role)}
                        variant="contained"
                    >
                        Update Role
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
