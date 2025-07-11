'use client';
import { Raffle, RaffleTicket, RaffleTicketPayment } from "@prisma/client"
import { FC, useState } from "react"
import Link from "next/link"
import RaffleTicketForm from "@/components/forms/RaffleTicket"
import RaffleTicketPaymentForm from "@/components/forms/RaffleTicketPaymentForm"
import { deleteRaffleTicket } from "@/actions/raffles/delete-raffle-ticket"
import { RaffleHeader } from "@/components/raffle/RaffleHeader"
import { RaffleSearch } from "@/components/raffle/RaffleSearch"
import { RaffleLegend } from "@/components/raffle/RaffleLegend"
import { RaffleNumbersGrid } from "@/components/raffle/RaffleNumbersGrid"
import { 
    filterNumbers, 
    createOccupiedNumbersMap, 
    generateNumbers, 
    getAvailableNumbers 
} from "@/utils/raffle-utils"

interface Props {
    raffle: Raffle & {
        tickets: (RaffleTicket & {
            payments: RaffleTicketPayment[]
        })[]
    } | null
}

export const RaffleView: FC<Props> = ({ raffle }) => {
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<RaffleTicket | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<RaffleTicketPayment | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    if (!raffle) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Rifa no encontrada</h1>
                    <p className="text-gray-600">La rifa solicitada no existe o ha sido eliminada.</p>
                </div>
            </div>
        );
    }

    // Crear datos base
    const occupiedNumbers = createOccupiedNumbersMap(raffle.tickets);
    const numbers = generateNumbers(raffle.totalNumbers);
    const availableNumbers = getAvailableNumbers(numbers, occupiedNumbers);
    const filteredNumbers = filterNumbers(numbers, searchTerm, occupiedNumbers);

    // Calcular estadísticas
    const totalSold = raffle.tickets.length;
    const totalAvailable = raffle.totalNumbers - totalSold;

    // Handlers para modales
    const handleCreateTicket = () => {
        setSelectedTicket(null);
        setShowTicketForm(true);
    };

    const handleEditTicket = (ticket: RaffleTicket) => {
        setSelectedTicket(ticket);
        setShowTicketForm(true);
    };

    const handleAddPayment = (ticket: RaffleTicket) => {
        setSelectedTicket(ticket);
        setSelectedPayment(null);
        setShowPaymentForm(true);
    };

    const handleDeleteTicket = async (ticket: RaffleTicket) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el ticket #${ticket.number}?`)) {
            const result = await deleteRaffleTicket(ticket.id);
            if (!result.ok) {
                alert(result.message);
            }
        }
    };

    const handleCreateTicketFromNumber = (number: number) => {
        setSelectedTicket({ 
            number, 
            raffleId: raffle.id, 
            client: '', 
            totalPaid: 0, 
            isPaid: false 
        } as RaffleTicket);
        setShowTicketForm(true);
    };

    const handleCloseModals = () => {
        setShowTicketForm(false);
        setShowPaymentForm(false);
        setSelectedTicket(null);
        setSelectedPayment(null);
    };

    return (
        <div className="container mx-auto p-4 md:p-6">
            {/* Botón de volver */}
            <div className="mb-4">
                <Link
                    href="/app/rifas"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    ← Volver a Rifas
                </Link>
            </div>

            {/* Header con información de la rifa */}
            <RaffleHeader 
                raffle={raffle}
                totalSold={totalSold}
                totalAvailable={totalAvailable}
            />

            {/* Lista de números */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                    <div className="flex flex-col items-center gap-4 mt-2 sm:mt-0">
                        <div className="flex justify-between items-center w-full sm:w-auto gap-4">
                            <h2 className="text-xl font-bold text-gray-800">Números de la Rifa</h2>
                            <button
                                onClick={handleCreateTicket}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                + Nuevo Ticket
                            </button>
                        </div>
                        
                        {/* Leyenda */}
                        <RaffleLegend />

                        {/* Campo de búsqueda */}
                        <RaffleSearch 
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            filteredCount={filteredNumbers.length}
                            totalCount={numbers.length}
                        />
                    </div>
                </div>

                {/* Grid de números */}
                <div className="grid grid-cols-2 gap-4">
                    <RaffleNumbersGrid
                        filteredNumbers={filteredNumbers}
                        occupiedNumbers={occupiedNumbers}
                        rafflePrice={raffle.ticketPrice}
                        searchTerm={searchTerm}
                        onEditTicket={handleEditTicket}
                        onAddPayment={handleAddPayment}
                        onDeleteTicket={handleDeleteTicket}
                        onCreateTicket={handleCreateTicketFromNumber}
                        onClearSearch={() => setSearchTerm('')}
                    />
                </div>

                {/* Leyenda adicional */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Leyenda</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Pagado completamente</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-600">⏳</span>
                            <span>Pendiente de pago</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para RaffleTicketForm */}
            {showTicketForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4">
                            <RaffleTicketForm
                                raffleTicket={selectedTicket}
                                raffleId={raffle.id}
                                raffleTitle={raffle.title}
                                ticketPrice={raffle.ticketPrice}
                                availableNumbers={availableNumbers}
                                onSuccess={handleCloseModals}
                                onCancel={handleCloseModals}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para RaffleTicketPaymentForm */}
            {showPaymentForm && selectedTicket && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4">
                            {(() => {
                                // Obtener el ticket completo con pagos del mapa
                                const fullTicket = occupiedNumbers.get(selectedTicket.number);
                                const realTotalPaid = fullTicket?.payments?.reduce((sum: number, payment: RaffleTicketPayment) => sum + payment.amount, 0) || 0;
                                return (
                                    <RaffleTicketPaymentForm
                                        payment={selectedPayment}
                                        ticketId={selectedTicket.id}
                                        ticketNumber={selectedTicket.number}
                                        clientName={selectedTicket.client}
                                        ticketPrice={raffle.ticketPrice}
                                        totalPaid={realTotalPaid}
                                        onSuccess={handleCloseModals}
                                        onCancel={handleCloseModals}
                                    />
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
