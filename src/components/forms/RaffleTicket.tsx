'use client';

import { useState, useEffect } from 'react';
import { createUpdateRaffleTicket } from '@/actions/raffles/create-update-raffle-ticket';
import { RaffleTicket } from '@prisma/client';
import { deleteRaffleTicket } from '@/actions/raffles';

interface RaffleTicketFormProps {
    raffleTicket: RaffleTicket | null;
    raffleId: number;
    raffleTitle: string;
    ticketPrice: number;
    availableNumbers: number[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

type RaffleTicketFormState = {
    number: number | '';
    client: string;
    totalPaid: number | '';
    isPaid: boolean;
};

export default function RaffleTicketForm({
    raffleTicket,
    raffleId,
    raffleTitle,
    ticketPrice,
    availableNumbers,
    onSuccess,
    onCancel
}: RaffleTicketFormProps) {
    const [formData, setFormData] = useState<RaffleTicketFormState>({
        number: raffleTicket?.number || '',
        client: raffleTicket?.client || '',
        totalPaid: raffleTicket?.totalPaid || '',
        isPaid: raffleTicket?.isPaid || false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    const handleDeleteTicket = async (ticket: RaffleTicket) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el ticket #${ticket.number}?`)) {
            const result = await deleteRaffleTicket(ticket.id);
            if (!result.ok) {
                alert(result.message);
            }
        }
    };

    // Actualizar isPaid automáticamente cuando totalPaid cambie
    useEffect(() => {
        if (formData.totalPaid && Number(formData.totalPaid) >= ticketPrice) {
            setFormData(prev => ({ ...prev, isPaid: true }));
        } else {
            setFormData(prev => ({ ...prev, isPaid: false }));
        }
    }, [formData.totalPaid, ticketPrice]);

    // Actualizar totalPaid cuando isPaid cambie a true
    useEffect(() => {
        if (formData.isPaid && (!formData.totalPaid || Number(formData.totalPaid) < ticketPrice)) {
            setFormData(prev => ({ ...prev, totalPaid: ticketPrice }));
        }
    }, [formData.isPaid, formData.totalPaid, ticketPrice]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const dataToSubmit = {
                ...formData,
                raffleId,
                number: Number(formData.number),
                totalPaid: Number(formData.totalPaid),
                ...(raffleTicket?.id && { id: raffleTicket.id })
            };

            const result = await createUpdateRaffleTicket(dataToSubmit);

            if (result.ok) {
                setSuccess(result.message);
                onSuccess?.();
            } else {
                setError(result.message || 'Error al guardar el ticket');
            }
        } catch {
            setError('Error inesperado al guardar el ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox'
                ? (e.target as HTMLInputElement).checked
                : (name === 'number' || name === 'totalPaid')
                    ? (value ? Number(value) : '')
                    : value
        }));
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                    {raffleTicket?.id ? 'Editar Ticket' : 'Nuevo Ticket'}
                </h2>
                {raffleTicket?.id && (
                    <button 
                        onClick={() => handleDeleteTicket(raffleTicket as RaffleTicket)} 
                        className="flex items-center space-x-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-sm font-medium">Eliminar</span>
                    </button>
                )}
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                    <span className="font-medium">Rifa:</span> {raffleTitle}
                </p>
                <p className="text-sm text-blue-800">
                    <span className="font-medium">Precio por ticket:</span> ${ticketPrice.toFixed(2)}
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
                {/* Number Field */}
                <div>
                    <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                        Número del Ticket <span className="text-red-500">*</span>
                    </label>
                    {raffleTicket?.id ? (
                        <input
                            type="number"
                            id="number"
                            name="number"
                            value={formData.number}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                        />
                    ) : (
                        <select
                            id="number"
                            name="number"
                            value={formData.number}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Seleccionar número</option>
                            {availableNumbers.map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Client Field */}
                <div>
                    <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="client"
                        name="client"
                        value={formData.client}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nombre del cliente"
                    />
                </div>

                {/* Total Paid Field */}
                <div>
                    <label htmlFor="totalPaid" className="block text-sm font-medium text-gray-700 mb-1">
                        Total Pagado <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                            type="number"
                            id="totalPaid"
                            name="totalPaid"
                            value={formData.totalPaid}
                            onChange={handleInputChange}
                            required
                            min="0"
                            max={ticketPrice}
                            step="0.01"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                        />
                    </div>
                    {formData.totalPaid && Number(formData.totalPaid) > ticketPrice && (
                        <p className="mt-1 text-sm text-red-600">
                            El monto no puede ser mayor al precio del ticket
                        </p>
                    )}
                </div>

                {/* Payment Status */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="isPaid"
                        name="isPaid"
                        checked={formData.isPaid}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">
                        Pagado completamente
                    </label>
                </div>

                {/* Payment Status Info */}
                <div className={`p-3 rounded-md ${formData.isPaid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                    }`}>
                    <p className={`text-sm ${formData.isPaid ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                        {formData.isPaid ? '✓ Ticket pagado completamente' : '⏳ Pago pendiente'}
                    </p>
                    {formData.totalPaid && Number(formData.totalPaid) < ticketPrice && (
                        <p className="text-sm text-yellow-800 mt-1">
                            Restante: ${(ticketPrice - Number(formData.totalPaid)).toFixed(2)}
                        </p>
                    )}
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
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Guardando...
                            </div>
                        ) : (
                            raffleTicket?.id ? 'Actualizar Ticket' : 'Crear Ticket'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
