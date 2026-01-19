'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { GET_TENANT, UPDATE_TENANT, SUBSCRIBE } from '../../../graphql/queries';
import { LIST_INVOICES } from '../../../graphql/billing-queries';
import {
    Business as BuildingOffice2Icon,
    Description as DocumentTextIcon,
    CreditCard as CreditCardIcon,
    Download as ArrowDownTrayIcon
} from '@mui/icons-material';
import { useAuthenticator } from '@aws-amplify/ui-react';

const client = generateClient();

interface Invoice {
    invoiceId: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
}

export default function BillingPage() {
    const { user } = useAuthenticator((context) => [context.user]);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<any>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Billing Info Form State
    const [billingInfo, setBillingInfo] = useState({
        companyName: '',
        rut: '',
        address: '',
        city: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [user]);

    async function fetchData() {
        try {
            if (!user) return;

            const session = await fetchAuthSession();
            const tenantId = session.tokens?.idToken?.payload['custom:tenantId'] as string | undefined;

            if (!tenantId) {
                console.error("No tenant ID found in user session");
                // Fallback or retry?
                return;
            }

            const tenantData: any = await client.graphql({
                query: GET_TENANT,
                variables: { tenantId }
            });

            const t = tenantData.data.getTenant;
            setTenant(t);

            // Parse settings for billing info
            let settings: Record<string, any> = {};
            try {
                settings = JSON.parse(t.settings || '{}');
            } catch { }

            setBillingInfo({
                companyName: settings.billingInfo?.companyName || t.name || '',
                rut: settings.billingInfo?.rut || '',
                address: settings.billingInfo?.address || '',
                city: settings.billingInfo?.city || ''
            });

            // 2. Fetch Invoices
            const invoicesData: any = await client.graphql({
                query: LIST_INVOICES
            });
            setInvoices(invoicesData.data.listInvoices);

        } catch (err) {
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveBillingInfo(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Merge with existing settings
            let currentSettings: Record<string, any> = {};
            try {
                currentSettings = JSON.parse(tenant.settings || '{}');
            } catch { }

            const newSettings = {
                ...currentSettings,
                billingInfo: billingInfo
            };

            await client.graphql({
                query: UPDATE_TENANT,
                variables: {
                    input: {
                        name: tenant.name, // Keep existing name or update if companyName changed? 
                        // Usually companyName in billing is separate from Tenant Name (Brand).
                        // But let's just update settings.
                        billingEmail: tenant.billingEmail,
                        settings: JSON.stringify(newSettings)
                    }
                }
            });

            alert('Información de facturación actualizada');
        } catch (err) {
            console.error('Error updating billing info:', err);
            alert('Error al guardar');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSubscribe(planId: string) {
        try {
            if (!user) return;
            const session = await fetchAuthSession();
            // Get email from user attributes or session
            const email = session.tokens?.idToken?.payload?.email;

            if (!email) {
                alert('No se pudo identificar el email del usuario');
                return;
            }

            const result: any = await client.graphql({
                query: SUBSCRIBE,
                variables: {
                    planId,
                    email,
                    backUrl: window.location.href // Return to this billing page
                }
            });

            const initPoint = result.data.subscribe.initPoint;
            if (initPoint) {
                window.location.href = initPoint;
            } else {
                alert('Error al iniciar suscripción');
            }
        } catch (err) {
            console.error('Subscribe error:', err);
            alert('Error al procesar la solicitud');
        }
    }

    if (loading) return <div className="p-8">Cargando facturación...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Facturación y Pagos</h1>
                <p className="mt-1 text-sm text-gray-500">Administra tu suscripción y detalles de pago.</p>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column: Plan & Billing Info */}
                <div className="md:col-span-2 space-y-8">

                    {/* Current Plan Card */}
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900 flex items-center">
                                <CreditCardIcon className="h-5 w-5 mr-2 text-indigo-500" />
                                Plan Actual
                            </h2>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                                {tenant?.plan || 'LITE'}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mb-4">
                            Tu plan se renueva automáticamente cada mes.
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => handleSubscribe('pro')}
                                disabled={tenant?.plan === 'PRO'}
                                className={`px-4 py-2 border rounded-md text-sm font-medium ${tenant?.plan === 'PRO'
                                    ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                                    }`}
                            >
                                {tenant?.plan === 'PRO' ? 'Plan Actual' : 'Cambiar a PRO'}
                            </button>
                            {tenant?.plan !== 'LITE' && (
                                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                                    Cancelar Suscripción
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Billing Details Form */}
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
                        <h2 className="text-lg font-medium text-gray-900 flex items-center mb-6">
                            <BuildingOffice2Icon className="h-5 w-5 mr-2 text-gray-400" />
                            Datos de Facturación
                        </h2>

                        <form onSubmit={handleSaveBillingInfo} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Razón Social</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                        value={billingInfo.companyName}
                                        onChange={e => setBillingInfo({ ...billingInfo, companyName: e.target.value })}
                                        placeholder="Tu Empresa SpA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">RUT / Tax ID</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                        value={billingInfo.rut}
                                        onChange={e => setBillingInfo({ ...billingInfo, rut: e.target.value })}
                                        placeholder="76.xxx.xxx-k"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    value={billingInfo.address}
                                    onChange={e => setBillingInfo({ ...billingInfo, address: e.target.value })}
                                    placeholder="Av. Providencia 1234, Of 505"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Comuna / Ciudad</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    value={billingInfo.city}
                                    onChange={e => setBillingInfo({ ...billingInfo, city: e.target.value })}
                                    placeholder="Providencia, Santiago"
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {isSaving ? 'Guardando...' : 'Guardar Información'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Invoice History */}
                <div className="md:col-span-1">
                    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-base font-medium text-gray-900 flex items-center">
                                <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                                Historial de Pagos
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {invoices.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No hay pagos registrados aún.
                                </div>
                            ) : (
                                invoices.map((inv) => (
                                    <div key={inv.invoiceId} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {new Date(inv.date).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    ID: {inv.invoiceId.split('-')[0]}...
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                        ${inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                    `}>
                                                {inv.status.toLowerCase()}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex justify-between items-center">
                                            <span className="text-sm font-bold text-gray-900">
                                                ${inv.amount.toLocaleString()} {inv.currency}
                                            </span>
                                            {inv.status === 'PAID' && (
                                                <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center">
                                                    <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                                                    Descargar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
