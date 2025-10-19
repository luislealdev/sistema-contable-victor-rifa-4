'use server';

import prisma from "@/lib/prisma";

export const getOrders = async () => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                OrderItem: true
            }
            // Removemos orderBy para ordenar en el frontend por createdAt
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
