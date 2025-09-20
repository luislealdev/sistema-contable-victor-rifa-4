'use server';

import prisma from "@/lib/prisma";
import { orderSchema } from "@/schema/order";
import { revalidatePath } from "next/cache";

export const createUpdateOrder = async (order: unknown) => {
    const parsedOrder = orderSchema.safeParse(order);
    if (!parsedOrder.success) {
        console.error("Error de validación:", parsedOrder.error);
        return {
            ok: false,
            message: 'Información incorrecta'
        }
    }

    try {
        const { OrderItem, ...orderData } = parsedOrder.data;
        
        // Crear o actualizar la orden
        const savedOrder = await prisma.order.upsert({
            where: { id: orderData.id || 0 },
            update: orderData,
            create: orderData,
            include: {
                OrderItem: true
            }
        });

        // Si hay OrderItems, manejarlos
        if (OrderItem && OrderItem.length > 0) {
            // Eliminar items existentes que ya no están en el array
            if (savedOrder.OrderItem && savedOrder.OrderItem.length > 0) {
                const existingIds = savedOrder.OrderItem.map(item => item.id);
                const newIds = OrderItem.filter(item => item.id).map(item => item.id);
                const idsToDelete = existingIds.filter(id => !newIds.includes(id as number));
                
                if (idsToDelete.length > 0) {
                    await prisma.orderItem.deleteMany({
                        where: {
                            id: {
                                in: idsToDelete
                            }
                        }
                    });
                }
            }

            // Actualizar o crear items
            for (const item of OrderItem) {
                if (item.id) {
                    // Actualizar item existente
                    await prisma.orderItem.update({
                        where: { id: item.id },
                        data: {
                            gender: item.gender,
                            number: item.number
                        }
                    });
                } else {
                    // Crear nuevo item
                    await prisma.orderItem.create({
                        data: {
                            gender: item.gender,
                            number: item.number,
                            orderId: savedOrder.id
                        }
                    });
                }
            }
        }

        revalidatePath('/app/pedidos')

        return {
            ok: true,
            message: 'Orden creada/actualizada correctamente'
        }
    } catch (error) {
        console.error("Error al crear/actualizar orden:", error);
        return {
            ok: false,
            message: 'Error al crear/actualizar la orden'
        }
    }
};
