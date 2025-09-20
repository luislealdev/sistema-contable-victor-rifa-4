'use server';

import prisma from "@/lib/prisma";

export const getOrders = async () => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                OrderItem: true
            },
            orderBy: {
                id: 'asc'
            }
        });
        return {
            ok: true,
            orders
        };
    } catch (error) {
        console.error('Error al obtener órdenes:', error);
        return {
            ok: false,
            message: 'Error al obtener las órdenes'
        };
    }
};
