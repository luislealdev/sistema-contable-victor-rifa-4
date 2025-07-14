'use server';

import prisma from "@/lib/prisma";

export async function getRaffleById(raffleId: number) {
    try {
        const raffle = await prisma.raffle.findUnique({
            where: {
                id: raffleId,
            },
            include: {
                tickets: {
                    orderBy: {
                        number: 'asc'
                    },
                    include: {
                        payments: true,
                        client: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }

            }
        });

        if (!raffle) {
            return {
                ok: false,
                message: "Rifa no encontrada",
            };
        }

        return {
            ok: true,
            raffle,
        };
    } catch (error) {
        console.error("Error fetching raffle:", error);
        return {
            ok: false,
            message: "Error al obtener la rifa",
        };
    }
}
