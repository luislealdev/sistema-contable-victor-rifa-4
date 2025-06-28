'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export const deletePayment = async (paymentId: number) => {
  try {
    // Verificar que el pago existe
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { transaction: true }
    })

    if (!payment) {
      return {
        ok: false,
        message: 'Pago no encontrado'
      }
    }

    const transactionId = payment.transactionId
    const clientId = payment.clientId

    // Eliminar el pago
    await prisma.payment.delete({
      where: { id: paymentId }
    })

    // Si el pago estaba asociado a una transacción, recalcular el remaining
    if (transactionId) {
      const updatedPayments = await prisma.payment.findMany({
        where: { transactionId }
      })

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId }
      })

      if (transaction) {
        const totalPaid = updatedPayments.reduce((sum: number, p) => sum + p.amount, 0)
        const remaining = transaction.totalAmount - totalPaid

        // Actualizar el remaining de la transacción
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { remaining }
        })
      }
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
