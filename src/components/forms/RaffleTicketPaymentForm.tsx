'use client';

import { useState } from 'react';
import { createUpdateRaffleTicketPayment } from '@/actions/raffles/create-update-raffle-ticket-payment';
import { RaffleTicketPayment } from '@prisma/client';

interface RaffleTicketPaymentFormProps {
    payment: RaffleTicketPayment | null;
    ticketId: number;
    ticketNumber: number;
    // clientName: string;
    ticketPrice: number;
    totalPaid: number;
    onSuccess?: () => void;
    onCancel?: () => void;
}

type RaffleTicketPaymentFormState = {
    amount: number | '';
    date: string;
};

export default function RaffleTicketPaymentForm({
    payment,
    ticketId,
    ticketNumber,
    // clientName,
    ticketPrice,
    totalPaid,
    onSuccess,
    onCancel
}: RaffleTicketPaymentFormProps) {
    const [formData, setFormData] = useState<RaffleTicketPaymentFormState>({
        amount: payment?.amount || '',
        date: payment?.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    const maxPaymentAmount = ticketPrice - totalPaid;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const dataToSubmit = {
                ...formData,
                ticketId,
                amount: Number(formData.amount),
                date: new Date(formData.date),
                ...(payment?.id && { id: payment.id })
            };

            const result = await createUpdateRaffleTicketPayment(dataToSubmit);

            if (result.ok) {
                setSuccess(result.message);
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount'
                ? (value ? Number(value) : '')
                : value
        }));
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {payment?.id ? 'Editar Pago' : 'Nuevo Pago'}
            </h2>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                    <span className="font-medium">Ticket #:</span> {ticketNumber}
                </p>
                {/* <p className="text-sm text-blue-800">
                    <span className="font-medium">Cliente:</span> {clientName}
                </p> */}
                <p className="text-sm text-blue-800">
                    <span className="font-medium">Precio del ticket:</span> ${ticketPrice.toFixed(2)}
                </p>
                <p className="text-sm text-blue-800">
                    <span className="font-medium">Total pagado:</span> ${totalPaid.toFixed(2)}
                </p>
                <p className="text-sm text-blue-800">
                    <span className="font-medium">Pendiente:</span> ${maxPaymentAmount.toFixed(2)}
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount Field */}
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                        Monto del Pago <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                            type="number"
                            id="amount"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            required
                            min="0.01"
                            max={maxPaymentAmount}
                            step="0.01"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                        />
                    </div>
                    {formData.amount && Number(formData.amount) > maxPaymentAmount && (
                        <p className="mt-1 text-sm text-red-600">
                            El monto no puede ser mayor al pendiente (${maxPaymentAmount.toFixed(2)})
                        </p>
                    )}
                    {maxPaymentAmount <= 0 && (
                        <p className="mt-1 text-sm text-green-600">
                            ✓ Este ticket ya está pagado completamente
                        </p>
                    )}
                </div>

                {/* Date Field */}
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha del Pago <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Payment Preview */}
                {formData.amount && Number(formData.amount) > 0 && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <h4 className="text-sm font-medium text-gray-800 mb-2">Resumen del Pago</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Monto a pagar:</span>
                                <span>${Number(formData.amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total después del pago:</span>
                                <span>${(totalPaid + Number(formData.amount)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Restante:</span>
                                <span>${(maxPaymentAmount - Number(formData.amount)).toFixed(2)}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between font-medium">
                                <span>Estado:</span>
                                <span className={
                                    (totalPaid + Number(formData.amount)) >= ticketPrice
                                        ? 'text-green-600'
                                        : 'text-yellow-600'
                                }>
                                    {(totalPaid + Number(formData.amount)) >= ticketPrice ? 'Pagado' : 'Pendiente'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

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
                        disabled={loading || maxPaymentAmount <= 0}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
