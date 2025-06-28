'use client';

import { useState } from 'react';
import { createOrUpdatePayment } from '@/actions/payment/create-update-payment';
import { Transaction } from '@prisma/client';

interface PaymentFormProps {
    payment?: {
        id: number;
        amount: number;
        date: Date;
        description?: string | null;
        transactionId?: number | null;
        clientId: number;
    } | null;
    clientId: number;
    transactions?: Transaction[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

type PaymentFormState = {
    amount: number;
    date: string;
    description: string;
    transactionId: number | '';
    clientId: number;
};

export default function PaymentForm({ payment, clientId, transactions = [], onSuccess, onCancel }: PaymentFormProps) {
    const [formData, setFormData] = useState<PaymentFormState>({
        amount: payment?.amount || 0,
        date: payment?.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: payment?.description || '',
        transactionId: payment?.transactionId || '',
        clientId: payment?.clientId || clientId
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const dataToSubmit = {
                ...formData,
                date: new Date(formData.date),
                transactionId: formData.transactionId || undefined,
                ...(payment?.id && { id: payment.id }) // Include ID if editing
            };

            const result = await createOrUpdatePayment(dataToSubmit);

            if (result.ok) {
                onSuccess?.();
            } else {
                setError(result.message || 'Error al guardar el pago');
            }
        } catch {
            setError('Error inesperado al guardar el pago');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value ? parseFloat(value) : 0)
                  : name === 'transactionId' ? (value ? parseInt(value) : '')
                  : value
        }));
    };

    // Filter transactions that have remaining debt
    const availableTransactions = transactions.filter(t => t.remaining > 0 && t.isActive);

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {payment?.id ? 'Editar Pago' : 'Nuevo Pago'}
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount */}
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Monto del Pago <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.amount || ''}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha del Pago <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Transaction */}
                <div>
                    <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-1">
                        Transacción (Opcional)
                    </label>
                    <select
                        id="transactionId"
                        name="transactionId"
                        value={formData.transactionId || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Seleccione una transacción (opcional)</option>
                        {availableTransactions.map((transaction) => (
                            <option key={transaction.id} value={transaction.id}>
                                {transaction.type === 'SALE' ? 'Venta' :
                                 transaction.type === 'LOAN' ? 'Préstamo' : 'Servicio'} - 
                                ${transaction.totalAmount.toFixed(2)} (Restante: ${transaction.remaining.toFixed(2)})
                                {transaction.description && ` - ${transaction.description}`}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        Si selecciona una transacción, el pago se aplicará automáticamente a la deuda pendiente.
                    </p>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descripción opcional del pago..."
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Guardando...
                            </div>
                        ) : (
                            payment?.id ? 'Actualizar Pago' : 'Registrar Pago'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
