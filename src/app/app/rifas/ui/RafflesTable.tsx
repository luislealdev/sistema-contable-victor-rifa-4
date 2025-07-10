'use client'

import { Raffle } from '@prisma/client'
import React, { FC, useState } from 'react'
import RaffleForm from '@/components/forms/RaffleForm'
import { deleteRaffle } from '@/actions/raffles/delete-raffle'
import { useRouter } from 'next/navigation'

interface Props {
    raffles: Raffle[]
}

export const RafflesTable: FC<Props> = ({ raffles }) => {
    const [showRaffleForm, setShowRaffleForm] = useState(false);
    const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    // Calcular potencial de recaudación
    const calculatePotentialRevenue = (ticketPrice: number, totalNumbers: number) => {
        return ticketPrice * totalNumbers;
    };

    // Verificar si la rifa ha pasado su fecha de sorteo
    const isRaffleExpired = (drawDate: Date) => {
        const today = new Date();
        const adjustedDrawDate = new Date(drawDate.getTime() + drawDate.getTimezoneOffset() * 60000);
        return adjustedDrawDate < today;
    };

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

    // Manejar nueva rifa
    const handleNewRaffle = () => {
        setEditingRaffle(null);
        setShowRaffleForm(true);
    };

    // Manejar editar rifa
    const handleEditRaffle = (raffle: Raffle) => {
        setEditingRaffle(raffle);
        setShowRaffleForm(true);
    };

    // Manejar éxito del formulario
    const handleRaffleFormSuccess = () => {
        setShowRaffleForm(false);
        setEditingRaffle(null);
        window.location.reload();
    };

    // Manejar cancelar formulario
    const handleRaffleFormCancel = () => {
        setShowRaffleForm(false);
        setEditingRaffle(null);
    };

    // Manejar eliminar rifa
    const handleDeleteRaffle = async (raffleId: number, raffleTitle: string) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar la rifa "${raffleTitle}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deleteRaffle(raffleId);
            if (result.ok) {
                alert(result.message);
                window.location.reload();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error al eliminar rifa:', error);
            alert('Error al eliminar la rifa');
        } finally {
            setIsDeleting(false);
        }
    };

    // Mostrar formulario si está activo
    if (showRaffleForm) {
        return (
            <div className="container mx-auto p-6">
                <RaffleForm
                    raffle={editingRaffle}
                    onSuccess={handleRaffleFormSuccess}
                    onCancel={handleRaffleFormCancel}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Gestión de Rifas</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Total de rifas: {raffles.length}
                    </p>
                </div>
                <button
                    onClick={handleNewRaffle}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    + Nueva Rifa
                </button>
            </div>

            {/* Tabla */}
            {raffles.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-500 text-lg">No hay rifas registradas</p>
                    <button
                        onClick={handleNewRaffle}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Crear Primera Rifa
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Vista móvil */}
                    <div className="block md:hidden">
                        {raffles.map((raffle) => (
                            <div
                                key={raffle.id}
                                className="border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-50"
                                onClick={() => router.push(`/app/rifas/${raffle.id}`)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600">{raffle.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-gray-600">Sorteo: {formatDate(raffle.drawDate)}</p>
                                            {isRaffleExpired(raffle.drawDate) && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Terminada
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 ml-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditRaffle(raffle);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                                            disabled={isDeleting}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteRaffle(raffle.id, raffle.title);
                                            }}
                                            className="text-red-600 hover:text-red-900 transition-colors p-1"
                                            disabled={isDeleting}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-600">Precio:</span>
                                        <div className="font-medium text-green-600">{formatMoney(raffle.ticketPrice)}</div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Total números:</span>
                                        <div className="font-medium">{raffle.totalNumbers}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-600">Potencial:</span>
                                        <div className="font-medium text-blue-600">{formatMoney(calculatePotentialRevenue(raffle.ticketPrice, raffle.totalNumbers))}</div>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <span className="text-gray-600 text-sm">Premio:</span>
                                    <p className="text-sm text-gray-800 truncate">{raffle.prize}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Vista escritorio */}
                    <div className="hidden md:block">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Título
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha Sorteo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Precio
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Números
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Potencial
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Premio
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {raffles.map((raffle) => (
                                    <tr
                                        key={raffle.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => router.push(`/app/rifas/${raffle.id}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                                {raffle.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm text-gray-900">{formatDate(raffle.drawDate)}</div>
                                                {isRaffleExpired(raffle.drawDate) && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Terminada
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-green-600">{formatMoney(raffle.ticketPrice)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{raffle.totalNumbers}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-blue-600">{formatMoney(calculatePotentialRevenue(raffle.ticketPrice, raffle.totalNumbers))}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 truncate max-w-xs" title={raffle.prize}>
                                                {raffle.prize}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditRaffle(raffle);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    disabled={isDeleting}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteRaffle(raffle.id, raffle.title);
                                                    }}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
