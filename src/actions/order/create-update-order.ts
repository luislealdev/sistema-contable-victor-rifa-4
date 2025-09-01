'use server';

import prisma from "@/lib/prisma";
import { orderSchema } from "@/schema/order";
import { revalidatePath } from "next/cache";

export const createUpdateOrder = async (order: unknown) => {
    const parsedOrder = orderSchema.safeParse(order);
    if (!parsedOrder.success) {
        return {
            ok: false,
            message: 'Información incorrecta'
        }
    }

    try {

        await prisma.order.upsert({
            where: { id: parsedOrder.data.id || 0 },
            update: parsedOrder.data,
            create: parsedOrder.data
        });

        revalidatePath('/app/pedidos')

        return {
            ok: true,
            message: 'Orden creada/actualizada correctamente'
        }
    } catch {
        return {
            ok: false,
            message: 'Error al crear/actualizar la orden'
        }
    }
};
