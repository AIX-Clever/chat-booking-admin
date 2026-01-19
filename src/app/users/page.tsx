'use client';

import VpnKeyIcon from '@mui/icons-material/VpnKey'; // Add import
import { LIST_TENANT_USERS, INVITE_USER, UPDATE_USER_ROLE, REMOVE_USER, RESET_USER_PASSWORD } from '../../graphql/user-queries'; // Add RESET_USER_PASSWORD import

// ... (existing code)

const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);

// Reset Password State
const [resetDialogOpen, setResetDialogOpen] = useState(false);
const [userToReset, setUserToReset] = useState<TenantUser | null>(null);
const [resetting, setResetting] = useState(false);

// ... (existing handlers)

const handleResetPassword = async () => {
    if (!userToReset) return;

    try {
        setResetting(true);
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

        await client.graphql({
            query: RESET_USER_PASSWORD,
            variables: { userId: userToReset.userId },
            authToken: token
        });

        // Show success message (using alert for now, ideally Snackbar)
        alert(`Password reset email sent to ${userToReset.email}`);

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

    // ... (render)
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
                                            
                                            <Tooltip title="Reset Password">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setUserToReset(user);
                                                        setResetDialogOpen(true);
                                                    }}
                                                    color="warning"
                                                >
                                                    <VpnKeyIcon fontSize="small" />
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
                                </TableCell >
                            </TableRow >
                        ))}
                    </TableBody >
                </Table >
            </TableContainer >

    {/* Invite User Dialog */ }
{/* ... (existing dialog) */ }

{/* Reset Password Confirmation Dialog */ }
<Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
    <DialogTitle>Reset User Password</DialogTitle>
    <DialogContent>
        <Typography>
            Are you sure you want to reset the password for <strong>{userToReset?.email}</strong>?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will send an email to the user with a code to reset their password.
        </Typography>
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setResetDialogOpen(false)} disabled={resetting}>Cancel</Button>
        <Button
            onClick={handleResetPassword}
            color="warning"
            variant="contained"
            disabled={resetting}
        >
            {resetting ? 'Sending...' : 'Reset Password'}
        </Button>
    </DialogActions>
</Dialog>

{/* Edit Role Dialog */ }

