'use client';
import { Raffle } from "@prisma/client";
import { FC } from "react";

interface Props {
    raffle: Raffle;
    totalSold: number;
    totalAvailable: number;
}

export const RaffleHeader: FC<Props> = ({ raffle, totalSold, totalAvailable }) => {
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

    return (
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
                    </div>
                </div>
            </div>
        </div>
    );
};
