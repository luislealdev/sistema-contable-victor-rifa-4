'use server'

import prisma from "@/lib/prisma"
import { sendWhatsApp } from "@/utils/send-whatsapp"
import { revalidatePath } from "next/cache"

export const deletePayment = async (paymentId: number) => {
  try {
    // Verificar que el pago existe
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      // include: { transaction: true }
    })

    if (!payment) {
      return {
        ok: false,
        message: 'Pago no encontrado'
      }
    }

    // const transactionId = payment.transactionId
    const clientId = payment.clientId

    // Eliminar el pago
    await prisma.payment.delete({
      where: { id: paymentId }
    })

    // Si el pago estaba asociado a una transacción, recalcular el remaining
    // if (transactionId) {
    //   const updatedPayments = await prisma.payment.findMany({
    //     where: { transactionId }
    //   })

    //   const transaction = await prisma.transaction.findUnique({
    //     where: { id: transactionId }
    //   })

    //   if (transaction) {
    //     const totalPaid = updatedPayments.reduce((sum: number, p) => sum + p.amount, 0)
    //     const remaining = transaction.totalAmount - totalPaid

    //     // Actualizar el remaining de la transacción
    //     await prisma.transaction.update({
    //       where: { id: transactionId },
    //       data: { remaining }
    //     })
    //   }
    // }

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
        `Se ha registrado la eliminación de un pago en tu cuenta. Aquí tienes los detalles:\n\n` +
        `💰 *Deuda restante*: $${rest.toFixed(2)}\n\n` +
        `Gracias por tu preferencia. Si tienes alguna pregunta, no dudes en contactarme. *Torito* 📲.\n`;

      sendWhatsApp(client.phone, message);

    }

    revalidatePath('/app')
    revalidatePath(`/app/${clientId}`)

    return {
      ok: true,
      message: 'Pago eliminado correctamente'
    }
  } catch (error) {
    console.error('Error al eliminar pago:', error)
    return {
      ok: false,
      message: 'Error al eliminar el pago'
    }
  }
}
