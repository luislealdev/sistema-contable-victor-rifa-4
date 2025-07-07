import { Raffle, RaffleTicket, RaffleTicketPayment } from "@prisma/client"
import { FC } from "react"
import Link from "next/link"

interface Props {
    raffle: Raffle & {
        tickets: (RaffleTicket & {
            payments: RaffleTicketPayment[]
        })[]
    } | null
}

export const RaffleView: FC<Props> = ({ raffle }) => {
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
    const occupiedNumbers = new Map<number, RaffleTicket & {  }>();
    raffle.tickets.forEach(ticket => {
        occupiedNumbers.set(ticket.number, ticket);
    });

    // Generar array de números del 1 al totalNumbers
    const numbers = Array.from({ length: raffle.totalNumbers }, (_, i) => i + 1);

    // Calcular estadísticas
    const totalSold = raffle.tickets.length;
    // const totalPaid = raffle.tickets.filter(ticket => ticket.isPaid).length;
    // const totalPending = raffle.tickets.filter(ticket => !ticket.isPaid).length;
    const totalAvailable = raffle.totalNumbers - totalSold;
    const totalRevenue = raffle.tickets.reduce((sum, ticket) => sum + ticket.totalPaid, 0);
    const potentialRevenue = raffle.ticketPrice * raffle.totalNumbers;

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
                            {/* <div className="flex justify-between">
                                <span className="text-gray-600">Pagados:</span>
                                <span className="font-semibold text-green-600">{totalPaid}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Pendientes:</span>
                                <span className="font-semibold text-yellow-600">{totalPending}</span>
                            </div> */}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Disponibles:</span>
                                <span className="font-semibold text-gray-600">{totalAvailable}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total números:</span>
                                <span className="font-semibold">{raffle.totalNumbers}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between">
                                <span className="text-gray-600">Recaudado:</span>
                                <span className="font-semibold text-green-600">{formatMoney(totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Potencial:</span>
                                <span className="font-semibold text-blue-600">{formatMoney(potentialRevenue)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cuadrícula de números */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Números de la Rifa</h2>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
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
                </div>

                <div className="space-y-2">
                    {numbers.map(number => {
                        const ticket = occupiedNumbers.get(number);
                        const isOccupied = !!ticket;
                        return (
                            <div
                                key={number}
                                className={`
                                    flex items-center justify-between p-3 rounded-lg border-2 transition-colors
                                    ${isOccupied
                                        ? ticket.isPaid
                                            ? 'bg-green-50 border-green-200 text-green-800'
                                            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-current">
                                        <span className="font-bold text-sm">{number}</span>
                                    </div>
                                    <div className="flex-1">
                                        {isOccupied ? (
                                            <div>
                                                <div className="font-semibold">{ticket.client}</div>
                                                <div className="text-sm opacity-75">Tel: {ticket.client}</div>
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 italic">Disponible</div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    {isOccupied ? (
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">
                                                    {ticket.isPaid ? '✓' : '⏳'}
                                                </span>
                                                <span className="font-semibold">
                                                    {ticket.isPaid ? 'Pagado' : 'Pendiente'}
                                                </span>
                                            </div>
                                            <div className="text-sm opacity-75">
                                                {formatMoney(ticket.totalPaid)} / {formatMoney(raffle.ticketPrice)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400">
                                            {formatMoney(raffle.ticketPrice)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
        </div>
    );
}
