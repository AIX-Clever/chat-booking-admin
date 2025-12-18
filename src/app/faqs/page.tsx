'use client';

import * as React from 'react';
import { generateClient } from 'aws-amplify/api';
import { LIST_FAQS, CREATE_FAQ, UPDATE_FAQ, DELETE_FAQ } from '../../graphql/queries';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
    Typography,
    Button,
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

// --- Types ---
interface FAQ {
    faqId: string;
    question: string;
    answer: string;
    category: string;
    active: boolean;
}

const client = generateClient();

export default function FAQsPage() {
    const [faqs, setFaqs] = React.useState<FAQ[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');

    // Dialog States
    const [open, setOpen] = React.useState(false);
    const [currentFAQ, setCurrentFAQ] = React.useState<FAQ | null>(null);

    // Form State
    const [formData, setFormData] = React.useState({
        question: '',
        answer: '',
        category: 'General',
        active: true
    });

    // Confirmation Dialog
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmConfig, setConfirmConfig] = React.useState<{
        title: string;
        content: string;
        action: () => void;
    }>({ title: '', content: '', action: () => { } });

    React.useEffect(() => {
        fetchFAQs();
    }, []);

    const fetchFAQs = async () => {
        setLoading(true);
        try {
            const response: any = await client.graphql({ query: LIST_FAQS });
            setFaqs(response.data.listFAQs);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (faq?: FAQ) => {
        if (faq) {
            setCurrentFAQ(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                active: faq.active
            });
        } else {
            setCurrentFAQ(null);
            setFormData({
                question: '',
                answer: '',
                category: 'General',
                active: true
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = async () => {
        try {
            if (currentFAQ) {
                // Edit
                const response: any = await client.graphql({
                    query: UPDATE_FAQ,
                    variables: {
                        input: {
                            faqId: currentFAQ.faqId,
                            question: formData.question,
                            answer: formData.answer,
                            category: formData.category,
                            active: formData.active
                        }
                    }
                });
                const updated = response.data.updateFAQ;
                setFaqs((prev) =>
                    prev.map((f) => (f.faqId === currentFAQ.faqId ? updated : f))
                );
            } else {
                // Create
                const response: any = await client.graphql({
                    query: CREATE_FAQ,
                    variables: {
                        input: {
                            question: formData.question,
                            answer: formData.answer,
                            category: formData.category,
                            active: formData.active
                        }
                    }
                });
                const created = response.data.createFAQ;
                setFaqs((prev) => [...prev, created]);
            }
            setOpen(false);
        } catch (error) {
            console.error('Error saving FAQ:', error);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmConfig({
            title: 'Delete FAQ',
            content: 'Are you sure you want to delete this FAQ? This action cannot be undone.',
            action: async () => {
                try {
                    await client.graphql({
                        query: DELETE_FAQ,
                        variables: { faqId: id }
                    });
                    setFaqs((prev) => prev.filter((f) => f.faqId !== id));
                    setConfirmOpen(false);
                } catch (error) {
                    console.error('Error deleting FAQ:', error);
                }
            }
        });
        setConfirmOpen(true);
    };

    const filteredFAQs = faqs.filter((f) =>
        f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <ConfirmDialog
                open={confirmOpen}
                title={confirmConfig.title}
                content={confirmConfig.content}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmConfig.action}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 5 }}>
                <Typography variant="h4">FAQs</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    New FAQ
                </Button>
            </Box>

            <Card>
                <Box sx={{ p: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Search FAQs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>

                {loading ? (
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer sx={{ minWidth: 800 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Question</TableCell>
                                    <TableCell>Answer</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredFAQs.map((row) => (
                                    <TableRow key={row.faqId} hover>
                                        <TableCell width="30%">
                                            <Typography variant="subtitle2">
                                                {row.question}
                                            </Typography>
                                        </TableCell>
                                        <TableCell width="40%">
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                {row.answer}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{row.category}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={row.active ? 'Active' : 'Inactive'}
                                                color={row.active ? 'success' : 'default'}
                                                size="small"
                                                variant="filled"
                                                sx={{ borderRadius: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => handleOpen(row)} color="primary">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(row.faqId)} color="error">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredFAQs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                No FAQs found.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>

            {/* FAQ Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{currentFAQ ? 'Edit FAQ' : 'New FAQ'}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        <TextField
                            label="Question"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        />
                        <TextField
                            label="Answer"
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                        />
                        <TextField
                            label="Category"
                            fullWidth
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                />
                            }
                            label="Active"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} variant="contained" disabled={!formData.question || !formData.answer}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
