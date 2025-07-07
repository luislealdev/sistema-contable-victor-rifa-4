'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const deleteRaffleTicket = async (ticketId: number) => {
    try {
        // Primero eliminar todos los pagos asociados al ticket
        await prisma.raffleTicketPayment.deleteMany({
            where: {
                ticketId: ticketId
            }
        });

        // Luego eliminar el ticket
        const deletedTicket = await prisma.raffleTicket.delete({
            where: {
                id: ticketId
            }
        });

        revalidatePath('/app/rifas');
        revalidatePath(`/app/rifas/${deletedTicket.raffleId}`);

        return {
            ok: true,
            message: "Ticket eliminado correctamente"
        };

    } catch (error) {
        console.error("Error al eliminar el ticket:", error);
        return {
            ok: false,
            message: "Error al eliminar el ticket"
        };
    }
}
