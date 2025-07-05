'use server';

import prisma from "@/lib/prisma";

export async function getPaginatedRaffles(page: number = 1, search?: string) {
    const pageSize = 50;
    if (page < 1 || pageSize < 1) {
        page = 1;
    }

    try {
        const raffles = await prisma.raffle.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            where: {
                ...(search && {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                    ]
                })
            },
            orderBy: {
                createdAt: 'desc',
            },
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