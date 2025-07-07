'use server';
import prisma from "@/lib/prisma";
import { raffleTicketPayment } from "@/schema/raffle";
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
            const totalPaid = updatedTicket.payments.reduce((sum, payment) => sum + payment.amount, 0);
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