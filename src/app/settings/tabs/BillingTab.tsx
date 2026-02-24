'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { GET_TENANT } from '../../../graphql/queries';
import { LIST_INVOICES, GET_INVOICE_DOWNLOAD_URL } from '../../../graphql/billing-queries';
import {
    Description as DocumentTextIcon,
    CreditCard as CreditCardIcon,
    Download as ArrowDownTrayIcon,
    CheckCircle as CheckCircleIcon,
    ExpandMore as ExpandMoreIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
    Paper,
    Typography,
    Box,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Skeleton
} from '@mui/material';
import { getPlanDetails } from '../../../utils/plans';

const client = generateClient();

interface Invoice {
    invoiceId: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    dteFolio?: string;
    dtePdfUrl?: string;
}

export default function BillingTab() {
    const { user } = useAuthenticator((context) => [context.user]);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<any>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(true);

    const fetchData = React.useCallback(async () => {
        try {
            if (!user) return;

            const session = await fetchAuthSession();
            const tId = session.tokens?.idToken?.payload['custom:tenantId'] as string | undefined;

            if (!tId) return;

            // 1. Fetch Tenant (Plan info)
            try {
                const tenantData: any = await client.graphql({
                    query: GET_TENANT,
                    variables: { tenantId: tId }
                });
                const t = tenantData.data.getTenant;
                setTenant(t);
            } catch (e) {
                console.warn("Could not fetch tenant", e);
            }

            // 2. Fetch Invoices
            try {
                const invoicesData: any = await client.graphql({
                    query: LIST_INVOICES
                });
                const fetchedInvoices = invoicesData.data.listInvoices || [];

                // Sort by date desc
                const sorted = fetchedInvoices.sort((a: any, b: any) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setInvoices(sorted);
            } catch (e) {
                console.warn("Could not fetch invoices", e);
            }

        } catch (err) {
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
            setLoadingInvoices(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [user, fetchData]);

    async function handleDownloadInvoice(invoiceId: string) {
        try {
            const result: any = await client.graphql({
                query: GET_INVOICE_DOWNLOAD_URL,
                variables: { invoiceId }
            });
            const url = result.data.getInvoiceDownloadUrl;
            if (url) {
                window.open(url, '_blank');
            } else {
                alert("No se pudo obtener el enlace de descarga.");
            }
        } catch (err) {
            console.error("Error fetching download URL:", err);
            alert("Error al intentar descargar la factura.");
        }
    }

    async function handleSubscribe() {
        // Mock subscribe or actual logic
        alert("Redirigiendo a pasarela de pago...");
    }

    // Derived State
    const planDetails = getPlanDetails(tenant?.plan);

    // Calculate "Paid Until" and Status
    const lastPaidInvoice = invoices.find(inv => inv.status === 'PAID');
    let paidUntilDate = new Date();
    let isTrial = false;

    if (lastPaidInvoice) {
        const invoiceDate = new Date(lastPaidInvoice.date);
        paidUntilDate = new Date(invoiceDate);
        paidUntilDate.setMonth(invoiceDate.getMonth() + 1);
    } else if (tenant?.createdAt) {
        const created = new Date(tenant.createdAt);
        paidUntilDate = new Date(created);
        paidUntilDate.setDate(created.getDate() + 15); // 15 days standard trial
        isTrial = true;
    }

    const isExpired = paidUntilDate < new Date();
    const statusLabel = isExpired ? 'Pago Pendiente' : (isTrial ? 'Periodo de Prueba' : 'Pagos al día');
    const statusColor = isExpired ? 'error' : (isTrial ? 'info' : 'success');
    const statusBg = isExpired ? '#fef2f2' : (isTrial ? '#eff6ff' : '#dcfce7');
    const statusText = isExpired ? '#991b1b' : (isTrial ? '#1e40af' : '#166534');

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    const getPeriod = (dateStr: string) => {
        const start = new Date(dateStr);
        const end = new Date(start);
        end.setMonth(start.getMonth() + 1);
        return `${formatDate(start)} - ${formatDate(end)}`;
    };

    if (loading) return (
        <Box sx={{ width: '100%' }}>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 4, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Box>
    );

    return (
        <Box sx={{ width: '100%', py: 2 }}>

            {/* 1. Plan Details Card */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon color="primary" sx={{ fontSize: 24 }} />
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                            {planDetails.name}
                        </Typography>
                    </Box>
                    <Chip
                        label={statusLabel}
                        color={statusColor}
                        size="small"
                        sx={{ bgcolor: statusBg, color: statusText, fontWeight: 'bold' }}
                    />
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                    Capacidad profesionales: {planDetails.capacity}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                    Mensualidad: {formatCurrency(planDetails.price)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Pagado hasta: {formatDate(paidUntilDate)}
                </Typography>

                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe' }}>
                    Los pagos de Hola Lucia se realizan durante los primeros 10 días del mes que se está utilizando el servicio.
                </Alert>

                <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    size="large"
                    startIcon={<CreditCardIcon />}
                    onClick={handleSubscribe}
                    sx={{ mb: 2, bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' }, textTransform: 'none', fontWeight: 'bold' }}
                >
                    Pagar suscripción
                </Button>

                <Accordion elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0369a1' }}>
                            <DocumentTextIcon fontSize="small" />
                            <Typography fontWeight="medium">Ver datos para pago por transferencia</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Banco:</strong> Banco Security<br />
                            <strong>Cuenta Corriente:</strong> 12345678<br />
                            <strong>RUT:</strong> 76.xxx.xxx-k<br />
                            <strong>Email:</strong> pagos@holalucia.ai
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Box sx={{ display: 'flex', gap: 4, mt: 3, justifyContent: 'center' }}>
                    <Box component="a" href="#" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#0369a1', textDecoration: 'none', fontWeight: 'medium', fontSize: '0.875rem' }}>
                        Respaldo Información <ArrowDownTrayIcon fontSize="small" sx={{ transform: 'rotate(-45deg)' }} />
                    </Box>
                    <Box component="a" href="#" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#0369a1', textDecoration: 'none', fontWeight: 'medium', fontSize: '0.875rem' }}>
                        Términos y condiciones <ArrowDownTrayIcon fontSize="small" sx={{ transform: 'rotate(-45deg)' }} />
                    </Box>
                </Box>
            </Paper>

            {/* 2. Invoice History */}
            <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DocumentTextIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold" color="#0c4a6e">
                        Resumen de pagos/cobros por mensualidad
                    </Typography>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>Fecha</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>Período</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>Monto</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>N° de factura</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingInvoices ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">Cargando pagos...</TableCell>
                                </TableRow>
                            ) : invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No hay pagos registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice.invoiceId} hover>
                                        <TableCell>{formatDate(new Date(invoice.date))}</TableCell>
                                        <TableCell>{getPeriod(invoice.date)}</TableCell>
                                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: invoice.status === 'PAID' ? '#166534' : '#b45309' }}>
                                                {invoice.status === 'PAID' ? 'Pagos al dia' : 'Pendiente'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{invoice.dteFolio || invoice.invoiceId.substring(0, 8)}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{ minWidth: '40px', px: 0, bgcolor: '#0284c7' }}
                                                onClick={() => handleDownloadInvoice(invoice.invoiceId)}
                                            >
                                                <ArrowDownTrayIcon fontSize="small" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
