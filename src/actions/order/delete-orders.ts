'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/actions/audit/audit-log";

export const deleteOrders = async (ids: number[]) => {
    try {
        if (!ids || ids.length === 0) {
            return { ok: false, message: 'No hay IDs proporcionados' };
        }

        // Obtener las órdenes antes de eliminarlas para auditoría
        const ordersToDelete = await prisma.order.findMany({
            where: { id: { in: ids } },
            include: { OrderItem: true }
        });

        // Eliminar los OrderItems relacionados
        await prisma.orderItem.deleteMany({
            where: { orderId: { in: ids } }
        });

        // Eliminar las órdenes
        await prisma.order.deleteMany({
            where: { id: { in: ids } }
        });

        // Registrar auditoría por cada orden eliminada
        await Promise.all(
            ordersToDelete.map((order) =>
                createAuditLog({
                    action: 'DELETE',
                    entity: 'Order',
                    entityId: order.id,
                    oldValues: {
                        client: order.client,
                        gender: order.gender,
                        product: order.product,
                        number: order.number,
                        specifications: order.specifications,
                        totalAmount: order.totalAmount,
                        OrderItem: order.OrderItem
                    },
                    info: `Orden eliminada del cliente: ${order.client}`
                })
            )
        );

        revalidatePath('/app/pedidos');

        return { ok: true };
    } catch (error) {
        console.error('Error al eliminar órdenes:', error);
        return { ok: false, message: error instanceof Error ? error.message : 'Error desconocido' };
    }
};
