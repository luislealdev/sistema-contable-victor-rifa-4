'use client'

import { Client, Payment, Raffle, RaffleTicket, RaffleTicketPayment, Section, Transaction } from "@prisma/client"
import { FC, useState } from "react"
import TransactionForm from "@/components/forms/TransactionForm"
import PaymentForm from "@/components/forms/PaymentForm"
import { useRouter } from "next/navigation"
import { deleteTransaction } from "@/actions/transaction/delete-transaction"
import { deletePayment } from "@/actions/payment/delete-payment"

type TransactionWithPayments = Transaction & {
    payments: Payment[];
};

type RaffleTicketWithRaffleAndPayments = RaffleTicket & {
    raffle: Raffle;
    payments: RaffleTicketPayment[];  // Cambié a RaffleTicketPayment
};

interface Props {
    client: (Client & {
        section: Section | null;
        transactions: TransactionWithPayments[];
        raffleTickets: RaffleTicketWithRaffleAndPayments[];
    }) | null;
}
export const ClientInfo: FC<Props> = ({ client }) => {
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();


    if (!client) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Cliente no encontrado
                </div>
                <button onClick={() => router.back()} className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                    ← Volver a la lista de clientes
                </button>
            </div>
        );
    }

    // Calcular deudas
    const transactionDebt = client.transactions.reduce((total, transaction) => {
        return total + transaction.remaining;
    }, 0);

    const raffleDebt = client.raffleTickets.reduce((total, ticket) => {
        const ticketPrice = ticket.raffle.ticketPrice;
        const totalPaid = ticket.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const remainingTicketDebt = ticketPrice - totalPaid;
        return total + Math.max(0, remainingTicketDebt);
    }, 0);

    const totalDebt = transactionDebt + raffleDebt;

    // Funciones para manejar el formulario de transacciones
    const handleNewTransaction = () => {
        setEditingTransaction(null);
        setShowTransactionForm(true);
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setShowTransactionForm(true);
    };

    const handleTransactionFormSuccess = () => {
        setShowTransactionForm(false);
        setEditingTransaction(null);
        window.location.reload(); // Refresh to show new data
    };

    const handleTransactionFormCancel = () => {
        setShowTransactionForm(false);
        setEditingTransaction(null);
    };

    // Funciones para manejar el formulario de pagos
    const handleNewPayment = () => {
        setShowPaymentForm(true);
    };

    const handlePaymentFormSuccess = () => {
        setShowPaymentForm(false);
        window.location.reload(); // Refresh to show new data
    };

    const handlePaymentFormCancel = () => {
        setShowPaymentForm(false);
    };

    // Funciones para eliminar transacciones y pagos
    const handleDeleteTransaction = async (transactionId: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta transacción? También se eliminarán todos los pagos asociados.')) {
            return;
        }
        
        setIsDeleting(true);
        try {
            const result = await deleteTransaction(transactionId);
            if (result.ok) {
                window.location.reload();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
            alert('Error al eliminar la transacción');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeletePayment = async (paymentId: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este pago?')) {
            return;
        }
        
        setIsDeleting(true);
        try {
            const result = await deletePayment(paymentId);
            if (result.ok) {
                window.location.reload();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Error al eliminar pago:', error);
            alert('Error al eliminar el pago');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditPayment = (payment: Payment) => {
        setEditingPayment(payment);
        setShowPaymentForm(true);
    };

    // Formatear fecha
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Formatear dinero
    const formatMoney = (amount: number) => {
        return `$${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
    };

    // Mostrar el formulario de transacciones si está activo
    if (showTransactionForm) {
        return (
            <div className="container mx-auto p-6">
                <TransactionForm
                    transaction={editingTransaction}
                    clientId={client.id}
                    onSuccess={handleTransactionFormSuccess}
                    onCancel={handleTransactionFormCancel}
                />
            </div>
        );
    }

    // Mostrar el formulario de pagos si está activo
    if (showPaymentForm) {
        return (
            <div className="container mx-auto p-6">
                <PaymentForm
                    payment={editingPayment}
                    clientId={client.id}
                    transactions={client.transactions}
                    onSuccess={handlePaymentFormSuccess}
                    onCancel={handlePaymentFormCancel}
                />
            </div>
        );
    }

    return (

        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                        ← Volver
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{client.name}</h1>
                        <p className="text-gray-600">Información del Cliente</p>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleNewTransaction}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        + Nueva Transacción
                    </button>
                    <button
                        onClick={handleNewPayment}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                        + Nuevo Pago
                    </button>
                </div>
            </div>

            {/* Información Básica */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Datos del Cliente */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos Personales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <p className="mt-1 text-lg text-gray-900">{client.name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                            <p className="mt-1 text-lg text-gray-900">{client.phone}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Dirección</label>
                            <p className="mt-1 text-lg text-gray-900">{client.address || 'No especificada'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sección</label>
                            <p className="mt-1 text-lg text-gray-900">
                                {client.section?.name || 'Sin sección asignada'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cliente desde</label>
                            <p className="mt-1 text-lg text-gray-900">{formatDate(client.createdAt)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Última actualización</label>
                            <p className="mt-1 text-lg text-gray-900">{formatDate(client.updatedAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Resumen Financiero */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen Financiero</h2>
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-blue-700 font-medium">Transacciones</span>
                                <span className="text-blue-900 font-bold">{formatMoney(transactionDebt)}</span>
                            </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-green-700 font-medium">Rifas</span>
                                <span className="text-green-900 font-bold">{formatMoney(raffleDebt)}</span>
                            </div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                            <div className="flex justify-between items-center">
                                <span className="text-red-700 font-bold">TOTAL ADEUDADO</span>
                                <span className="text-red-900 font-bold text-lg">{formatMoney(totalDebt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transacciones */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Transacciones ({client.transactions.length})
                    </h2>
                    <button
                        onClick={handleNewTransaction}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                        + Agregar Transacción
                    </button>
                </div>
                {client.transactions.length === 0 ? (
                    <p className="text-gray-500">No hay transacciones registradas</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Tipo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Descripción
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Pagado
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Restante
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Estado
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {client.transactions.map((transaction) => {
                                    const totalPaid = transaction.payments.reduce((sum, payment) => sum + payment.amount, 0);
                                    const isPaid = transaction.remaining === 0;

                                    return (
                                        <tr key={transaction.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-sm text-gray-900">
                                                {formatDate(transaction.createdAt)}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'SALE' ? 'bg-blue-100 text-blue-800' :
                                                    transaction.type === 'LOAN' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {transaction.type === 'SALE' ? 'Venta' :
                                                        transaction.type === 'LOAN' ? 'Préstamo' : 'Servicio'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-900">
                                                {transaction.description}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                {formatMoney(transaction.totalAmount)}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-green-600">
                                                {formatMoney(totalPaid)}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-red-600">
                                                {formatMoney(transaction.remaining)}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {isPaid ? 'Pagado' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-right space-x-2">
                                                <button
                                                    onClick={() => handleEditTransaction(transaction)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    disabled={isDeleting}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagos */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Historial de Pagos
                    </h2>
                    <button
                        onClick={handleNewPayment}
                        className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                        + Registrar Pago
                    </button>
                </div>

                {/* Aquí podríamos mostrar todos los pagos del cliente */}
                {client.transactions.some(t => t.payments.length > 0) ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Monto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Transacción
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Descripción
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {client.transactions
                                    .flatMap(transaction =>
                                        transaction.payments.map(payment => ({
                                            ...payment,
                                            transaction
                                        }))
                                    )
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-sm text-gray-900">
                                                {formatDate(payment.date)}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-medium text-green-600">
                                                {formatMoney(payment.amount)}
                                            </td>
                                            <td className="px-4 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.transaction.type === 'SALE' ? 'bg-blue-100 text-blue-800' :
                                                    payment.transaction.type === 'LOAN' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {payment.transaction.type === 'SALE' ? 'Venta' :
                                                        payment.transaction.type === 'LOAN' ? 'Préstamo' : 'Servicio'}
                                                </span>
                                                {payment.transaction.description && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {payment.transaction.description}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-gray-900">
                                                {payment.description || '-'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-right space-x-2">
                                                <button
                                                    onClick={() => handleEditPayment(payment)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                    disabled={isDeleting}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePayment(payment.id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors"
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No hay pagos registrados</p>
                )}
            </div>

            {/* Boletos de Rifas */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Boletos de Rifas ({client.raffleTickets.length})
                </h2>
                {client.raffleTickets.length === 0 ? (
                    <p className="text-gray-500">No hay boletos de rifas registrados</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {client.raffleTickets.map((ticket) => {
                            const totalPaid = ticket.payments.reduce((sum, payment) => sum + payment.amount, 0);
                            const remaining = ticket.raffle.ticketPrice - totalPaid;

                            return (
                                <div key={ticket.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-800">{ticket.raffle.title}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {ticket.isPaid ? 'Pagado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p>Número: <span className="font-bold text-lg text-blue-600">#{ticket.number}</span></p>
                                        <p>Premio: {ticket.raffle.prize}</p>
                                        <p>Sorteo: {formatDate(ticket.raffle.drawDate)}</p>
                                        <p>Precio: {formatMoney(ticket.raffle.ticketPrice)}</p>
                                        <p>Pagado: {formatMoney(totalPaid)}</p>
                                        {remaining > 0 && (
                                            <p className="text-red-600 font-medium">
                                                Restante: {formatMoney(remaining)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
