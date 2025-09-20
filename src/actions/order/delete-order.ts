'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const deleteOrder = async (id: number) => {
    try {

        await prisma.orderItem.deleteMany({
            where: { orderId: id }
        });
        
        await prisma.order.delete({
            where: { id }
        });

        revalidatePath('/app/pedidos');

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
