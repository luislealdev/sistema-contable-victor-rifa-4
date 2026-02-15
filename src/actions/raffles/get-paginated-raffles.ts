'use server';

import prisma from "@/lib/prisma";

export async function getPaginatedRaffles(page: number = 1, search?: string) {
    const pageSize = 50;
    if (page < 1 || pageSize < 1) {
        page = 1;
    }

    const today = new Date();
    const adjustedTodayDate = new Date(
        today.getTime() - today.getTimezoneOffset() * 60000
    );
    // Restar 7 días (una semana)
    const oneWeekBefore = new Date(
        adjustedTodayDate.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    try {
        const raffles = await prisma.raffle.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            where: {
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        {
                            tickets: {
                                some: {
                                    client: {
                                        name: { contains: search, mode: 'insensitive' }
                                    }
                                }
                            }
                        }
                    ]
                }),
                drawDate: { gte: oneWeekBefore },
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                PreRaffle: true,
                tickets:{
                    include: {
                        client: true,
                        payments: true
                    }
                }
            }
        });

        return {
            ok: true,
            raffles: raffles,
        };
    } catch (error) {
        console.error("Error fetching paginated raffles:", error);
        return {
            ok: false,
            message: "Error fetching paginated raffles",
        };
    }
}