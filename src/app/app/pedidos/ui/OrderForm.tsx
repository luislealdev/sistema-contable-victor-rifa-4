'use client';

import { createUpdateOrder } from '@/actions/order/create-update-order';
import { Order, OrderItem } from '@prisma/client';
import React, { useState, useEffect } from 'react';

interface Props {
    order?: Order & { OrderItem?: OrderItem[] } | null;
    onClose: () => void;
    onRefresh: () => void;
}

export const OrderForm: React.FC<Props> = ({ order, onClose, onRefresh }) => {
    const [formData, setFormData] = useState({
        id: order?.id || undefined,
        client: order?.client || '',
        product: order?.product || '',
        specifications: order?.specifications || '',
        // Mantener estos campos para compatibilidad
        gender: order?.gender || '',
        number: order?.number || '',
        // Nuevo array de items por género, usando el nombre que espera el modelo de Prisma
        OrderItem: [] as {
            id?: number;
            gender: string;
            number: string;
        }[]
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inicializar los items basados en OrderItems si existen o en los campos legados
    useEffect(() => {
        if (order) {
            if (order.OrderItem && order.OrderItem.length > 0) {
                // Si tiene OrderItems, usamos esos
                setFormData(prev => ({
                    ...prev,
                    OrderItem: order.OrderItem!.map(item => ({
                        id: item.id,
                        gender: item.gender || '',
                        number: item.number || ''
                    }))
                }));
            } else if (order.gender && order.number) {
                // Si no tiene OrderItems pero tiene los campos antiguos, creamos un item
                setFormData(prev => ({
                    ...prev,
                    OrderItem: [{
                        gender: order.gender || '',
                        number: order.number || ''
                    }]
                }));
            }
        }
    }, [order]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar que al menos exista un item
        if (formData.OrderItem.length === 0) {
            alert('Debe agregar al menos una talla');
            return;
        }

        // Validar que todos los géneros estén seleccionados
        if (formData.OrderItem.some(item => !item.gender)) {
            alert('Todos los géneros deben estar seleccionados');
            return;
        }

        setIsSubmitting(true);

        try {
            // Preparar datos para compatibilidad con el modelo anterior
            const dataToSend = {
                ...formData,
                // Si solo hay un item, usar sus valores para mantener compatibilidad
                gender: formData.OrderItem.length === 1 ? formData.OrderItem[0].gender : formData.gender,
                number: formData.OrderItem.length === 1 ? formData.OrderItem[0].number : formData.number,
                // Los OrderItems ya están incluidos en formData
            };

            const result = await createUpdateOrder(dataToSend);
            if (result.ok) {
                onRefresh();
                onClose();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error al procesar la orden:', error);
            alert('Error al procesar la orden');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
                {order ? `Editar Orden - Línea ${order.id}` : 'Nueva Orden'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cliente *
                    </label>
                    <input
                        type="text"
                        value={formData.client}
                        onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        maxLength={100}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Producto
                    </label>
                    <input
                        type="text"
                        value={formData.product}
                        onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={100}
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                            Tallas por Género
                        </label>
                        <button
                            type="button"
                            onClick={() => setFormData({
                                ...formData,
                                OrderItem: [...formData.OrderItem, { gender: '', number: '' }]
                            })}
                            className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            + Agregar Talla
                        </button>
                    </div>

                    {formData.OrderItem.length === 0 ? (
                        <div className="text-center py-3 text-gray-500 text-sm border border-dashed border-gray-300 rounded-md">
                            No hay tallas agregadas. Haga clic en &quot;Agregar Talla&quot;.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {formData.OrderItem.map((item, index) => (
                                <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md bg-gray-50">
                                    <div className="w-1/2">
                                        <select
                                            value={item.gender}
                                            onChange={(e) => {
                                                const newItems = [...formData.OrderItem];
                                                newItems[index].gender = e.target.value;
                                                setFormData({ ...formData, OrderItem: newItems });
                                            }}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                            required
                                        >
                                            <option value="">Género</option>
                                            <option value="hombre">Hombre (H)</option>
                                            <option value="mujer">Mujer (M)</option>
                                            <option value="niño">Niño (N)</option>
                                            <option value="niña">Niña (N)</option>
                                        </select>
                                    </div>

                                    <div className="w-1/3">
                                        <input
                                            type="text"
                                            value={item.number}
                                            onChange={(e) => {
                                                const newItems = [...formData.OrderItem];
                                                newItems[index].number = e.target.value;
                                                setFormData({ ...formData, OrderItem: newItems });
                                            }}
                                            placeholder="Talla"
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newItems = formData.OrderItem.filter((_, i) => i !== index);
                                            setFormData({ ...formData, OrderItem: newItems });
                                        }}
                                        className="p-1 text-red-500 hover:text-red-700"
                                        title="Eliminar"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Campo legado de género y número para compatibilidad */}
                    <div className="hidden">
                        <input type="hidden" value={formData.gender} />
                        <input type="hidden" value={formData.number} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Especificaciones
                    </label>
                    <textarea
                        value={formData.specifications}
                        onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={500}
                        rows={3}
                    ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
};
