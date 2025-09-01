'use client';

import { deleteOrder } from '@/actions/order/delete-order';
import { Order } from '@prisma/client';
import React, { useState } from 'react';
import { OrderForm } from './OrderForm';

interface Props {
    orders: Order[];
    onRefresh: () => void;
}

export const OrdersTable: React.FC<Props> = ({ orders, onRefresh }) => {
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Crear mapa de órdenes por ID
    const ordersMap = new Map<number, Order>();
    orders.forEach(order => {
        ordersMap.set(order.id, order);
    });

    // Generar array de números del 1 al 75
    const numbers = Array.from({ length: 75 }, (_, i) => i + 1);

    // Función para formatear número con cero inicial si es necesario
    const formatNumber = (num: number): string => {
        return num < 10 ? `0${num}` : num.toString();
    };

    // Función para truncar texto largo
    const truncateText = (text: string, maxLength: number = 8): string => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '..';
    };

    // Función para filtrar números basado en el término de búsqueda
    const filteredNumbers = numbers.filter(number => {
        if (!searchTerm.trim()) return true;

        const order = ordersMap.get(number);
        const numberStr = formatNumber(number);
        const searchLower = searchTerm.toLowerCase();

        // Buscar por número
        if (numberStr.includes(searchLower)) return true;

        // Buscar por cliente si existe
        if (order && order.client.toLowerCase().includes(searchLower)) return true;

        // Buscar por género si existe
        if (order && order.gender?.toLowerCase().includes(searchLower)) return true;

        // Buscar por producto si existe
        if (order && order.product?.toLowerCase().includes(searchLower)) return true;

        return false;
    });

    const handleCreateOrder = (id: number) => {
        setSelectedOrder({ id, client: '', gender: null, product: null });
        setShowOrderForm(true);
    };

    const handleEditOrder = (order: Order) => {
        setSelectedOrder(order);
        setShowOrderForm(true);
    };

    const handleDeleteOrder = async (id: number) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
            const result = await deleteOrder(id);
            if (result.ok) {
                // onRefresh();
            } else {
                alert(result.message);
            }
        }
    };

    const handleCloseModal = () => {
        setShowOrderForm(false);
        setSelectedOrder(null);
    };

    return (
        <div className="bg-white rounded-lg shadow-md">
            {/* Header con controles */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 p-4">
                <div className="flex flex-col items-center gap-4 mt-2 sm:mt-0">
                    <h2 className="text-xl font-bold text-gray-800">Órdenes (1-75)</h2>

                    {/* Estadísticas compactas */}
                    <div className="flex flex-wrap gap-4 justify-center text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                            <span className="text-gray-600">Con orden ({orders.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                            <span className="text-gray-600">Disponible ({75 - orders.length})</span>
                        </div>
                    </div>

                    {/* Campo de búsqueda */}
                    <div className="w-full max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar por número, cliente, género..."
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

            {/* Grid de números en dos columnas */}
            <div className="ga" style={{ lineHeight: '1' }}>
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
                        {/* Primera columna: números del 1 al 38 */}
                        <div className="">
                            {filteredNumbers.slice(0, Math.ceil(filteredNumbers.length / 2)).map(number => {
                                const order = ordersMap.get(number);
                                const isOccupied = !!order;

                                return (
                                    <div
                                        key={number}
                                        onClick={() => isOccupied ? handleEditOrder(order) : handleCreateOrder(number)}
                                        className={`
                                            border-1 border-black text-xs flex items-center justify-between transition-colors cursor-pointer  
                                            ${isOccupied
                                                ? 'bg-green-100 hover:bg-green-200'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center ga flex-1 min-w-0">
                                            <div className="flex items-center justify-center bg-yellow-300 w-6 rounded text-xs font-bold">
                                                {formatNumber(number)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {isOccupied ? (
                                                    <div className="space-y-0.5">
                                                        <div className="text-xs font-medium truncate">
                                                            {truncateText(order.client, 8)}
                                                        </div>
                                                        <div className="flex ga text-xs">
                                                            <span className="text-gray-600 truncate">
                                                                {order.gender || 'N/A'}
                                                            </span>
                                                            <span className="text-gray-400">|</span>
                                                            <span className="text-gray-600 truncate">
                                                                {truncateText(order.product || 'N/A', 6)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-500">
                                                        Disponible
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center ml-1">
                                            {isOccupied ? (
                                                <div className="flex items-center ga">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteOrder(order.id);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 p-0.5"
                                                        title="Eliminar"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-green-500">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Segunda columna: números del 39 al 75 */}
                        <div className="">
                            {filteredNumbers.slice(Math.ceil(filteredNumbers.length / 2)).map(number => {
                                const order = ordersMap.get(number);
                                const isOccupied = !!order;

                                return (
                                    <div
                                        key={number}
                                        onClick={() => isOccupied ? handleEditOrder(order) : handleCreateOrder(number)}
                                        className={`
                                            border-1 border-black text-xs flex items-center justify-between transition-colors cursor-pointer  
                                            ${isOccupied
                                                ? 'bg-green-100 hover:bg-green-200'
                                                : 'bg-gray-50 hover:bg-gray-100'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center ga flex-1 min-w-0">
                                            <div className="flex items-center justify-center bg-yellow-300 w-6  rounded text-xs font-bold">
                                                {formatNumber(number)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {isOccupied ? (
                                                    <div className="">
                                                        <div className="text-xs font-medium truncate">
                                                            {truncateText(order.client, 8)}
                                                        </div>
                                                        <div className="flex ga text-xs">
                                                            <span className="text-gray-600 truncate">
                                                                {order.gender || 'N/A'}
                                                            </span>
                                                            <span className="text-gray-400">|</span>
                                                            <span className="text-gray-600 truncate">
                                                                {truncateText(order.product || 'N/A', 6)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-500">
                                                        Disponible
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center ml-1">
                                            {isOccupied ? (
                                                <div className="flex items-center ga">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteOrder(order.id);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 p-0.5"
                                                        title="Eliminar"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-green-500">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
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

            <p className="text-center text-xs p-2">SISTEMA DE ÓRDENES VICTOR</p>

            {/* Modal para OrderForm */}
            {showOrderForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <OrderForm
                        order={selectedOrder}
                        onClose={handleCloseModal}
                        onRefresh={() => {
                            onRefresh();
                            handleCloseModal();
                        }}
                    />
                </div>
            )}
        </div>
    );
};
