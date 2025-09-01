'use client';

import { getOrders } from '@/actions/order/get-orders';
import { Order } from '@prisma/client';
import React, { useEffect, useState } from 'react';
import { OrdersTable } from './ui/OrdersTable';

const OrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const result = await getOrders();
            if (result.ok) {
                setOrders(result.orders || []);
            } else {
                setOrders([]);
            }
        } catch {
            console.error('Error fetching orders');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p>Cargando órdenes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Órdenes</h1>
                <p className="text-gray-600">
                    Administra las órdenes del 1 al 75. Cada línea puede contener información del cliente, género y producto.
                </p>
            </div>
            
            <OrdersTable orders={orders} onRefresh={fetchOrders} />
        </div>
    );
};

export default OrdersPage;