'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteClient(clientId: number) {
    try {

        // Check if client has a debt
        const transactions = await prisma.transaction.findFirst({
            where: {
                clientId: clientId,
                // remaining: {
                //     gt: 0
                // }
            }
        });

        // const raffleTicketsNotPayed = await prisma.raffleTicket.findFirst({
        //     where: {
        //         clientId: clientId,
        //         isPaid: false
        //     }
        // });

        // If client has pending debt, prevent deletion
        if (transactions) {
            return {
                ok: false,
                message: "No se puede eliminar el cliente porque tiene transacciones. Por favor, elimine las transacciones pendientes primero."
            };
        }

        // Delete related records in cascade
        await prisma.$transaction(async (tx) => {
            // Delete payments first (if they reference transactions)
            // await tx.payment.deleteMany({
            //     where: {
            //         transaction: {
            //             clientId: clientId
            //         }
            //     }
            // });

            // Delete raffle tickets
            // await tx.raffleTicket.deleteMany({
            //     where: {
            //         clientId: clientId
            //     }
            // });

            // Delete transactions
            await tx.transaction.deleteMany({
                where: {
                    clientId: clientId
                }
            });

            // Finally delete the client
            await tx.client.delete({
                where: {
                    id: clientId,
                }
            });
        });

        revalidatePath('/app');

        return { ok: true, message: "El cliente y su información se eliminó correctamente" };
    } catch (error) {
        console.error("Error deleting client:", error);
        return {
            ok: false,
            message: "Error al eliminar el cliente"
        };
    }
}