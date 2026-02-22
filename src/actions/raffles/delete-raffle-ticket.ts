'use server';

import prisma from "@/lib/prisma";
import { sendWhatsApp } from "@/utils/send-whatsapp";
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

        // Enviar mensaje de WhatsApp al cliente
        const client = await prisma.client.findUnique({
            where: { id: deletedTicket.clientId },
            select: { phone: true, name: true }
        });

        if (client?.phone) {
            const message = `¡Hola ${client.name}! 😊\n\n` +
                `Se ha eliminado un ticket de rifa de tu cuenta. Aquí tienes los detalles:\n\n` +
                `🎟️ *Ticket #*: ${deletedTicket.number}\n` +
                `Gracias por tu preferencia. Si tienes alguna pregunta, no dudes en contactarme. *Torito* 📲.\n`;

            sendWhatsApp(client.phone, message);
        }

        revalidatePath('//rifas');
        revalidatePath(`//rifas/${deletedTicket.raffleId}`);

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
