'use client';
import { RaffleTicket, RaffleTicketPayment } from "@prisma/client";
import { FC } from "react";
import { RaffleNumberItem } from "./RaffleNumberItem";

interface Props {
    filteredNumbers: number[];
    occupiedNumbers: Map<number, RaffleTicket & { payments: RaffleTicketPayment[], client: { id: number, name: string } }>;
    rafflePrice: number;
    searchTerm: string;
    onEditTicket: (ticket: RaffleTicket) => void;
    onAddPayment: (ticket: RaffleTicket) => void;
    onDeleteTicket: (ticket: RaffleTicket) => void;
    onCreateTicket: (number: number) => void;
    onClearSearch: () => void;
}

export const RaffleNumbersGrid: FC<Props> = ({
    filteredNumbers,
    occupiedNumbers,
    rafflePrice,
    searchTerm,
    onEditTicket,
    onAddPayment,
    onDeleteTicket,
    onCreateTicket,
    onClearSearch
}) => {
    if (filteredNumbers.length === 0) {
        return (
            <div className="col-span-2 text-center py-8">
                <p className="text-gray-500 text-lg">No se encontraron números que coincidan con &ldquo;{searchTerm}&rdquo;</p>
                <button
                    onClick={onClearSearch}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                >
                    Limpiar búsqueda
                </button>
            </div>
        );
    }

    const firstColumnNumbers = filteredNumbers.slice(0, Math.ceil(filteredNumbers.length / 2));
    const secondColumnNumbers = filteredNumbers.slice(Math.ceil(filteredNumbers.length / 2));

    return (
        <>
            {/* Primera columna */}
            <div className="">
                {firstColumnNumbers.map(number => (
                    <RaffleNumberItem
                        key={number}
                        number={number}
                        ticket={occupiedNumbers.get(number)}
                        rafflePrice={rafflePrice}
                        onEditTicket={onEditTicket}
                        onAddPayment={onAddPayment}
                        onDeleteTicket={onDeleteTicket}
                        onCreateTicket={onCreateTicket}
                    />
                ))}
            </div>

            {/* Segunda columna */}
            <div className="">
                {secondColumnNumbers.map(number => (
                    <RaffleNumberItem
                        key={number}
                        number={number}
                        ticket={occupiedNumbers.get(number)}
                        rafflePrice={rafflePrice}
                        onEditTicket={onEditTicket}
                        onAddPayment={onAddPayment}
                        onDeleteTicket={onDeleteTicket}
                        onCreateTicket={onCreateTicket}
                    />
                ))}
            </div>
        </>
    );
};
