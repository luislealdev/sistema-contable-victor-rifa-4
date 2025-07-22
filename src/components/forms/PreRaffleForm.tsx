'use client';

import { createUpdatePreRaffle } from "@/actions/raffles/create-update-preraffle";
import { PreRaffle } from "@prisma/client";
import { FC, useState } from "react";

interface Props {
    raffleId: number;
    preRaffle?: PreRaffle | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const PreRaffleForm: FC<Props> = ({ raffleId, preRaffle, onSuccess, onCancel }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: preRaffle?.title || '',
        drawDate: preRaffle?.drawDate ? 
            new Date(preRaffle.drawDate.getTime() - preRaffle.drawDate.getTimezoneOffset() * 60000)
                .toISOString().split('T')[0] : '',
        prize: preRaffle?.prize || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.drawDate || !formData.prize.trim()) {
            alert('Por favor complete todos los campos');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const preRaffleData = {
                id: preRaffle?.id,
                raffleId,
                title: formData.title.trim(),
                drawDate: new Date(formData.drawDate + 'T12:00:00'),
                prize: formData.prize.trim()
            };

            const result = await createUpdatePreRaffle(preRaffleData);
            
            if (result.ok) {
                alert(result.message);
                onSuccess();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error al guardar pre-rifa:', error);
            alert('Error al guardar la pre-rifa');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                    {preRaffle ? 'Editar Pre-Rifa' : 'Nueva Pre-Rifa'}
                </h2>
                <button
                    onClick={onCancel}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                    disabled={isSubmitting}
                >
                    ✕
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Título */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Título de la Pre-Rifa *
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Pre-Rifa Navideña"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                {/* Fecha de Sorteo */}
                <div>
                    <label htmlFor="drawDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de Sorteo *
                    </label>
                    <input
                        type="date"
                        id="drawDate"
                        value={formData.drawDate}
                        onChange={(e) => handleInputChange('drawDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                {/* Premio */}
                <div>
                    <label htmlFor="prize" className="block text-sm font-medium text-gray-700 mb-1">
                        Premio *
                    </label>
                    <textarea
                        id="prize"
                        value={formData.prize}
                        onChange={(e) => handleInputChange('prize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe el premio de la pre-rifa"
                        rows={3}
                        required
                        disabled={isSubmitting}
                    />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Guardando...' : (preRaffle ? 'Actualizar' : 'Crear')} Pre-Rifa
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PreRaffleForm;
