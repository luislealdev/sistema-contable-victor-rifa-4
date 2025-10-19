'use server';

import prisma from "@/lib/prisma";
import { orderSchema } from "@/schema/order";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/actions/audit/audit-log";

// Función para encontrar un ID disponible
const findAvailableId = async (): Promise<number> => {
    // Obtener todos los IDs existentes ordenados
    const existingOrders = await prisma.order.findMany({
        select: { id: true },
        orderBy: { id: 'asc' }
    });
    
    const existingIds = existingOrders.map(order => order.id);
    
    // Buscar el primer ID disponible (empezando desde 1)
    let newId = 1;
    while (existingIds.includes(newId)) {
        newId++;
    }
    
    return newId;
};

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
        
        // Determinar si es creación o actualización
        const isUpdate = orderData.id && orderData.id > 0;
        
        let savedOrder;
        
        if (isUpdate) {
            // Obtener valores anteriores para auditoría
            const oldOrder = await prisma.order.findUnique({
                where: { id: orderData.id },
                include: { OrderItem: true }
            });

            // Actualización: usar el ID existente
            savedOrder = await prisma.order.update({
                where: { id: orderData.id },
                data: {
                    client: orderData.client,
                    gender: orderData.gender,
                    product: orderData.product,
                    number: orderData.number,
                    specifications: orderData.specifications,
                    totalAmount: orderData.totalAmount
                },
                include: {
                    OrderItem: true
                }
            });

            // Registrar auditoría para UPDATE
            await createAuditLog({
                action: 'UPDATE',
                entity: 'Order',
                entityId: savedOrder.id,
                oldValues: oldOrder ? {
                    client: oldOrder.client,
                    gender: oldOrder.gender,
                    product: oldOrder.product,
                    number: oldOrder.number,
                    specifications: oldOrder.specifications,
                    totalAmount: oldOrder.totalAmount,
                    OrderItem: oldOrder.OrderItem
                } : undefined,
                newValues: {
                    client: savedOrder.client,
                    gender: savedOrder.gender,
                    product: savedOrder.product,
                    number: savedOrder.number,
                    specifications: savedOrder.specifications,
                    totalAmount: savedOrder.totalAmount,
                    OrderItem: savedOrder.OrderItem
                },
                info: `Orden actualizada para cliente: ${savedOrder.client}`
            });
        } else {
            // Creación: generar un ID único disponible
            const availableId = await findAvailableId();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...createData } = orderData; // Excluir id original del objeto de creación
            
            savedOrder = await prisma.order.create({
                data: {
                    ...createData,
                    id: availableId // Usar el ID disponible encontrado
                },
                include: {
                    OrderItem: true
                }
            });

            // Registrar auditoría para CREATE
            await createAuditLog({
                action: 'CREATE',
                entity: 'Order',
                entityId: savedOrder.id,
                newValues: {
                    client: savedOrder.client,
                    gender: savedOrder.gender,
                    product: savedOrder.product,
                    number: savedOrder.number,
                    specifications: savedOrder.specifications,
                    totalAmount: savedOrder.totalAmount,
                    OrderItem: savedOrder.OrderItem
                },
                info: `Nueva orden creada para cliente: ${savedOrder.client}`
            });
        }

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
