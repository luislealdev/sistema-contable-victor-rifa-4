'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteSection(id: number) {
    try {

        // Check if section has clients associated
        const sectionWithClients = await prisma.section.findUnique({
            where: { id },
            include: { clients: true }
        });

        if (sectionWithClients && sectionWithClients.clients.length > 0) {
            return {
                ok: false,
                message: "No se puede eliminar la sección porque tiene clientes asociados"
            };
        }

        const result = await prisma.section.delete({
            where: { id }
        });

        revalidatePath('/app');

        return {
            ok: true,
            data: result
        };
    } catch (error) {
        console.error("Error deleting section:", error);
        return {
            ok: false,
            message: "No se pudo eliminar la sección"
        };
    }
}