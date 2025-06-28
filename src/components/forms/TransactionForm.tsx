'use client';

import { useState } from 'react';
import { createOrUpdateTransaction } from '@/actions/transaction/create-update-transaction';
import { TransactionType } from '@prisma/client';

interface TransactionFormProps {
    transaction?: {
        id: number;
        type: TransactionType;
        isActive: boolean;
        description?: string | null;
        totalAmount: number;
        remaining: number;
        clientId: number;
    } | null;
    clientId: number;
    onSuccess?: () => void;
    onCancel?: () => void;
}

type TransactionFormState = {
    type: TransactionType;
    description: string;
    totalAmount: number;
    remaining: number;
    isActive: boolean;
    clientId: number;
};

export default function TransactionForm({ transaction, clientId, onSuccess, onCancel }: TransactionFormProps) {
    const [formData, setFormData] = useState<TransactionFormState>({
        type: transaction?.type || TransactionType.SALE,
        description: transaction?.description || '',
        totalAmount: transaction?.totalAmount || 0,
        remaining: transaction?.remaining || transaction?.totalAmount || 0,
        isActive: transaction?.isActive ?? true,
        clientId: transaction?.clientId || clientId
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
                ...(transaction?.id && { id: transaction.id }) // Include ID if editing
            };

            const result = await createOrUpdateTransaction(dataToSubmit);

            if (result.ok) {
                onSuccess?.();
            } else {
                setError(result.message || 'Error al guardar la transacción');
            }
        } catch {
            setError('Error inesperado al guardar la transacción');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked 
                  : type === 'number' ? (value ? parseFloat(value) : 0)
                  : value
        }));
        
        // Auto-update remaining when totalAmount changes for new transactions
        if (name === 'totalAmount' && !transaction?.id) {
            const newAmount = value ? parseFloat(value) : 0;
            setFormData(prev => ({
                ...prev,
                totalAmount: newAmount,
                remaining: newAmount
            }));
        }
    };

    const transactionTypeOptions = [
        { value: TransactionType.SALE, label: 'Venta' },
        { value: TransactionType.LOAN, label: 'Préstamo' },
        { value: TransactionType.SERVICE, label: 'Servicio' },
    ];

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {transaction?.id ? 'Editar Transacción' : 'Nueva Transacción'}
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Transaction Type */}
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Transacción <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {transactionTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
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
                        placeholder="Descripción opcional de la transacción..."
                    />
                </div>

                {/* Total Amount */}
                <div>
                    <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                        Monto Total <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                            id="totalAmount"
                            name="totalAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.totalAmount || ''}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Remaining Amount (only show for existing transactions) */}
                {transaction?.id && (
                    <div>
                        <label htmlFor="remaining" className="block text-sm font-medium text-gray-700 mb-1">
                            Monto Restante
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                id="remaining"
                                name="remaining"
                                type="number"
                                step="0.01"
                                min="0"
                                max={formData.totalAmount}
                                value={formData.remaining || ''}
                                onChange={handleInputChange}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                )}

                {/* Active Status */}
                <div className="flex items-center">
                    <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        Transacción activa
                    </label>
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
                            transaction?.id ? 'Actualizar Transacción' : 'Crear Transacción'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
