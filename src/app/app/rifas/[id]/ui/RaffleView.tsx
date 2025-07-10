'use client';
import { Raffle, RaffleTicket, RaffleTicketPayment } from "@prisma/client"
import { FC, useState } from "react"
import Link from "next/link"
import RaffleTicketForm from "@/components/forms/RaffleTicket"
import RaffleTicketPaymentForm from "@/components/forms/RaffleTicketPaymentForm"
import { deleteRaffleTicket } from "@/actions/raffles/delete-raffle-ticket"

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
    // const [showPotential, setShowPotential] = useState(false);
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

    // Formatear fecha
    const formatDate = (date: Date) => {
        const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        return adjustedDate.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Formatear dinero
    const formatMoney = (amount: number) => {
        return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    };

    // Verificar si la rifa ha terminado
    const isRaffleExpired = () => {
        const today = new Date();
        const adjustedDrawDate = new Date(raffle.drawDate.getTime() + raffle.drawDate.getTimezoneOffset() * 60000);
        return adjustedDrawDate < today;
    };

    // Crear mapa de números ocupados
    const occupiedNumbers = new Map<number, RaffleTicket & { payments: RaffleTicketPayment[] }>();
    raffle.tickets.forEach(ticket => {
        occupiedNumbers.set(ticket.number, ticket);
    });

    // Generar array de números del 1 al totalNumbers
    const numbers = Array.from({ length: raffle.totalNumbers }, (_, i) => i + 1);

    // Obtener números disponibles
    const availableNumbers = numbers.filter(num => !occupiedNumbers.has(num));

    // Función para formatear número con cero inicial si es necesario
    const formatNumber = (num: number): string => {
        return num < 10 ? `0${num}` : num.toString();
    };

    // Función para filtrar números basado en el término de búsqueda
    const filteredNumbers = numbers.filter(number => {
        if (!searchTerm.trim()) return true;
        
        const ticket = occupiedNumbers.get(number);
        const numberStr = formatNumber(number);
        const searchLower = searchTerm.toLowerCase();
        
        // Buscar por número
        if (numberStr.includes(searchLower)) return true;
        
        // Buscar por nombre de cliente si existe
        if (ticket && ticket.client.toLowerCase().includes(searchLower)) return true;
        
        return false;
    });

    // Funciones para manejar los modales
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

    const handleCloseModals = () => {
        setShowTicketForm(false);
        setShowPaymentForm(false);
        setSelectedTicket(null);
        setSelectedPayment(null);
    };

    // Calcular estadísticas basadas en pagos reales
    const totalSold = raffle.tickets.length;
    // const totalRevenue = raffle.tickets.reduce((sum, ticket) => {
    //     const ticketPayments = ticket.payments?.reduce((paymentSum, payment) => paymentSum + payment.amount, 0) || 0;
    //     return sum + ticketPayments;
    // }, 0);
    // const potentialRevenue = raffle.ticketPrice * raffle.totalNumbers;
    const totalAvailable = raffle.totalNumbers - totalSold;

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

            {/* Información de la rifa */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{raffle.title}</h1>
                            {isRaffleExpired() && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    Terminada
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-gray-600">Fecha del sorteo</p>
                                <p className="text-lg font-semibold text-gray-800">{formatDate(raffle.drawDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Precio por boleto</p>
                                <p className="text-lg font-semibold text-green-600">{formatMoney(raffle.ticketPrice)}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Premio</p>
                            <p className="text-gray-800 bg-gray-50 p-3 rounded-md">{raffle.prize}</p>
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="bg-gray-50 rounded-lg p-4 min-w-64">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Estadísticas</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Vendidos:</span>
                                <span className="font-semibold text-blue-600">{totalSold}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Disponibles:</span>
                                <span className="font-semibold text-gray-600">{totalAvailable}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total números:</span>
                                <span className="font-semibold">{raffle.totalNumbers}</span>
                            </div>
                            {/* <hr className="my-2" />
                            <div className="flex justify-between">
                                <span className="text-gray-600">Recaudado:</span>
                                <span className="font-semibold text-green-600">{formatMoney(totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Potencial: <span onClick={() => setShowPotential(!showPotential)}>{showPotential ? 'Ocultar' : 'Ver'}</span> </span>
                                <span className="font-semibold text-blue-600">{showPotential && formatMoney(potentialRevenue)}</span>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div >

            {/* Lista de números */}
            < div className="bg-white rounded-lg shadow-md p-6" >
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
                        <div className="flex flex-wrap gap-4 justify-center">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                                <span className="text-sm text-gray-600">Pagado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                                <span className="text-sm text-gray-600">Pendiente</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                                <span className="text-sm text-gray-600">Disponible</span>
                            </div>
                        </div>

                        {/* Campo de búsqueda */}
                        <div className="w-full max-w-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar por número o nombre de cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {searchTerm && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Mostrando {filteredNumbers.length} de {numbers.length} números
                                </p>
                            )}
                        </div>

                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {filteredNumbers.length === 0 ? (
                        <div className="col-span-2 text-center py-8">
                            <p className="text-gray-500 text-lg">No se encontraron números que coincidan con &ldquo;{searchTerm}&rdquo;</p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                                Limpiar búsqueda
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Primera columna: números del 1 al 50 */}
                            <div className="">
                                {filteredNumbers.slice(0, Math.ceil(filteredNumbers.length / 2)).map(number => {
                            const ticket = occupiedNumbers.get(number);
                            const isOccupied = !!ticket;

                            // Calcular el total pagado real basado en todos los pagos
                            let realTotalPaid = 0;
                            let realIsPaid = false;
                            if (ticket && ticket.payments) {
                                realTotalPaid = ticket.payments.reduce((sum, payment) => sum + payment.amount, 0);
                                realIsPaid = realTotalPaid >= raffle.ticketPrice;
                            }

                            return (
                                <div
                                    key={number}
                                    className={`
                                        text-xs flex items-center justify-between transition-colors
                                        ${isOccupied
                                            ? realIsPaid
                                                ? 'bg-green-50 text-green-800'
                                                : 'bg-yellow-50 text-yellow-800'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center bg-yellow-300">
                                            <span className="font-bold text-xs">{formatNumber(number)}</span>
                                        </div>
                                        <div className="flex-1">
                                            {isOccupied ? (
                                                <div>
                                                    <div className="font-semibold">{ticket.client}</div>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 italic text-xs">Disponible</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        {isOccupied ? (
                                            <div className="flex items-center gap-2">
                                                <div className="text-right mr-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs">
                                                            {realIsPaid ? '✓' : '⏳'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleEditTicket(ticket)}
                                                    className="bg-blue-500 text-center rounded-md hover:bg-blue-600 transition-colors text-xm"
                                                >
                                                    ✏️
                                                </button>
                                                {!realIsPaid && (
                                                    <button
                                                        onClick={() => handleAddPayment(ticket)}
                                                        className="bg-green-500 text-center rounded-md hover:bg-green-600 transition-colors text-xm"
                                                    >
                                                        💵
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteTicket(ticket)}
                                                    className="bg-red-500 text-center rounded-md hover:bg-red-600 transition-colors text-xm"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket({ number, raffleId: raffle.id, client: '', totalPaid: 0, isPaid: false } as RaffleTicket);
                                                        setShowTicketForm(true);
                                                    }}
                                                    className="bg-blue-500 text-white rounded-md transition-colors text-xm"
                                                >
                                                    ✏️
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Segunda columna: números del 51 en adelante */}
                    <div className="">
                        {filteredNumbers.slice(Math.ceil(filteredNumbers.length / 2)).map(number => {
                            const ticket = occupiedNumbers.get(number);
                            const isOccupied = !!ticket;

                            // Calcular el total pagado real basado en todos los pagos
                            let realTotalPaid = 0;
                            let realIsPaid = false;
                            if (ticket && ticket.payments) {
                                realTotalPaid = ticket.payments.reduce((sum, payment) => sum + payment.amount, 0);
                                realIsPaid = realTotalPaid >= raffle.ticketPrice;
                            }

                            return (
                                <div
                                    key={number}
                                    className={`
                                        text-xs flex items-center justify-between transition-colors
                                        ${isOccupied
                                            ? realIsPaid
                                                ? 'bg-green-50 border-green-200 text-green-800'
                                                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center bg-yellow-300">
                                            <span className="font-bold text-xs">{formatNumber(number)}</span>
                                        </div>
                                        <div className="flex-1">
                                            {isOccupied ? (
                                                <div>
                                                    <div className="font-semibold">{ticket.client}</div>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 italic text-xs">Disponible</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isOccupied ? (
                                            <div className="flex items-center gap-2">
                                                <div className="text-right mr-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs">
                                                            {realIsPaid ? '✓' : '⏳'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleEditTicket(ticket)}
                                                    className="bg-blue-500 text-center rounded-md hover:bg-blue-600 transition-colors text-xm"
                                                >
                                                    ✏️
                                                </button>
                                                {!realIsPaid && (
                                                    <button
                                                        onClick={() => handleAddPayment(ticket)}
                                                        className="bg-green-500 text-center rounded-md hover:bg-green-600 transition-colors text-xm"
                                                    >
                                                        💵
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteTicket(ticket)}
                                                    className="bg-red-500 text-center rounded-md hover:bg-red-600 transition-colors text-xm"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket({ number, raffleId: raffle.id, client: '', totalPaid: 0, isPaid: false } as RaffleTicket);
                                                        setShowTicketForm(true);
                                                    }}
                                                    className="bg-blue-500 text-white rounded-md transition-colors text-xm"
                                                >
                                                    ✏️
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                        </>
                    )}
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
            </ div>

            {/* Modal para RaffleTicketForm */}
            {
                showTicketForm && (
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
                )
            }

            {/* Modal para RaffleTicketPaymentForm */}
            {
                showPaymentForm && selectedTicket && (
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
                )
            }
        </div >
    );
}
