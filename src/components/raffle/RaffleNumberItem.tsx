'use client';
import { RaffleTicket, RaffleTicketPayment } from "@prisma/client";
import { FC } from "react";

interface Props {
    number: number;
    ticket?: RaffleTicket & { payments: RaffleTicketPayment[], client: { id: number, name: string } };
    rafflePrice: number;
    onEditTicket: (ticket: RaffleTicket) => void;
    onAddPayment: (ticket: RaffleTicket) => void;
    onDeleteTicket: (ticket: RaffleTicket) => void;
    onCreateTicket: (number: number) => void;
}

export const RaffleNumberItem: FC<Props> = ({
    number,
    ticket,
    rafflePrice,
    onEditTicket,
    onAddPayment,
    onDeleteTicket,
    onCreateTicket
}) => {
    const isOccupied = !!ticket;

    // Función para formatear número con cero inicial si es necesario
    const formatNumber = (num: number): string => {
        return num < 10 ? `0${num}` : num.toString();
    };

    // Calcular el total pagado real basado en todos los pagos
    let realTotalPaid = 0;
    let realIsPaid = false;
    if (ticket && ticket.payments) {
        realTotalPaid = ticket.payments.reduce((sum, payment) => sum + payment.amount, 0);
        realIsPaid = realTotalPaid >= rafflePrice;
    }

    return (
        <div
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
                            <div className="font-semibold">{ticket.client.name}</div>
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
                            onClick={() => onEditTicket(ticket)}
                            className="bg-blue-500 text-center rounded-md hover:bg-blue-600 transition-colors text-xm"
                        >
                            ✏️
                        </button>
                        {!realIsPaid && (
                            <button
                                onClick={() => onAddPayment(ticket)}
                                className="bg-green-500 text-center rounded-md hover:bg-green-600 transition-colors text-xm"
                            >
                                💵
                            </button>
                        )}
                        <button
                            onClick={() => onDeleteTicket(ticket)}
                            className="bg-red-500 text-center rounded-md hover:bg-red-600 transition-colors text-xm"
                        >
                            🗑️
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onCreateTicket(number)}
                            className="bg-blue-500 text-white rounded-md transition-colors text-xm"
                        >
                            ✏️
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
