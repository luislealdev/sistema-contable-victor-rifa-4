'use server';

import prisma from "@/lib/prisma";


export async function getRafflesForTomorrow() {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        const raffles = await prisma.raffle.findMany({
            where: {
                drawDate: {
                    gte: tomorrow,
                    lt: endOfTomorrow,
                },
            },
            include: {
                tickets: {
                    include: {
                        client: true,
                        payments: true,
                    },
                },
            },
        });

        return {
            success: true,
            raffles,
        };
    } catch (error) {
        console.error('Error fetching raffles for tomorrow:', error);
        return {
            success: false,
            error: 'Error al obtener las rifas de mañana',
        };
    }
}