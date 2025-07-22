'use server';
import prisma from "@/lib/prisma";
import { raffleTicketPayment } from "@/schema/raffle";
import { formatDate } from "@/utils/formatDate";
import { sendWhatsApp } from "@/utils/send-whatsapp";
import { revalidatePath } from "next/cache";

export const createUpdateRaffleTicketPayment = async (payment: unknown) => {
    const parsedPayment = raffleTicketPayment.safeParse(payment);
    if (!parsedPayment.success) {
        return {
            ok: false,
            message: "Información del pago inválida",
        };
    }

    try {
        const savedPayment = await prisma.raffleTicketPayment.upsert({
            where: {
                id: parsedPayment.data.id || 0, // Use 0 for new payments
            },
            create: {
                amount: parsedPayment.data.amount,
                date: parsedPayment.data.date,
                ticketId: parsedPayment.data.ticketId,
            },
            update: {
                amount: parsedPayment.data.amount,
                date: parsedPayment.data.date,
            },
        });

        // Actualizar el totalPaid del ticket - obtener los pagos actualizados
        const updatedTicket = await prisma.raffleTicket.findUnique({
            where: { id: parsedPayment.data.ticketId },
            include: { payments: true }
        });

        if (updatedTicket) {
            const totalPaid = updatedTicket.totalPaid + savedPayment.amount;
            const ticketPrice = await prisma.raffle.findUnique({
                where: { id: updatedTicket.raffleId },
                select: { ticketPrice: true }
            });

            await prisma.raffleTicket.update({
                where: { id: updatedTicket.id },
                data: {
                    totalPaid: totalPaid,
                    isPaid: ticketPrice ? totalPaid >= ticketPrice.ticketPrice : false
                }
            });

            // Send WhatsApp message to client
            const client = await prisma.client.findUnique({
                where: { id: updatedTicket?.clientId },
                select: { phone: true, name: true }
            });

            const raffle = await prisma.raffle.findUnique({
                where: { id: updatedTicket?.raffleId },
                select: { prize: true, drawDate: true }
            });

            if (client?.phone) {
                const message = `¡Hola ${client.name}! 😊\n\n` +
                    `Se ha registrado un nuevo pago para tu ticket de rifa. Aquí tienes los detalles:\n\n` +
                    `🎟️ *Ticket #*: ${updatedTicket?.number}\n` +
                    `💰 *Monto del pago*: $${savedPayment.amount.toFixed(2)}\n` +
                    `💵 *Total pagado hasta ahora*: $${totalPaid.toFixed(2)}\n\n` +
                    // Rest
                    `*Restante: $${ticketPrice ? (ticketPrice.ticketPrice - totalPaid).toFixed(2) : '0.00'}*\n\n` +
                    `🎁 *Premio*: ${raffle!.prize}\n` +
                    `📅 *Fecha del sorteo*: ${formatDate(raffle!.drawDate)}\n\n` +
                    `¡Buena suerte! 🍀 Gracias por tu participación.\n\n` +
                    `Si tienes alguna pregunta, no dudes en contactarme.\n` +
                    `*El Torito* 📲`;

                await sendWhatsApp(client.phone, message);
            }
        }



        revalidatePath('/app/rifas');

        if (updatedTicket) {
            revalidatePath(`/app/rifas/${updatedTicket.raffleId}`);
        }

        return {
            ok: true,
            message: "Pago guardado correctamente",
            payment: savedPayment
        };

    } catch (error) {
        console.error("Error al crear/actualizar el pago:", error);
        return {
            ok: false,
            message: "Error al guardar el pago"
        };
    }
}