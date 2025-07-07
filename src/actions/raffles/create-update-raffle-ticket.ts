'use server';

import prisma from "@/lib/prisma";
import { raffleTicketSchema } from "@/schema/raffle";
import { revalidatePath } from "next/cache";

export const createUpdateRaffleTicket = async (ticket: unknown) => {
    const parsedTicket = raffleTicketSchema.safeParse(ticket);
    if (!parsedTicket.success) {
        return {
            ok: false,
            message: "Información del ticket inválida",
        };
    }

    try {
        const savedTicket = await prisma.raffleTicket.upsert({
            where: {
                id: parsedTicket.data.id || 0, // Use 0 for new tickets
            },
            create: {
                ...parsedTicket.data,
            },
            update: {
                ...parsedTicket.data,
            },
        });

        revalidatePath('/app/rifas');
        revalidatePath(`/app/rifas/${savedTicket.raffleId}`);

        return {
            ok: true,
            message: "Ticket guardado correctamente",
            ticket: savedTicket
        };

    } catch (error) {
        console.error("Error al crear/actualizar el ticket:", error);
        return {
            ok: false,
            message: "Error al guardar el ticket"
        };
    }
}