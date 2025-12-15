
import * as React from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Mock Data
const MOCK_KEYS = [
    { id: '1', name: 'Web Principal', prefix: 'sk_live_83...', status: 'active', created: '2024-01-15' },
    { id: '2', name: 'App Móvil Dev', prefix: 'sk_test_92...', status: 'revoked', created: '2023-11-20' }
];

interface ApiKeysTabProps {
    hasMounted: boolean;
}

export default function ApiKeysTab({ hasMounted }: ApiKeysTabProps) {
    const [apiKeys, setApiKeys] = React.useState(MOCK_KEYS);
    const [createKeyOpen, setCreateKeyOpen] = React.useState(false);
    const [newKeyName, setNewKeyName] = React.useState('');
    // Currently internal state as logic is mocked

    // Deletion state
    // For now simplistic alert instead of dialog to keep it clean, or just console log as it's mock

    const handleCreateKey = () => {
        if (!newKeyName) return;
        const newKey = {
            id: Math.random().toString(),
            name: newKeyName,
            prefix: `sk_live_${Math.floor(Math.random() * 1000)}...`,
            status: 'active',
            created: new Date().toISOString().split('T')[0]
        };
        setApiKeys(prev => [newKey, ...prev]);
        setCreateKeyOpen(false);
        setNewKeyName('');
    };

    const handleDeleteKey = (id: string) => {
        // Just mock deleting
        setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Active API Keys</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateKeyOpen(true)}>Create Key</Button>
            </Box>

            <TableContainer component={Card} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Key Prefix</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {apiKeys.map((key) => (
                            <TableRow key={key.id}>
                                <TableCell sx={{ fontWeight: 'medium' }}>{key.name}</TableCell>
                                <TableCell sx={{ fontFamily: 'monospace' }}>{key.prefix}</TableCell>
                                <TableCell>{hasMounted ? new Date(key.created).toLocaleDateString() : key.created}</TableCell>
                                <TableCell>
                                    <Chip label={key.status} color={key.status === 'active' ? 'success' : 'default'} size="small" sx={{ textTransform: 'capitalize' }} />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDeleteKey(key.id)}
                                        disabled={key.status === 'revoked'}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Key Dialog */}
            <Dialog open={createKeyOpen} onClose={() => setCreateKeyOpen(false)}>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Key Name (e.g. Website Production)"
                        fullWidth
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateKeyOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateKey} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
