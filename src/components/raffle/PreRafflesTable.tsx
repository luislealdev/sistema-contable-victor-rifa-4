'use client';

import { deletePreRaffle } from "@/actions/raffles/delete-preraffle";
import { PreRaffle } from "@prisma/client";
import { FC, useState } from "react";

interface Props {
    preRaffles: PreRaffle[];
    onEdit: (preRaffle: PreRaffle) => void;
    onRefresh: () => void;
}

const PreRafflesTable: FC<Props> = ({ preRaffles, onEdit, onRefresh }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    // Formatear fecha
    const formatDate = (date: Date) => {
        const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        return adjustedDate.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Manejar eliminar pre-rifa
    const handleDelete = async (preRaffle: PreRaffle) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar la pre-rifa "${preRaffle.title}"? Esta acción no se puede deshacer.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const result = await deletePreRaffle(preRaffle.id);
            if (result.ok) {
                alert(result.message);
                onRefresh();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error al eliminar pre-rifa:', error);
            alert('Error al eliminar la pre-rifa');
        } finally {
            setIsDeleting(false);
        }
    };

    if (preRaffles.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-600">No hay pre-rifas registradas para esta rifa.</p>
                <p className="text-sm text-gray-500 mt-1">Las pre-rifas aparecerán aquí una vez que las agregues.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Vista móvil */}
            <div className="block md:hidden">
                {preRaffles.map((preRaffle) => (
                    <div
                        key={preRaffle.id}
                        className="border-b border-gray-200 p-4"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 text-sm">{preRaffle.title}</h3>
                                <p className="text-xs text-gray-600 mt-1">
                                    Sorteo: {formatDate(preRaffle.drawDate)}
                                </p>
                            </div>
                            <div className="flex space-x-2 ml-2">
                                <button
                                    onClick={() => onEdit(preRaffle)}
                                    className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                                    disabled={isDeleting}
                                    title="Editar"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDelete(preRaffle)}
                                    className="text-red-600 hover:text-red-900 transition-colors p-1"
                                    disabled={isDeleting}
                                    title="Eliminar"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="text-gray-600 text-xs">Premio:</span>
                            <p className="text-xs text-gray-800">{preRaffle.prize}</p>
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
                                Premio
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {preRaffles.map((preRaffle) => (
                            <tr key={preRaffle.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {preRaffle.title}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {formatDate(preRaffle.drawDate)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                        {preRaffle.prize}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => onEdit(preRaffle)}
                                            className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                                            disabled={isDeleting}
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(preRaffle)}
                                            className="text-red-600 hover:text-red-900 transition-colors p-1"
                                            disabled={isDeleting}
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PreRafflesTable;
