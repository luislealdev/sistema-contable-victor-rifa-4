'use client';

import { deleteOrder } from '@/actions/order/delete-order';
import { Order, OrderItem } from '@prisma/client';
import React, { useState } from 'react';
import { OrderForm } from './OrderForm';

interface Props {
    orders: (Order & {
        OrderItem?: OrderItem[];
    })[];
}

export const OrdersTable: React.FC<Props> = ({ orders }) => {
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<(Order & { OrderItem?: OrderItem[] }) | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Crear mapa de órdenes por ID
    const ordersMap = new Map<number, Order & { OrderItem?: OrderItem[] }>();
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
    // const truncateText = (text: string, maxLength: number = 8): string => {
    //     if (text.length <= maxLength) return text;
    //     return text.substring(0, maxLength) + '..';
    // };

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
        setSelectedOrder({ 
            id, 
            client: '', 
            gender: null, 
            product: null, 
            number: null, 
            specifications: null, 
            totalAmount: null,
            OrderItem: []
        });
        setShowOrderForm(true);
    };

    const handleEditOrder = (order: Order) => {
        setSelectedOrder(order);
        setShowOrderForm(true);
    };

    const handleDeleteOrder = async (id: number) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
            await deleteOrder(id);
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

            {/* Header de la tabla */}
            <div className="px-4 mb-2">
                <div className="grid grid-cols-24 gap-1 text-xs font-bold text-gray-700 border-b border-gray-300 pb-1">
                    <div className="text-center col-span-2">#</div>
                    <div className="truncate col-span-8">Nombre</div>
                    <div className="truncate col-span-8">Producto</div>
                    <div className="text-center col-span-1.5 text-[10px]">H</div>
                    <div className="text-center col-span-1.5 text-[10px]">M</div>
                    <div className="text-center col-span-1.5 text-[10px]">N</div>
                    <div className="text-center col-span-1.5 text-[10px]">N</div>
                </div>
            </div>

            {/* Grid de números como tabla */}
            <div className="px-4" style={{ lineHeight: '1' }}>
                {filteredNumbers.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">No se encontraron números que coincidan con &ldquo;{searchTerm}&rdquo;</p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                            Limpiar búsqueda
                        </button>
                    </div>
                ) : (
                    <div className="">
                        {filteredNumbers.map(number => {
                            const order = ordersMap.get(number);
                            const isOccupied = !!order;

                            return (
                                <div
                                    key={number}
                                    className={`
                                        border border-black text-xs transition-colors cursor-pointer grid grid-cols-24 gap-1 items-center p-1 relative
                                        ${isOccupied
                                            ? 'bg-green-100 hover:bg-green-200'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                        }
                                    `}
                                    onClick={() => isOccupied ? handleEditOrder(order) : handleCreateOrder(number)}
                                >
                                    {/* Columna Línea */}
                                    <div className="text-center font-bold col-span-2">
                                        {formatNumber(number)}
                                    </div>

                                    {/* Columna Nombre */}
                                    <div className="font-medium col-span-8 truncate">
                                        {isOccupied ? order.client : '-'}
                                    </div>

                                    {/* Columna Producto */}
                                    <div className="col-span-8 truncate">
                                        {isOccupied ? order.product || '-' : '-'}
                                    </div>

                                    {/* Columna Hombre */}
                                    <div className="text-center col-span-1.5">
                                        {isOccupied ? (
                                            <>
                                                {/* Mostrar desde OrderItem si existe */}
                                                {order.OrderItem && order.OrderItem.some(item => item.gender === 'hombre') ? (
                                                    <span className="bg-blue-200 px-0.5 rounded font-bold text-[10px]">
                                                        {order.OrderItem.find(item => item.gender === 'hombre')?.number || '-'}
                                                    </span>
                                                ) : 
                                                /* Compatibilidad con formato antiguo */
                                                order.gender === 'hombre' ? (
                                                    <span className="bg-blue-200 px-0.5 rounded font-bold text-[10px]">
                                                        {order.number || '-'}
                                                    </span>
                                                ) : <span className="text-[10px]">-</span>}
                                            </>
                                        ) : <span className="text-[10px]">-</span>}
                                    </div>

                                    {/* Columna Dama */}
                                    <div className="text-center col-span-1.5">
                                        {isOccupied ? (
                                            <>
                                                {/* Mostrar desde OrderItem si existe */}
                                                {order.OrderItem && order.OrderItem.some(item => item.gender === 'mujer') ? (
                                                    <span className="bg-pink-200 px-0.5 rounded font-bold text-[10px]">
                                                        {order.OrderItem.find(item => item.gender === 'mujer')?.number || '-'}
                                                    </span>
                                                ) : 
                                                /* Compatibilidad con formato antiguo */
                                                order.gender === 'mujer' ? (
                                                    <span className="bg-pink-200 px-0.5 rounded font-bold text-[10px]">
                                                        {order.number || '-'}
                                                    </span>
                                                ) : <span className="text-[10px]">-</span>}
                                            </>
                                        ) : <span className="text-[10px]">-</span>}
                                    </div>

                                    {/* Columna Niño */}
                                    <div className="text-center col-span-1.5">
                                        {isOccupied ? (
                                            <>
                                                {/* Mostrar desde OrderItem si existe */}
                                                {order.OrderItem && order.OrderItem.some(item => item.gender === 'niño') ? (
                                                    <span className="bg-green-200 px-0.5 rounded font-bold text-[10px]">
                                                        {order.OrderItem.find(item => item.gender === 'niño')?.number || '-'}
                                                    </span>
                                                ) : 
                                                /* Compatibilidad con formato antiguo */
                                                order.gender === 'niño' ? (
                                                    <span className="bg-green-200 px-0.5 rounded font-bold text-[10px]">
                                                        {order.number || '-'}
                                                    </span>
                                                ) : <span className="text-[10px]">-</span>}
                                            </>
                                        ) : <span className="text-[10px]">-</span>}
                                    </div>

                                    {/* Columna Niña */}
                                    <div className="text-center col-span-1.5">
                                        {isOccupied ? (
                                            <>
                                                {/* Mostrar desde OrderItem si existe */}
                                                {order.OrderItem && order.OrderItem.some(item => item.gender === 'niña') ? (
                                                    <span className="bg-purple-200 px-0.5 rounded font-bold text-[10px]">
                                                        {order.OrderItem.find(item => item.gender === 'niña')?.number || '-'}
                                                    </span>
                                                ) : 
                                                /* Compatibilidad con formato antiguo */
                                                order.gender === 'niña' ? (
                                                    <span className="bg-purple-200 px-0.5 rounded font-bold text-[10px]">
                                                        {order.number || '-'}
                                                    </span>
                                                ) : <span className="text-[10px]">-</span>}
                                            </>
                                        ) : <span className="text-[10px]">-</span>}
                                    </div>
                                    
                                    {/* Botón eliminar */}
                                    {isOccupied && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteOrder(order.id);
                                            }}
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700 opacity-60 hover:opacity-100 transition-opacity"
                                            title="Eliminar"
                                        >
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
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
                            // onRefresh();
                            handleCloseModal();
                        }}
                    />
                </div>
            )}
        </div>
    );
};
