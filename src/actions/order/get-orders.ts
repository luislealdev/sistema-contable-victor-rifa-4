'use server';

import prisma from "@/lib/prisma";

export const getOrders = async () => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: {
                id: 'asc'
            }
        });
        return {
            ok: true,
            orders
        };
    } catch {
        return {
            ok: false,
            message: 'Error al obtener las órdenes',
            orders: []
        };
    }
};
