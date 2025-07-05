'use client';

import { useState } from 'react';
import { createOrUpdateRaffle } from '@/actions/raffles/create-update-raffle';
import { Raffle } from '@prisma/client';

interface RaffleFormProps {
    raffle: Raffle | null;
    onSuccess?: () => void;
    onCancel?: () => void;
}

type RaffleFormState = {
    title: string;
    drawDate: string;
    ticketPrice: number | '';
    totalNumbers: number | '';
    prize: string;
};

export default function RaffleForm({ raffle, onSuccess, onCancel }: RaffleFormProps) {
    const [formData, setFormData] = useState<RaffleFormState>({
        title: raffle?.title || '',
        drawDate: raffle?.drawDate ? new Date(raffle.drawDate).toISOString().split('T')[0] : '',
        ticketPrice: raffle?.ticketPrice || '',
        totalNumbers: raffle?.totalNumbers || '',
        prize: raffle?.prize || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    // Obtener fecha mínima (hoy)
    const minDate = new Date().toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const dataToSubmit = {
                ...formData,
                drawDate: new Date(formData.drawDate),
                ticketPrice: Number(formData.ticketPrice),
                totalNumbers: Number(formData.totalNumbers),
                ...(raffle?.id && { id: raffle.id })
            };

            const result = await createOrUpdateRaffle(dataToSubmit);

            if (result.ok) {
                setSuccess(result.message);
                setTimeout(() => {
                    onSuccess?.();
                }, 1500);
            } else {
                setError(result.message || 'Error al guardar la rifa');
            }
        } catch {
            setError('Error inesperado al guardar la rifa');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'ticketPrice' || name === 'totalNumbers') 
                ? (value ? Number(value) : '') 
                : value
        }));
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {raffle?.id ? 'Editar Rifa' : 'Nueva Rifa'}
            </h2>

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
                {/* Title Field */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Título de la Rifa <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: Rifa Navideña 2024"
                    />
                </div>

                {/* Draw Date Field */}
                <div>
                    <label htmlFor="drawDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha del Sorteo <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        id="drawDate"
                        name="drawDate"
                        value={formData.drawDate}
                        onChange={handleInputChange}
                        min={!raffle?.id ? minDate : undefined}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Ticket Price Field */}
                <div>
                    <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-700 mb-1">
                        Precio por Boleto <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                            type="number"
                            id="ticketPrice"
                            name="ticketPrice"
                            value={formData.ticketPrice}
                            onChange={handleInputChange}
                            required
                            min="0"
                            step="0.01"
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Total Numbers Field */}
                <div>
                    <label htmlFor="totalNumbers" className="block text-sm font-medium text-gray-700 mb-1">
                        Total de Números <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        id="totalNumbers"
                        name="totalNumbers"
                        value={formData.totalNumbers}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ej: 100"
                    />
                </div>

                {/* Prize Field */}
                <div>
                    <label htmlFor="prize" className="block text-sm font-medium text-gray-700 mb-1">
                        Premio <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="prize"
                        name="prize"
                        value={formData.prize}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Describe el premio de la rifa"
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
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Guardando...
                            </div>
                        ) : (
                            raffle?.id ? 'Actualizar Rifa' : 'Crear Rifa'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
