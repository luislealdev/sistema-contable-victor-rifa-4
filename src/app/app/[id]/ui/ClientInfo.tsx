'use client'

import { Client, Payment, Raffle, RaffleTicket, Section, Transaction } from "@prisma/client"
import { FC, useState } from "react"
import TransactionForm from "@/components/forms/TransactionForm"
import PaymentForm from "@/components/forms/PaymentForm"
import { useRouter } from "next/navigation"
import { deleteTransaction } from "@/actions/transaction/delete-transaction"
import { deletePayment } from "@/actions/payment/delete-payment"

// type TransactionWithPayments = Transaction & {
//     payments: Payment[];
// };

type RaffleTicketWithRaffle = RaffleTicket & {
    raffle: Raffle;
    // payments: RaffleTicketPayment[];  // Cambié a RaffleTicketPayment
};

interface Props {
    client: (Client & {
        section: Section | null;
        transactions: Transaction[];
        raffleTickets: RaffleTicketWithRaffle[];
        payments: Payment[];
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

    // Calcular totales financieros
    const totalTransactions = client.transactions.reduce((total: number, transaction) => {
        return total + transaction.totalAmount;
    }, 0);

    const totalPayments = client.payments.reduce((total: number, payment) => {
        return total + payment.amount;
    }, 0);

    const transactionDebt = totalTransactions - totalPayments;

    const totalRaffleValue = client.raffleTickets.reduce((total: number, ticket) => {
        return total + ticket.raffle.ticketPrice;
    }, 0);

    // Para rifas, asumiré que por ahora no hay pagos específicos de rifas
    // Si implementas pagos de rifas después, aquí calcularías los pagos de rifas
    const totalRafflePayments = 0; // client.raffleTickets.reduce...
    const raffleDebt = totalRaffleValue - totalRafflePayments;

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
        // Crear una nueva fecha ajustando la zona horaria para evitar el desfase
        const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        return adjustedDate.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Formatear dinero
    const formatMoney = (amount: number) => {
        return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
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
                    // transactions={client.transactions}
                    onSuccess={handlePaymentFormSuccess}
                    onCancel={handlePaymentFormCancel}
                />
            </div>
        );
    }

    return (

        <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => router.back()}
                        className="bg-gray-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                    >
                        ← Volver
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{client.name}</h1>
                        <p className="text-gray-600 text-sm">Información del Cliente</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                        onClick={handleNewTransaction}
                        className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                        + Nueva Transacción
                    </button>
                    <button
                        onClick={handleNewPayment}
                        className="bg-green-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                        + Nuevo Pago
                    </button>
                </div>
            </div>

            {/* Información Básica */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Datos del Cliente */}
                <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Datos Personales</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Nombre</label>
                            <p className="mt-1 text-sm text-gray-900">{client.name}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Teléfono</label>
                            <p className="mt-1 text-sm text-gray-900">{client.phone}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Dirección</label>
                            <p className="mt-1 text-sm text-gray-900">{client.address || 'No especificada'}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Sección</label>
                            <p className="mt-1 text-sm text-gray-900">
                                {client.section?.name || 'Sin sección asignada'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Cliente desde</label>
                            <p className="mt-1 text-sm text-gray-900">{formatDate(client.createdAt)}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Última actualización</label>
                            <p className="mt-1 text-sm text-gray-900">{formatDate(client.updatedAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Resumen Financiero */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen Financiero</h2>

                    {/* Transacciones - Compacto */}
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Transacciones</h3>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-blue-50 p-2 rounded text-center">
                                <div className="text-blue-700 font-medium">Total</div>
                                <div className="text-blue-900 font-bold">{formatMoney(totalTransactions)}</div>
                            </div>
                            <div className="bg-green-50 p-2 rounded text-center">
                                <div className="text-green-700 font-medium">Pagos</div>
                                <div className="text-green-900 font-bold">{formatMoney(totalPayments)}</div>
                            </div>
                            <div className="bg-gray-50 p-2 rounded text-center">
                                <div className="text-gray-700 font-medium">Deuda</div>
                                <div className={`font-bold ${transactionDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatMoney(transactionDebt)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rifas - Compacto */}
                    {totalRaffleValue > 0 && (
                        <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Rifas</h3>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="bg-purple-50 p-2 rounded text-center">
                                    <div className="text-purple-700 font-medium">Total</div>
                                    <div className="text-purple-900 font-bold">{formatMoney(totalRaffleValue)}</div>
                                </div>
                                <div className="bg-green-50 p-2 rounded text-center">
                                    <div className="text-green-700 font-medium">Pagos</div>
                                    <div className="text-green-900 font-bold">{formatMoney(totalRafflePayments)}</div>
                                </div>
                                <div className="bg-gray-50 p-2 rounded text-center">
                                    <div className="text-gray-700 font-medium">Deuda</div>
                                    <div className={`font-bold ${raffleDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {formatMoney(raffleDebt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Total General */}
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="flex justify-between items-center">
                            <span className="text-red-700 font-bold text-sm">DEUDA TOTAL</span>
                            <span className="text-red-900 font-bold text-lg">{formatMoney(totalDebt)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transacciones */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Transacciones ({client.transactions.length})
                    </h2>
                    <button
                        onClick={handleNewTransaction}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                        + Agregar
                    </button>
                </div>
                {client.transactions.length === 0 ? (
                    <p className="text-gray-500">No hay transacciones registradas</p>
                ) : (
                    <div className="space-y-3 md:space-y-0">
                        {/* Mobile/Tablet Card View */}
                        <div className="block md:hidden space-y-3">
                            {client.transactions.map((transaction) => {
                                // Calcular pagos relacionados con esta transacción específica
                                const transactionPayments = client.payments.filter(p => p.transactionId === transaction.id);
                                const totalPaidForTransaction = transactionPayments.reduce((sum, payment) => sum + payment.amount, 0);
                                const remaining = transaction.totalAmount - totalPaidForTransaction;
                                const isPaid = remaining <= 0;

                                return (
                                    <div key={transaction.id} className="border rounded-lg p-3 bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'SALE' ? 'bg-blue-100 text-blue-800' :
                                                        transaction.type === 'LOAN' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {transaction.type === 'SALE' ? 'Venta' :
                                                            transaction.type === 'LOAN' ? 'Préstamo' : 'Servicio'}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {isPaid ? 'Pagado' : 'Pendiente'}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 mb-1">{transaction.description}</p>
                                                <p className="text-xs text-gray-600">{formatDate(transaction.createdAt)}</p>
                                            </div>
                                            <div className="flex flex-col items-end ml-2">
                                                <div className="text-right mb-2">
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {formatMoney(transaction.totalAmount)}
                                                    </div>
                                                    {!isPaid && (
                                                        <div className="text-sm text-red-600 font-medium">
                                                            Pendiente: {formatMoney(remaining)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex space-x-1">
                                                    <button
                                                        onClick={() => handleEditTransaction(transaction)}
                                                        className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                                                        disabled={isDeleting}
                                                        title="Editar"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTransaction(transaction.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                                                        disabled={isDeleting}
                                                        title="Eliminar"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            <table className="w-full table-fixed">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="w-1/6 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Fecha/Tipo
                                        </th>
                                        <th className="w-2/6 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Descripción
                                        </th>
                                        <th className="w-1/6 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Total
                                        </th>
                                        {/* <th className="w-1/12 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Estado
                                        </th> */}
                                        <th className="w-1/12 px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {client.transactions.map((transaction) => {
                                        // const totalPaid = transaction.payments.reduce((sum, payment) => sum + payment.amount, 0);
                                        // const isPaid = transaction.remaining === 0;

                                        return (
                                            <tr key={transaction.id} className="hover:bg-gray-50">
                                                <td className="px-2 py-3">
                                                    <div className="text-xs text-gray-900">
                                                        {formatDate(transaction.createdAt)}
                                                    </div>
                                                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'SALE' ? 'bg-blue-100 text-blue-800' :
                                                        transaction.type === 'LOAN' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {transaction.type === 'SALE' ? 'Venta' :
                                                            transaction.type === 'LOAN' ? 'Préstamo' : 'Servicio'}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-3 text-xs text-gray-900">
                                                    <div className="truncate" title={transaction.description || ''}>
                                                        {transaction.description}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3">
                                                    <div className="text-xs">
                                                        <div className="font-medium text-gray-900">
                                                            {formatMoney(transaction.totalAmount)}
                                                        </div>
                                                        {/* <div className="text-green-600">
                                                            Pagado: {formatMoney(totalPaid)}
                                                        </div>
                                                        {transaction.remaining > 0 && (
                                                            <div className="text-red-600 font-medium">
                                                                Restante: {formatMoney(transaction.remaining)}
                                                            </div>
                                                        )} */}
                                                    </div>
                                                </td>
                                                {/* <td className="px-2 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {isPaid ? 'Pagado' : 'Pendiente'}
                                                    </span>
                                                </td> */}
                                                <td className="px-2 py-3 text-right">
                                                    <div className="flex justify-end space-x-1">
                                                        <button
                                                            onClick={() => handleEditTransaction(transaction)}
                                                            className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                                                            disabled={isDeleting}
                                                            title="Editar"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTransaction(transaction.id)}
                                                            className="text-red-600 hover:text-red-900 transition-colors p-1"
                                                            disabled={isDeleting}
                                                            title="Eliminar"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagos */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
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
                {/* {client.transactions.some(t => t.payments.length > 0) ? ( */}
                {client.payments.length > 0 ? (
                    <div className="space-y-3 md:space-y-0">
                        {/* Mobile/Tablet Card View */}
                        <div className="block md:hidden space-y-3">
                            {client.payments
                                // .flatMap(transaction =>
                                //     transaction.payments.map(payment => ({
                                //         ...payment,
                                //         transaction
                                //     }))
                                // )
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((payment) => (
                                    <div key={payment.id} className="border rounded-lg p-3 bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {/* <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.transaction.type === 'SALE' ? 'bg-blue-100 text-blue-800' :
                                                        payment.transaction.type === 'LOAN' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {payment.transaction.type === 'SALE' ? 'Venta' :
                                                            payment.transaction.type === 'LOAN' ? 'Préstamo' : 'Servicio'}
                                                    </span> */}
                                                    <span className="text-lg font-bold text-green-600">
                                                        {formatMoney(payment.amount)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-1">{formatDate(payment.date)}</p>
                                                {/* {payment.transaction.description && (
                                                    <p className="text-xs text-gray-500">
                                                        Transacción: {payment.transaction.description}
                                                    </p>
                                                )} */}
                                                {payment.description && (
                                                    <p className="text-xs text-gray-700">
                                                        Nota: {payment.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col space-y-1 ml-2">
                                                <button
                                                    onClick={() => handleEditPayment(payment)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors text-xs px-2 py-1 border border-blue-300 rounded"
                                                    disabled={isDeleting}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePayment(payment.id)}
                                                    className="text-red-600 hover:text-red-900 transition-colors text-xs px-2 py-1 border border-red-300 rounded"
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            <table className="w-full table-fixed">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Fecha
                                        </th>
                                        <th className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Monto
                                        </th>
                                        {/* <th className="w-2/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Transacción
                                        </th> */}
                                        <th className="w-1/6 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Descripción
                                        </th>
                                        <th className="w-1/6 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {client.payments
                                        // .flatMap(transaction =>
                                        //     transaction.payments.map(payment => ({
                                        //         ...payment,
                                        //         transaction
                                        //     }))
                                        // )
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-50">
                                                <td className="px-3 py-3 text-sm text-gray-900">
                                                    {formatDate(payment.date)}
                                                </td>
                                                <td className="px-3 py-3 text-sm font-bold text-green-600">
                                                    {formatMoney(payment.amount)}
                                                </td>
                                                {/* <td className="px-3 py-3 text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.transaction.type === 'SALE' ? 'bg-blue-100 text-blue-800' :
                                                        payment.transaction.type === 'LOAN' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {payment.transaction.type === 'SALE' ? 'Venta' :
                                                            payment.transaction.type === 'LOAN' ? 'Préstamo' : 'Servicio'}
                                                    </span>
                                                    {payment.transaction.description && (
                                                        <div className="text-xs text-gray-500 mt-1 truncate">
                                                            {payment.transaction.description}
                                                        </div>
                                                    )}
                                                </td> */}
                                                <td className="px-3 py-3 text-sm text-gray-900">
                                                    <div className="truncate" title={payment.description || ''}>
                                                        {payment.description || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-sm text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleEditPayment(payment)}
                                                            className="text-blue-600 hover:text-blue-900 transition-colors text-xs"
                                                            disabled={isDeleting}
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePayment(payment.id)}
                                                            className="text-red-600 hover:text-red-900 transition-colors text-xs"
                                                            disabled={isDeleting}
                                                        >
                                                            {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">No hay pagos registrados</p>
                )}
            </div>

            {/* Boletos de Rifas */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Boletos de Rifas ({client.raffleTickets.length})
                </h2>
                {client.raffleTickets.length === 0 ? (
                    <p className="text-gray-500">No hay boletos de rifas registrados</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {client.raffleTickets.map((ticket) => {
                            // const totalPaid = ticket.payments.reduce((sum, payment) => sum + payment.amount, 0);
                            // const remaining = ticket.raffle.ticketPrice - totalPaid;
                            const remaining = ticket.raffle.ticketPrice;

                            return (
                                <div key={ticket.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-800 text-sm truncate flex-1 mr-2">
                                            {ticket.raffle.title}
                                        </h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${ticket.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {ticket.isPaid ? 'Pagado' : 'Pendiente'}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Número:</span>
                                            <span className="font-bold text-lg text-blue-600">#{ticket.number}</span>
                                        </div>
                                        <div className="text-xs text-gray-700 truncate" title={ticket.raffle.prize}>
                                            Premio: {ticket.raffle.prize}
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Sorteo:</span>
                                            <span>{formatDate(ticket.raffle.drawDate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Precio:</span>
                                            <span className="font-medium">{formatMoney(ticket.raffle.ticketPrice)}</span>
                                        </div>
                                        {/* <div className="flex justify-between">
                                            <span>Pagado:</span>
                                            <span className="text-green-600 font-medium">{formatMoney(totalPaid)}</span>
                                        </div> */}
                                        {remaining > 0 && (
                                            <div className="flex justify-between">
                                                <span>Restante:</span>
                                                <span className="text-red-600 font-bold">{formatMoney(remaining)}</span>
                                            </div>
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
