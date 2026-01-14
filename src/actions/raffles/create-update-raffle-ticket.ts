'use server';

import prisma from "@/lib/prisma";
import { raffleTicketSchema } from "@/schema/raffle";
import { formatDate } from "@/utils/formatDate";
import { sendWhatsApp } from "@/utils/send-whatsapp";
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

        // Si el ticket está marcado como pagado y tiene un totalPaid > 0,
        // asegurar que los pagos coincidan con el totalPaid
        if (parsedTicket.data.isPaid && parsedTicket.data.totalPaid > 0) {
            const existingPayments = await prisma.raffleTicketPayment.findMany({
                where: { ticketId: savedTicket.id }
            });

            const totalExistingPayments = existingPayments.reduce((sum, payment) => sum + payment.amount, 0);

            // Si los pagos existentes no coinciden con el total pagado
            if (totalExistingPayments !== parsedTicket.data.totalPaid) {
                if (totalExistingPayments < parsedTicket.data.totalPaid) {
                    // Crear un pago para la diferencia
                    await prisma.raffleTicketPayment.create({
                        data: {
                            ticketId: savedTicket.id,
                            amount: parsedTicket.data.totalPaid - totalExistingPayments,
                            date: new Date()
                        }
                    });
                } else if (totalExistingPayments > parsedTicket.data.totalPaid) {
                    // Si hay más pagos de los esperados, eliminar el exceso (empezando por los más recientes)
                    let amountToRemove = totalExistingPayments - parsedTicket.data.totalPaid;
                    const sortedPayments = existingPayments.sort((a, b) => b.date.getTime() - a.date.getTime());

                    for (const payment of sortedPayments) {
                        if (amountToRemove <= 0) break;

                        if (payment.amount <= amountToRemove) {
                            await prisma.raffleTicketPayment.delete({
                                where: { id: payment.id }
                            });
                            amountToRemove -= payment.amount;
                        } else {
                            // Actualizar el pago parcialmente
                            await prisma.raffleTicketPayment.update({
                                where: { id: payment.id },
                                data: { amount: payment.amount - amountToRemove }
                            });
                            amountToRemove = 0;
                        }
                    }
                }
            }
        }

        // Get client phone to send WhatsApp message
        const client = await prisma.client.findUnique({
            where: { id: savedTicket.clientId },
            select: { phone: true, name: true }
        });

        if (client?.phone) {

            // Get ticket price 
            const raffle = await prisma.raffle.findUnique({
                where: { id: savedTicket.raffleId },
                select: { ticketPrice: true, prize: true, drawDate: true, title: true }
            });

            const message = `¡Hola ${client.name}! 🎉\n\n` +
                `Se ha registrado un nuevo ticket de la rifa "${raffle!.title}" en tu cuenta. Aquí tienes los detalles:\n\n` +
                `🎟️ *Número de ticket*: ${savedTicket.number.toString().padStart(2, '0')}\n` +
                `💰 *Precio del ticket*: $${raffle!.ticketPrice.toFixed(2)}\n` +
                `💵 *Total pagado*: $${savedTicket.totalPaid.toFixed(2)}\n` +
                // `${savedTicket.totalPaid >= raffle!.ticketPrice ? '✅ *Estado*: PAGADO COMPLETO' : '⏳ *Estado*: PAGO PENDIENTE'}\n\n` +
                `🎁 *Premio*: ${raffle!.prize}\n` +
                `📅 *Fecha del sorteo*: ${formatDate(raffle!.drawDate)}\n\n` +
                `¡Buena suerte! 🍀 Gracias por tu participación.\n\n` +
                `Si tienes alguna pregunta, no dudes en contactarme.\n` +
                `*El Torito* 📲`;

            // Aquí deberías implementar la función sendWhatsApp
            sendWhatsApp(client.phone, message);
        }

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