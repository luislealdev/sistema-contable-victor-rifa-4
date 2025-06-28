'use server';
import prisma from '@/lib/prisma';
import { sectionSchema } from '@/schema/section';
import { revalidatePath } from 'next/cache';

export async function createUpdateSection(section: unknown) {
    const parsedSection = sectionSchema.safeParse(section);

    if (!parsedSection.success) {
        return {
            ok: false,
            message: "Información de la sección inválida",
        };
    }

    try {
        await prisma.section.upsert({
            where: {
                id: parsedSection.data.id || 0, // Use 0 for new sections
            },
            create: {
                ...parsedSection.data
            },
            update: {
                ...parsedSection.data,
            },
        });

        revalidatePath('/app');

        return {
            ok: true,
            message: `Sección ${parsedSection.data.id ? 'actualizada' : 'creada'} correctamente`,
        };

    } catch (error) {
        console.error("Error creating/updating section:", error);
        return {
            ok: false,
            message: `Error al ${parsedSection.data.id ? 'actualizar' : 'crear'} la sección`,
        };
    }
}