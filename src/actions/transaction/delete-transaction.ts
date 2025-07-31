'use server'

import prisma from "@/lib/prisma"
import { sendWhatsApp } from "@/utils/send-whatsapp"
import { revalidatePath } from "next/cache"

export const deleteTransaction = async (transactionId: number) => {
  try {
    // Verificar que la transacción existe
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
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

    // Get the client to send WhatsApp message
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { phone: true, name: true }
    });

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