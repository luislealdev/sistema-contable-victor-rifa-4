'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export const deleteTransaction = async (transactionId: number) => {
  try {
    // Verificar que la transacción existe
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { payments: true }
    })

    if (!transaction) {
      return {
        ok: false,
        message: 'Transacción no encontrada'
      }
    }

    const clientId = transaction.clientId

    // Eliminar todos los pagos asociados primero
    await prisma.payment.deleteMany({
      where: { transactionId }
    })

    // Eliminar la transacción
    await prisma.transaction.delete({
      where: { id: transactionId }
    })

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