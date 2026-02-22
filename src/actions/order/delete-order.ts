'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/actions/audit/audit-log";

export const deleteOrder = async (id: number) => {
    try {
        // Obtener datos del pedido antes de eliminarlo para auditoría
        const orderToDelete = await prisma.order.findUnique({
            where: { id },
            include: { OrderItem: true }
        });

        // Eliminar items primero
        await prisma.orderItem.deleteMany({
            where: { orderId: id }
        });
        
        // Eliminar la orden
        await prisma.order.delete({
            where: { id }
        });

        // Registrar auditoría para DELETE
        if (orderToDelete) {
            await createAuditLog({
                action: 'DELETE',
                entity: 'Order',
                entityId: id,
                oldValues: {
                    client: orderToDelete.client,
                    gender: orderToDelete.gender,
                    product: orderToDelete.product,
                    number: orderToDelete.number,
                    specifications: orderToDelete.specifications,
                    totalAmount: orderToDelete.totalAmount,
                    OrderItem: orderToDelete.OrderItem
                },
                info: `Orden eliminada del cliente: ${orderToDelete.client}`
            });
        }

        revalidatePath('//pedidos');

        return {
            ok: true,
            message: 'Orden eliminada correctamente'
        };
    } catch {
        return {
            ok: false,
            message: 'Error al eliminar la orden'
        };
    }
};
