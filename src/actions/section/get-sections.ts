'use server';

import prisma from "@/lib/prisma";

export async function getSections() {
    try {
        const sections = await prisma.section.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return {
            ok: true,
            sections
        };
    } catch (error) {
        console.error("Error fetching sections:", error);
        return {
            ok: false,
            message: "No se pudieron obtener las secciones"
        };
    }
}
