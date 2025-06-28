'use client';

import { useState } from 'react';
import { createOrUpdateClient } from '@/actions/client/create-update-client';
import { Client, Section } from '@prisma/client';

interface ClientFormProps {
    client: Client | null;
    sections: Section[];
    onSuccess?: () => void;
    onCancel?: () => void;
}

type ClientFormState = {
    name: string;
    phone: string;
    address: string;
    sectionId: number | '';
};

export default function ClientForm({ client, sections, onSuccess, onCancel }: ClientFormProps) {
    const [formData, setFormData] = useState<ClientFormState>({
        name: client?.name || '',
        phone: client?.phone || '',
        address: client?.address || '',
        sectionId: client?.sectionId || ''
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
                ...(client?.id && { id: client.id }) // Include ID if editing
            };

            const result = await createOrUpdateClient(dataToSubmit);

            if (result.ok) {
                onSuccess?.();
            } else {
                setError(result.message || 'Error al guardar el cliente');
            }
        } catch {
            setError('Error inesperado al guardar el cliente');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'sectionId' ? (value ? parseInt(value) : undefined) : value
        }));
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {client?.id ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ingrese el nombre completo"
                    />
                </div>

                {/* Phone Field */}
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ingrese el número de teléfono"
                    />
                </div>

                {/* Address Field */}
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                    </label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ingrese la dirección (opcional)"
                    />
                </div>

                {/* Section Field */}
                <div>
                    <label htmlFor="sectionId" className="block text-sm font-medium text-gray-700 mb-1">
                        Sección
                    </label>
                    <select
                        id="sectionId"
                        name="sectionId"
                        value={formData.sectionId || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Seleccione una sección (opcional)</option>
                        {sections.map((section) => (
                            <option key={section.id} value={section.id}>
                                {section.name}
                            </option>
                        ))}
                    </select>
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
                            client?.id ? 'Actualizar Cliente' : 'Crear Cliente'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
