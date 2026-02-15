'use client';

import { useState, useEffect } from 'react';
import { createUpdateRaffleTicket } from '@/actions/raffles/create-update-raffle-ticket';
import { Client, RaffleTicket, Section, User } from '@prisma/client';
import { deleteRaffleTicket } from '@/actions/raffles';
import { getClientInfoById, getPaginatedClients } from '@/actions/client';
import { getSections } from '@/actions/section/get-sections';
import ClientForm from './ClientForm';

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
    clientId: number | '';
    clientAlias?: string;
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
        clientId: raffleTicket?.clientId || '',
        clientAlias: raffleTicket?.clientAlias || '',
        totalPaid: raffleTicket?.totalPaid || '',
        isPaid: raffleTicket?.isPaid || false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [clientSearch, setClientSearch] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    useEffect(() => {
        if (formData.clientId) {
            const fetchClientName = async () => {
                const result = await getClientInfoById(Number(formData.clientId));
                if (result.ok) {
                    setSelectedClient(result.data);
                }
            };
            fetchClientName();
        }
    }, [formData.clientId]);


    // Estados para el modal de crear cliente
    const [showCreateClientModal, setShowCreateClientModal] = useState(false);
    const [sections, setSections] = useState<Section[]>([]);

    // Initialize client search if editing existing ticket
    useEffect(() => {
        if (raffleTicket?.clientId) {
            // If editing, we need to fetch the client info to display in the search field
            const fetchClientInfo = async () => {
                try {
                    const result = await getPaginatedClients(1, undefined, '');
                    if (result.ok) {
                        const client = result.clients?.find(c => c.id === raffleTicket.clientId);
                        if (client) {
                            setClientSearch(`${client.name} - ${client.phone}`);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching client info:', error);
                }
            };
            fetchClientInfo();
        }
    }, [raffleTicket?.clientId]);

    // Cargar secciones al montar el componente
    useEffect(() => {
        const loadSections = async () => {
            try {
                const result = await getSections();
                if (result.ok && result.sections) {
                    setSections(result.sections);
                }
            } catch (error) {
                console.error('Error loading sections:', error);
            }
        };
        loadSections();
    }, []);

    const handleDeleteTicket = async (ticket: RaffleTicket) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el ticket #${ticket.number}?`)) {
            const result = await deleteRaffleTicket(ticket.id);
            if (!result.ok) {
                alert(result.message);
            }
        }
    };

    // Buscar clientes cuando el usuario escriba al menos 3 caracteres
    useEffect(() => {
        const searchClients = async () => {
            if (clientSearch.length >= 3) {
                setLoadingClients(true);
                try {
                    const result = await getPaginatedClients(1, undefined, clientSearch);
                    if (result.ok) {
                        setClients(result.clients || []);
                        setShowDropdown(true);
                    }
                } catch (error) {
                    console.error('Error searching clients:', error);
                } finally {
                    setLoadingClients(false);
                }
            } else {
                setClients([]);
                setShowDropdown(false);
            }
        };

        const timeoutId = setTimeout(searchClients, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [clientSearch]);

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

    // Función para manejar la creación exitosa de un cliente
    const handleClientCreated = async () => {
        setShowCreateClientModal(false);
        // Refrescar la búsqueda de clientes si hay un término de búsqueda
        if (clientSearch.length >= 3) {
            try {
                const result = await getPaginatedClients(1, undefined, clientSearch);
                if (result.ok) {
                    setClients(result.clients || []);
                    setShowDropdown(true);
                }
            } catch (error) {
                console.error('Error refreshing clients:', error);
            }
        }
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
                <div className="relative">
                    <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="client"
                        name="client"
                        value={clientSearch}
                        onChange={(e) => {
                            setClientSearch(e.target.value);
                            if (e.target.value.length < 3) {
                                setFormData(prev => ({ ...prev, clientId: '' }));
                            }
                        }}
                        onFocus={() => {
                            if (clients.length > 0) {
                                setShowDropdown(true);
                            }
                        }}
                        onBlur={() => {
                            // Delay hiding dropdown to allow click on option
                            setTimeout(() => setShowDropdown(false), 200);
                        }}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Escribe al menos 3 letras para buscar..."
                        autoComplete="off"
                    />

                    {/* Loading indicator */}
                    {loadingClients && (
                        <div className="absolute right-3 top-9">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {/* Dropdown with clients */}
                    {showDropdown && clients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {clients.map((client) => (
                                <div
                                    key={client.id}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, clientId: client.id }));
                                        setClientSearch(`${client.name} - ${client.phone}`);
                                        setShowDropdown(false);
                                    }}
                                >
                                    <div className="font-medium text-gray-900">{client.name}</div>
                                    <div className="text-sm text-gray-500">{client.phone}</div>
                                    {client.address && (
                                        <div className="text-xs text-gray-400">{client.address}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No results message */}
                    {clientSearch.length >= 3 && !loadingClients && clients.length === 0 && !formData.clientId && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                            <div className="px-3 py-2 text-gray-500 text-sm">
                                No se encontraron clientes
                            </div>
                            <div className="px-3 py-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateClientModal(true)}
                                    className="w-full text-left px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                    + Crear nuevo cliente &ldquo;{clientSearch}&rdquo;
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Selected client info */}
                    {formData.clientId && selectedClient && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                            <div className="text-sm text-green-800">
                                ✓ Cliente seleccionado: (ID: {formData.clientId} - {selectedClient.name} - {selectedClient.phone})
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="clientAlias" className="block text-sm font-medium text-gray-700 mb-1">
                        Alias (cliente) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        id='clientAlias'
                        name='clientAlias'
                        value={formData.clientAlias}
                        onChange={handleInputChange} />
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

            {/* Modal para crear cliente */}
            {showCreateClientModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4">
                            <ClientForm
                                client={null}
                                sections={sections}
                                onSuccess={handleClientCreated}
                                onCancel={() => setShowCreateClientModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
