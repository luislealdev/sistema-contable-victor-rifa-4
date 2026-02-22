'use server';
import prisma from '@/lib/prisma';
import { sectionSchema } from '@/schema/section';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/actions/audit/audit-log';

export async function createUpdateSection(section: unknown) {
    const parsedSection = sectionSchema.safeParse(section);

    if (!parsedSection.success) {
        return {
            ok: false,
            message: "Información de la sección inválida",
        };
    }

    try {
        const isUpdate = parsedSection.data.id && parsedSection.data.id > 0;
        let oldSection = null;

        // Si es actualización, obtener valores anteriores
        if (isUpdate) {
            oldSection = await prisma.section.findUnique({
                where: { id: parsedSection.data.id }
            });
        }

        const savedSection = await prisma.section.upsert({
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

        // Registrar auditoría
        await createAuditLog({
            action: isUpdate ? 'UPDATE' : 'CREATE',
            entity: 'Section',
            entityId: savedSection.id,
            oldValues: oldSection ? {
                name: oldSection.name
            } : undefined,
            newValues: {
                name: savedSection.name
            },
            info: `Sección ${isUpdate ? 'actualizada' : 'creada'}: ${savedSection.name}`
        });

        revalidatePath('/');

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