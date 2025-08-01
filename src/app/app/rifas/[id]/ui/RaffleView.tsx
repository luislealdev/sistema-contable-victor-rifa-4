'use client';
import { Raffle, RaffleTicket, RaffleTicketPayment, PreRaffle } from "@prisma/client"
import { FC, useState } from "react"
import Link from "next/link"
import RaffleTicketForm from "@/components/forms/RaffleTicket"
import RaffleTicketPaymentForm from "@/components/forms/RaffleTicketPaymentForm"
import PreRaffleForm from "@/components/forms/PreRaffleForm"
import PreRafflesTable from "@/components/raffle/PreRafflesTable"

interface Props {
    raffle: Raffle & {
        tickets: (RaffleTicket & {
            payments: RaffleTicketPayment[],
            client: {
                id: number
                name: string
                clientAlias?: string
            }
        })[],
        PreRaffle: PreRaffle[]
    } | null
}

export const RaffleView: FC<Props> = ({ raffle }) => {
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [showPreRaffleForm, setShowPreRaffleForm] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<RaffleTicket | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<RaffleTicketPayment | null>(null);
    const [selectedPreRaffle, setSelectedPreRaffle] = useState<PreRaffle | null>(null);
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
    const occupiedNumbers = new Map<number, RaffleTicket & {
        payments: RaffleTicketPayment[], client: {
            id: number
            name: string
        }
    }>();
    raffle.tickets.forEach(ticket => {
        occupiedNumbers.set(ticket.number, ticket);
    });

    // Generar array de números del 1 al totalNumbers
    const numbers = Array.from({ length: raffle.totalNumbers }, (_, i) => i);

    // Obtener números disponibles
    const availableNumbers = numbers.filter(num => !occupiedNumbers.has(num));

    // Función para formatear número con cero inicial si es necesario
    const formatNumber = (num: number): string => {
        return num < 10 ? `0${num}` : num.toString();
    };

    // Función para truncar nombres largos
    const truncateName = (name: string, maxLength: number = 12): string => {
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength) + '..';
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
        if (ticket && ticket.client.name.toLowerCase().includes(searchLower)) return true;

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

    const handleCloseModals = () => {
        setShowTicketForm(false);
        setShowPaymentForm(false);
        setShowPreRaffleForm(false);
        setSelectedTicket(null);
        setSelectedPayment(null);
        setSelectedPreRaffle(null);
    };

    // Calcular estadísticas basadas en pagos reales
    const totalSold = raffle.tickets.length; // Boletos vendidos (asignados a clientes)
    const totalAvailable = raffle.totalNumbers - totalSold; // Boletos disponibles (sin vender)

    // Calcular montos reales
    const totalRecaudado = raffle.tickets.reduce((sum, ticket) => {
        // const ticketPayments = ticket.payments?.reduce((paymentSum, payment) => paymentSum + payment.amount, 0) || 0;
        return sum + ticket.totalPaid;
    }, 0);

    // Calcular restante por recaudar (boletos vendidos pero no pagados completamente)
    const restantePorRecaudar = raffle.tickets.reduce((sum, ticket) => {
        // const ticketPayments = ticket.payments?.reduce((paymentSum, payment) => paymentSum + payment.amount, 0) || 0;
        const pendiente = raffle.ticketPrice - ticket.totalPaid;
        return sum + (pendiente > 0 ? pendiente : 0);
    }, 0);

    // Calcular restante de venta (boletos no vendidos × precio)
    const restanteDeVenta = totalAvailable * raffle.ticketPrice;

    // Calcular potencial total
    const potencialTotal = raffle.ticketPrice * raffle.totalNumbers;

    return (
        <div className="container mx-auto p-4 md:p-6">
            {/* Botón de volver */}
            <div className="mb-4">
                <Link
                    href="/app/rifas"
                    className="inline-flex items-center px-4 py-2 text-13 font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-13 font-medium bg-red-100 text-red-800">
                                    Terminada
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-13 text-gray-600">Fecha del sorteo</p>
                                <p className="text-lg font-semibold text-gray-800">{formatDate(raffle.drawDate)}</p>
                            </div>
                            <div>
                                <p className="text-13 text-gray-600">Precio por boleto</p>
                                <p className="text-lg font-semibold text-green-600">{formatMoney(raffle.ticketPrice)}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-13 text-gray-600 mb-2">Premio</p>
                            <p className="text-gray-800 bg-gray-50 p-3 rounded-md">{raffle.prize}</p>
                        </div>
                    </div>

                    {/* Estadísticas */}
                    <div className="bg-gray-50 rounded-lg p-4 min-w-64">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Estadísticas</h3>
                        <div className="space-y-2">
                            {/* Boletos */}
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

                            <hr className="my-2" />

                            {/* Montos */}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Recaudado:</span>
                                <span className="font-semibold text-green-600">{formatMoney(totalRecaudado)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Por recaudar:</span>
                                <span className="font-semibold text-orange-600">{formatMoney(restantePorRecaudar)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Restante venta:</span>
                                <span className="font-semibold text-red-600">{formatMoney(restanteDeVenta)}</span>
                            </div>

                            <hr className="my-2" />

                            <div className="flex justify-between">
                                <span className="text-gray-600">Potencial total:</span>
                                <span className="font-semibold text-purple-600">{formatMoney(potencialTotal)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div >

            {/* Sección de Pre-Rifas */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Pre-Rifas</h2>
                    <button
                        onClick={() => {
                            setSelectedPreRaffle(null);
                            setShowPreRaffleForm(true);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                        + Nueva Pre-Rifa
                    </button>
                </div>

                <PreRafflesTable
                    preRaffles={raffle.PreRaffle}
                    onEdit={(preRaffle) => {
                        setSelectedPreRaffle(preRaffle);
                        setShowPreRaffleForm(true);
                    }}
                    onRefresh={() => window.location.reload()}
                />
            </div>

            {/* Lista de números */}
            < div className="bg-white rounded-lg shadow-md" >
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
                                <span className="text-13 text-gray-600">Pagado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                                <span className="text-13 text-gray-600">Pendiente</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                                <span className="text-13 text-gray-600">Disponible</span>
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
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-13 "
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

                <div className="grid grid-cols-2 gap-4" style={{ lineHeight: '1' }}>
                    {filteredNumbers.length === 0 ? (
                        <div className="col-span-2 text-center py-8">
                            <p className="text-gray-500 text-lg">No se encontraron números que coincidan con &ldquo;{searchTerm}&rdquo;</p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-13 underline"
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
                                        realIsPaid = realTotalPaid >= raffle.ticketPrice || ticket.totalPaid >= raffle.ticketPrice;
                                    }

                                    return (
                                        <div
                                            key={number}
                                            className={`
                                                border-2 border-black text-13 flex items-center justify-between transition-colors
                                        ${isOccupied
                                                    ? realIsPaid
                                                        ? 'bg-yellow-300  text-yellow-800'
                                                        : ' text-black-800'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                }
                                    `}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center justify-center bg-yellow-300 ">
                                                    <span className="font-bold text-13 ">{formatNumber(number)}</span>
                                                </div>
                                                <div className="flex-1">
                                                    {isOccupied ? (
                                                        <div>
                                                            <div className="font-semibold text-13 text-black" title={ticket.client.name}>
                                                                {ticket.clientAlias ? truncateName(ticket.clientAlias) : truncateName(ticket.client.name)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-500 italic text-13 ">Disponible</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                {isOccupied ? (
                                                    <div className="flex items-center">
                                                        <span className="text-13 mr-1">
                                                            {ticket.totalPaid}
                                                        </span>
                                                        <button
                                                            onClick={() => handleEditTicket(ticket)}
                                                            className="text-center text-13 "
                                                        >
                                                            ✏️
                                                        </button>
                                                        {!realIsPaid && (
                                                            <button
                                                                onClick={() => handleAddPayment(ticket)}
                                                                className="text-center text-13 "
                                                            >
                                                                💵
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTicket({ number, raffleId: raffle.id, totalPaid: 0, isPaid: false } as RaffleTicket);
                                                                setShowTicketForm(true);
                                                            }}
                                                            className=" text-white rounded-md transition-colors text-13 "
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
                                        realIsPaid = realTotalPaid >= raffle.ticketPrice || ticket.totalPaid >= raffle.ticketPrice;
                                    }

                                    return (
                                        <div
                                            key={number}
                                            className={`border-2 border-black text-13 flex items-center justify-between transition-colors
                                        ${isOccupied
                                                    ? realIsPaid
                                                        ? 'bg-yellow-300 text-yellow-800'
                                                        : ' text-black-800'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                }
                                    `}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center justify-center bg-yellow-300 ">
                                                    <span className="font-bold text-13 ">{formatNumber(number)}</span>
                                                </div>
                                                <div className="flex-1">
                                                    {isOccupied ? (
                                                        <div>
                                                            <div className="font-semibold text-black" title={ticket.client.name}>
                                                                {ticket.clientAlias ? truncateName(ticket.clientAlias) : truncateName(ticket.client.name)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-500 italic text-13 ">Disponible</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                {isOccupied ? (
                                                    <div className="flex items-center">
                                                        <span className="text-13 mr-1">
                                                            {ticket.totalPaid}
                                                        </span>
                                                        <button
                                                            onClick={() => handleEditTicket(ticket)}
                                                            className="text-center text-13 "
                                                        >
                                                            ✏️
                                                        </button>
                                                        {!realIsPaid && (
                                                            <button
                                                                onClick={() => handleAddPayment(ticket)}
                                                                className="text-center text-13 "
                                                            >
                                                                💵
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTicket({ number, raffleId: raffle.id, totalPaid: 0, isPaid: false } as RaffleTicket);
                                                                setShowTicketForm(true);
                                                            }}
                                                            className="text-white rounded-md transition-colors text-13 "
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
                <p className="text-center text-13 ">RIFAS EL TORITO 100% GARANTÍA</p>

                {/* Leyenda adicional                 */}
                {/* <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-13 font-semibold text-gray-800 mb-2">Leyenda</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-13 text-gray-600">
                        <div className="flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Pagado completamente</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-600">⏳</span>
                            <span>Pendiente de pago</span>
                        </div>
                    </div>
                </div> */}

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
                                    // const realTotalPaid = fullTicket?.payments?.reduce((sum: number, payment: RaffleTicketPayment) => sum + payment.amount, 0) || 0;
                                    return (
                                        <RaffleTicketPaymentForm
                                            payment={selectedPayment}
                                            ticketId={selectedTicket.id}
                                            ticketNumber={selectedTicket.number}
                                            // clientName={selectedTicket.client.name}
                                            ticketPrice={raffle.ticketPrice}
                                            totalPaid={fullTicket!.totalPaid}
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

            {/* Modal para PreRaffleForm */}
            {showPreRaffleForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4">
                            <PreRaffleForm
                                raffleId={raffle.id}
                                preRaffle={selectedPreRaffle}
                                onSuccess={handleCloseModals}
                                onCancel={handleCloseModals}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
