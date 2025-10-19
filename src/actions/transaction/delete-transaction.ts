'use server'

import prisma from "@/lib/prisma"
import { sendWhatsApp } from "@/utils/send-whatsapp"
import { revalidatePath } from "next/cache"
import { createAuditLog } from "@/actions/audit/audit-log"

export const deleteTransaction = async (transactionId: number) => {
  try {
    // Verificar que la transacción existe y obtener datos para auditoría
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { client: true }
    })

    if (!transaction) {
      return {
        ok: false,
        message: 'Transacción no encontrada'
      }
    }

    const clientId = transaction.clientId

    // Eliminar la transacción
    await prisma.transaction.delete({
      where: { id: transactionId }
    })

    // Registrar auditoría
    await createAuditLog({
      action: 'DELETE',
      entity: 'Transaction',
      entityId: transactionId,
      oldValues: {
        type: transaction.type,
        isActive: transaction.isActive,
        description: transaction.description,
        totalAmount: transaction.totalAmount,
        clientId: transaction.clientId,
        client: transaction.client
      },
      info: `Transacción eliminada del cliente: ${transaction.client.name}`
    })

    // Get the client to send WhatsApp message
    const client = transaction.client

    if (client?.phone) {
      // Total client debt calculation
      const transactionDebt = await prisma.transaction.aggregate({
        where: { clientId: clientId },
        _sum: { totalAmount: true }
      });

      const payments = await prisma.payment.aggregate({
        where: { clientId: clientId },
        _sum: { amount: true }
      });

      const rest = (transactionDebt._sum.totalAmount || 0) - (payments._sum.amount || 0);

      const message = `¡Hola ${client.name}! 😊\n\n` +
        `Se ha registrado la eliminación de una transacción en tu cuenta. Aquí tienes los detalles:\n\n` +
        `💰 *Deuda restante*: $${rest.toFixed(2)}\n\n` +
        `Gracias por tu preferencia. Si tienes alguna pregunta, no dudes en contactarme. *Torito* 📲.\n`;

      sendWhatsApp(client.phone, message);
    }

    revalidatePath('/app')
    revalidatePath(`/app/${clientId}`)

    return {
      ok: true,
      message: 'Transacción eliminada correctamente'
    }
  } catch (error) {
    console.error('Error al eliminar transacción:', error)
    return {
      ok: false,
      message: 'Error al eliminar la transacción'
    }
  }
}