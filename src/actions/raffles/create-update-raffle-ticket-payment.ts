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
                ...parsedPayment.data,
            },
            update: {
                ...parsedPayment.data,
            },
        });

        revalidatePath('/app/rifas');
        revalidatePath(`/app/rifas/${savedPayment.ticketId}`);

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