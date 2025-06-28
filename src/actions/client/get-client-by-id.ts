'use server';

import prisma from "@/lib/prisma";

export async function getClientById(id: number) {

    try {
        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                section: true,
                transactions: {
                    orderBy: {
                        createdAt: 'desc', // Order by most recent transaction
                    },
                    include: {
                        payments: true, // Include payments for the transaction
                    }
                },
                raffleTickets: {
                    include: {
                        raffle: true, // Include raffle details
                        payments: true, // Include payments for the raffle ticket
                    },
                },

            },
        });

        if (!client) {
            return { ok: false, message: 'Cliente no encontrado' };
        }

        return { ok: true, client };

    } catch {
        return { ok: false, message: 'No se pudo obtener la información del cliente' };
    }
}