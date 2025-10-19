'use client';

import { deleteOrder } from '@/actions/order/delete-order';
import { Order, OrderItem } from '@prisma/client';
import React, { useState } from 'react';
import { OrderForm } from './OrderForm';

interface Props {
    orders: (Order & {
        OrderItem?: OrderItem[];
        createdAt?: Date | null;
    })[];
}

export const OrdersTable: React.FC<Props> = ({ orders }) => {
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<(Order & { OrderItem?: OrderItem[] }) | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showSelectionMode, setShowSelectionMode] = useState(false);

    // Ordenar órdenes por fecha de creación (del primero al último creado)
    const sortedOrders = [...orders].sort((a, b) => {
        // Si ambas órdenes tienen createdAt, ordenar por fecha
        if (a.createdAt && b.createdAt) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        // Si solo una tiene createdAt, la que tiene va después
        if (a.createdAt && !b.createdAt) return 1;
        if (!a.createdAt && b.createdAt) return -1;
        // Si ninguna tiene createdAt, ordenar por ID como fallback
        return a.id - b.id;
    });

    // Función para formatear número secuencial
    const formatNumber = (num: number): string => {
        return num < 10 ? `0${num}` : num.toString();
    };

    // Función para filtrar órdenes basado en el término de búsqueda
    const filteredOrders = sortedOrders.filter(order => {
        if (!searchTerm.trim()) return true;

        const searchLower = searchTerm.toLowerCase();

        // Buscar por cliente
        if (order.client.toLowerCase().includes(searchLower)) return true;

        // Buscar por género si existe
        if (order.gender?.toLowerCase().includes(searchLower)) return true;

        // Buscar por producto si existe
        if (order.product?.toLowerCase().includes(searchLower)) return true;

        // Buscar por ID
        if (order.id.toString().includes(searchLower)) return true;

        return false;
    });

    const handleCreateOrder = () => {
        // Para crear una nueva orden, no especificamos ID (se asignará automáticamente)
        setSelectedOrder({
            id: 0, // 0 indica nueva orden
            client: '',
            gender: null,
            product: null,
            number: null,
            specifications: null,
            totalAmount: null,
            OrderItem: [],
            createdAt: null
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
    
    // Función para manejar la selección de una orden
    const handleSelectOrder = (id: number, e: React.SyntheticEvent) => {
        e.stopPropagation();
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(orderId => orderId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };
    
    // Función para calcular el total de todas las órdenes
    const calculateTotal = () => {
        return orders.reduce((sum, order) => {
            return sum + (order.totalAmount || 0);
        }, 0);
    };
    
    // Función para calcular el total de órdenes seleccionadas
    const calculateSelectedTotal = () => {
        return orders
            .filter(order => selectedIds.includes(order.id))
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    };
    
    // Función para limpiar selecciones
    const clearSelections = () => {
        setSelectedIds([]);
    };
    
    // Función para alternar modo de selección
    const toggleSelectionMode = () => {
        setShowSelectionMode(!showSelectionMode);
        if (showSelectionMode) {
            clearSelections();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md">
            {/* Header con controles */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 p-4">
                <div className="flex flex-col items-center gap-4 mt-2 sm:mt-0">
                    <h2 className="text-xl font-bold text-gray-800">Órdenes ({orders.length})</h2>

                    {/* Estadísticas compactas */}
                    <div className="flex flex-wrap gap-4 justify-center text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                            <span className="text-gray-600">Total de órdenes: {orders.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCreateOrder}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition-colors"
                            >
                                + Nueva Orden
                            </button>
                        </div>
                    </div>
                    
                    {/* Información de totales */}
                    <div className="w-full px-4 py-2 bg-blue-50 rounded-md mt-2 border border-blue-100">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Total general:</span>
                                <span className="text-lg font-bold text-blue-700">${calculateTotal().toFixed(2)}</span>
                            </div>
                            
                            <div className="flex items-center">
                                <button 
                                    onClick={toggleSelectionMode}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                        showSelectionMode 
                                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                                >
                                    {showSelectionMode ? 'Cancelar selección' : 'Seleccionar órdenes'}
                                </button>
                            </div>
                        </div>
                        
                        {showSelectionMode && (
                            <div className="mt-2 border-t border-blue-200 pt-2">
                                <div className="flex flex-col sm:flex-row sm:justify-between items-center">
                                    <div>
                                        <span className="text-xs">Órdenes seleccionadas: {selectedIds.length}</span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">Subtotal seleccionado:</span>
                                            <span className="text-lg font-bold text-green-700">${calculateSelectedTotal().toFixed(2)}</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={clearSelections}
                                        className="mt-2 sm:mt-0 px-3 py-1 rounded-md text-xs bg-gray-200 hover:bg-gray-300 transition-colors"
                                        disabled={selectedIds.length === 0}
                                    >
                                        Limpiar selección
                                    </button>
                                </div>
                            </div>
                        )}
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
                                Mostrando {filteredOrders.length} de {orders.length} órdenes
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Header de la tabla */}
            <div className="px-4 mb-2">
                <div className="grid grid-cols-24 gap-1 text-xs font-bold text-gray-700 border-b border-gray-300 pb-1">
                    <div className="text-center col-span-2">#</div>
                    <div className="truncate col-span-6">Nombre</div>
                    <div className="truncate col-span-6">Producto</div>
                    <div className="text-center col-span-4 text-[10px]">$</div>
                    <div className="text-center col-span-1.5 text-[10px]">H</div>
                    <div className="text-center col-span-1.5 text-[10px]">M</div>
                    <div className="text-center col-span-1.5 text-[10px]">N</div>
                    <div className="text-center col-span-1.5 text-[10px]">N</div>
                </div>
            </div>

            {/* Grid de órdenes como tabla */}
            <div className="px-4" style={{ lineHeight: '1' }}>
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-lg">
                            {searchTerm 
                                ? `No se encontraron órdenes que coincidan con "${searchTerm}"` 
                                : 'No hay órdenes creadas aún'
                            }
                        </p>
                        {searchTerm ? (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                            >
                                Limpiar búsqueda
                            </button>
                        ) : (
                            <button
                                onClick={handleCreateOrder}
                                className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
                            >
                                Crear primera orden
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="">
                        {filteredOrders.map((order, index) => {
                            const sequentialNumber = index + 1; // Numeración secuencial

                            return (
                                <div
                                    key={order.id}
                                    className={`
                                        border border-black text-xs transition-colors cursor-pointer grid grid-cols-24 gap-1 items-center p-1 relative
                                        ${selectedIds.includes(order.id)
                                            ? 'bg-blue-200 hover:bg-blue-300'
                                            : 'bg-green-100 hover:bg-green-200'
                                        }
                                    `}
                                    onClick={(e) => {
                                        if (showSelectionMode) {
                                            handleSelectOrder(order.id, e);
                                        } else {
                                            handleEditOrder(order);
                                        }
                                    }}
                                >
                                    {/* Columna Línea */}
                                    <div className="text-center font-bold col-span-2 flex items-center justify-center gap-1">
                                        {showSelectionMode && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(order.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectOrder(order.id, e);
                                                }}
                                                className="w-3 h-3"
                                            />
                                        )}
                                        {formatNumber(sequentialNumber)}
                                    </div>

                                    {/* Columna Nombre */}
                                    <div className="font-medium col-span-6 truncate text-[10px]">
                                        {order.client}
                                    </div>

                                    {/* Columna Producto */}
                                    <div className="col-span-6 truncate text-[10px]">
                                        {order.product || '-'}
                                    </div>
                                    
                                    {/* Columna Precio */}
                                    <div className="col-span-4 text-center text-[10px]">
                                        {order.totalAmount !== null ? `$${order.totalAmount.toFixed(2)}` : '$0.00'}
                                    </div>

                                    {/* Columna Hombre */}
                                    <div className="text-center col-span-1.5">
                                        {/* Mostrar desde OrderItem si existe */}
                                        {order.OrderItem && order.OrderItem.some((item: OrderItem) => item.gender === 'hombre') ? (
                                            <span className="bg-blue-200 px-0.5 rounded font-bold text-[10px]">
                                                {order.OrderItem.find((item: OrderItem) => item.gender === 'hombre')?.number || '-'}
                                            </span>
                                        ) :
                                            /* Compatibilidad con formato antiguo */
                                            order.gender === 'hombre' ? (
                                                <span className="bg-blue-200 px-0.5 rounded font-bold text-[10px]">
                                                    {order.number || '-'}
                                                </span>
                                            ) : <span className="text-[10px]">-</span>}
                                    </div>

                                    {/* Columna Dama */}
                                    <div className="text-center col-span-1.5">
                                        {/* Mostrar desde OrderItem si existe */}
                                        {order.OrderItem && order.OrderItem.some((item: OrderItem) => item.gender === 'mujer') ? (
                                            <span className="bg-pink-200 px-0.5 rounded font-bold text-[10px]">
                                                {order.OrderItem.find((item: OrderItem) => item.gender === 'mujer')?.number || '-'}
                                            </span>
                                        ) :
                                            /* Compatibilidad con formato antiguo */
                                            order.gender === 'mujer' ? (
                                                <span className="bg-pink-200 px-0.5 rounded font-bold text-[10px]">
                                                    {order.number || '-'}
                                                </span>
                                            ) : <span className="text-[10px]">-</span>}
                                    </div>

                                    {/* Columna Niño */}
                                    <div className="text-center col-span-1.5">
                                        {/* Mostrar desde OrderItem si existe */}
                                        {order.OrderItem && order.OrderItem.some((item: OrderItem) => item.gender === 'niño') ? (
                                            <span className="bg-green-200 px-0.5 rounded font-bold text-[10px]">
                                                {order.OrderItem.find((item: OrderItem) => item.gender === 'niño')?.number || '-'}
                                            </span>
                                        ) :
                                            /* Compatibilidad con formato antiguo */
                                            order.gender === 'niño' ? (
                                                <span className="bg-green-200 px-0.5 rounded font-bold text-[10px]">
                                                    {order.number || '-'}
                                                </span>
                                            ) : <span className="text-[10px]">-</span>}
                                    </div>

                                    {/* Columna Niña */}
                                    <div className="text-center col-span-1.5">
                                        {/* Mostrar desde OrderItem si existe */}
                                        {order.OrderItem && order.OrderItem.some((item: OrderItem) => item.gender === 'niña') ? (
                                            <span className="bg-purple-200 px-0.5 rounded font-bold text-[10px]">
                                                {order.OrderItem.find((item: OrderItem) => item.gender === 'niña')?.number || '-'}
                                            </span>
                                        ) :
                                            /* Compatibilidad con formato antiguo */
                                            order.gender === 'niña' ? (
                                                <span className="bg-purple-200 px-0.5 rounded font-bold text-[10px]">
                                                    {order.number || '-'}
                                                </span>
                                            ) : <span className="text-[10px]">-</span>}
                                    </div>

                                    {/* Botón eliminar */}
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
