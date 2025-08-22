'use client'

import { Client, Payment, Section, Transaction } from '@prisma/client'
import React, { FC, useState } from 'react'
import Link from 'next/link'
import ClientForm from '@/components/forms/ClientForm'
import SectionForm from '@/components/forms/SectionForm'
import PaymentForm from '@/components/forms/PaymentForm'
import TransactionForm from '@/components/forms/TransactionForm'
// import { deleteClient } from '@/actions/client/delete-client'
import Image from 'next/image'

interface Props {
    clients: (Client & {
        transactionDebt: number
        monthlyServiceDebt: number
        totalDebt: number
        transactions: Transaction[] | undefined,
        payments: Payment[],
        raffleDebt: number,
        raffleRemaining: number,
        raffleId: number | null
    })[]
    sections: Section[]
    currentPage: number
    totalPages: number
    totalClients: number
    sectionCounts: Record<string, number>
    totalClientsCount: number
    debtSummary?: {
        totalTransactionDebt: number
        totalRaffleDebt: number
        totalMonthlyServiceDebt: number
        grandTotalDebt: number
    }
    sectionId?: number
    search?: string
}

export const ClientsTable: FC<Props> = ({
    clients,
    sections,
    currentPage,
    totalPages,
    totalClients,
    sectionCounts,
    totalClientsCount,
    debtSummary,
    sectionId,
    search,
    // hideMoneyData = false
}) => {
    const [showForm, setShowForm] = useState(false)
    const [showSectionForm, setShowSectionForm] = useState(false)
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [editingSection, setEditingSection] = useState<Section | null>(null)
    // const [filterSection, setFilterSection] = useState(sectionId?.toString() || '')
    const [searchTerm, setSearchTerm] = useState(search || '')
    // const [loading, setLoading] = useState(false)
    // const [hideMoneyData, setHideMoneyData] = useState(false)

    // Estados para el modal de pagos
    const [showPaymentForm, setShowPaymentForm] = useState(false)
    const [selectedClientForPayment, setSelectedClientForPayment] = useState<(Client & {
        transactionDebt: number
        monthlyServiceDebt: number
        totalDebt: number
        transactions: Transaction[] | undefined,
        payments: Payment[]
    }) | null>(null)

    // Estados para el modal de transacciones
    const [showTransactionForm, setShowTransactionForm] = useState(false)
    const [selectedClientForTransaction, setSelectedClientForTransaction] = useState<number | null>(null)

    // Estados para el modal de atrasos
    const [showDelayedModal, setShowDelayedModal] = useState(false)

    // const handleDelete = async (clientId: number, clientName: string) => {
    //     if (!confirm(`¿Estás seguro de que quieres eliminar a ${clientName}?`)) {
    //         return
    //     }

    //     setLoading(true)
    //     try {
    //         const result = await deleteClient(clientId)
    //         if (result.ok) {
    //             window.location.reload() // Refresh the page
    //         } else {
    //             alert(result.message)
    //         }
    //     } catch {
    //         alert('Error al eliminar el cliente')
    //     } finally {
    //         setLoading(false)
    //     }
    // }

    const handleEdit = (client: Client) => {
        setEditingClient(client)
        setShowForm(true)
    }

    const handleAddTransaction = (clientId: number) => {
        setSelectedClientForTransaction(clientId)
        setShowTransactionForm(true)
    }

    const handleTransactionSuccess = () => {
        setShowTransactionForm(false)
        setSelectedClientForTransaction(null)
        window.location.reload() // Refresh to update debt amounts
    }

    const handleTransactionCancel = () => {
        setShowTransactionForm(false)
        setSelectedClientForTransaction(null)
    }

    const handleFormSuccess = () => {
        setShowForm(false)
        setEditingClient(null)
        window.location.reload() // Refresh the page
    }

    const handleFormCancel = () => {
        setShowForm(false)
        setEditingClient(null)
    }

    const handleSectionFormSuccess = () => {
        setShowSectionForm(false)
        setEditingSection(null)
        window.location.reload() // Refresh the page to show new section
    }

    const handleSectionFormCancel = () => {
        setShowSectionForm(false)
        setEditingSection(null)
    }

    const handleEditSection = (section: Section) => {
        setEditingSection(section)
        setShowSectionForm(true)
    }

    const handleNewSection = () => {
        setEditingSection(null)
        setShowSectionForm(true)
    }

    // Funciones para manejar pagos
    const handleAddPayment = (client: Client & {
        transactionDebt: number
        monthlyServiceDebt: number
        totalDebt: number
        transactions: Transaction[] | undefined,
        payments: Payment[]
    }) => {
        setSelectedClientForPayment(client)
        setShowPaymentForm(true)
    }

    const handlePaymentSuccess = () => {
        setShowPaymentForm(false)
        setSelectedClientForPayment(null)
        window.location.reload() // Refresh to update debt amounts
    }

    const handlePaymentCancel = () => {
        setShowPaymentForm(false)
        setSelectedClientForPayment(null)
    }

    // Funciones para manejar el modal de atrasos
    const handleShowDelayedClients = () => {
        setShowDelayedModal(true)
    }

    const handleDelayedModalClose = () => {
        setShowDelayedModal(false)
    }

    // Función para calcular clientes con atrasos
    const getDelayedClients = () => {
        const currentDate = new Date()
        
        return clients
            .filter(client => client.totalDebt > 0) // Solo clientes con deuda
            .map(client => {
                // Encontrar el último pago del cliente
                const lastPayment = client.payments.length > 0 
                    ? client.payments.reduce((latest, payment) => 
                        new Date(payment.date) > new Date(latest.date) ? payment : latest
                    ) 
                    : null

                const daysSinceLastPayment = lastPayment 
                    ? Math.floor((currentDate.getTime() - new Date(lastPayment.date).getTime()) / (1000 * 60 * 60 * 24))
                    : Math.floor((currentDate.getTime() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24))

                return {
                    ...client,
                    lastPayment,
                    daysSinceLastPayment
                }
            })
            .sort((a, b) => b.daysSinceLastPayment - a.daysSinceLastPayment) // Ordenar por más días sin pagar
    }

    // Genera colores consistentes para las secciones
    const getSectionColor = (sectionId: number) => {
        const colors = [
            'bg-blue-100 text-orange-800 border-blue-200',
            'bg-orange-100 text-orange-800 border-orange-200',
            'bg-blue-100 text-blue-800 border-blue-200',
            'bg-pink-100 text-pink-800 border-pink-200',
            'bg-yellow-100 text-yellow-800 border-yellow-200',
            'bg-green-100 text-green-800 border-green-200',
            'bg-red-100 text-red-800 border-red-200',
            'bg-indigo-100 text-indigo-800 border-indigo-200',
            'bg-purple-100 text-purple-800 border-purple-200',
        ]
        return colors[sectionId]
    }

    const handleSectionFilter = (sectionId?: number) => {
        const url = buildURL(1, sectionId?.toString(), searchTerm)
        window.location.href = url
    }

    // Cuenta clientes por sección (usando contadores reales de la base de datos)
    const getClientsCountBySection = (sectionId: number | null) => {
        if (sectionId === null) {
            return sectionCounts['null'] || 0;
        }
        return sectionCounts[sectionId.toString()] || 0;
    };

    const buildURL = (page: number, section?: string, searchValue?: string, hideMoneyDataValue?: boolean) => {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        if (section) params.set('sectionId', section)
        if (searchValue) params.set('search', searchValue)
        if (hideMoneyDataValue) params.set('hideMoneyData', 'true')
        return `/app?${params.toString()}`
    }

    const handleFilter = () => {
        const url = buildURL(1, sectionId?.toString(), searchTerm)
        window.location.href = url
    }

    // const handleToggleMoneyData = () => {
    //     const url = buildURL(currentPage, sectionId?.toString(), searchTerm, !hideMoneyData)
    //     window.location.href = url
    // }

    const getSectionName = (sectionId: number | null) => {
        if (!sectionId) return 'Sin sección'
        const section = sections.find(s => s.id === sectionId)
        return section?.name || 'Sección desconocida'
    }

    if (showSectionForm) {
        return (
            <div className="container mx-auto p-6">
                <SectionForm
                    section={editingSection}
                    onSuccess={handleSectionFormSuccess}
                    onCancel={handleSectionFormCancel}
                />
            </div>
        )
    }

    if (showForm) {
        return (
            <div className="container mx-auto p-6">
                <ClientForm
                    client={editingClient}
                    sections={sections}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Toggle para ocultar datos monetarios */}
                        {/* <button
                            onClick={handleToggleMoneyData}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${hideMoneyData
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                }`}
                            title={hideMoneyData ? 'Mostrar datos monetarios' : 'Ocultar datos monetarios'}
                        >
                            <span className="text-sm">
                                {hideMoneyData ? '🔒' : '👁️'}
                            </span>
                            <span className="text-sm font-medium">
                                {hideMoneyData ? 'Datos Ocultos' : 'Ocultar Montos'}
                            </span>
                        </button> */}

                        <button
                            onClick={handleNewSection}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                            Nueva Sección
                        </button>
                        <button
                            onClick={handleShowDelayedClients}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                        >
                            Atrasos
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Nuevo Cliente
                        </button>
                    </div>
                </div>

                {/* Filtro de Búsqueda */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleFilter()
                                }
                            }}
                        />
                        <button
                            onClick={handleFilter}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors whitespace-nowrap"
                        >
                            Buscar
                        </button>
                    </div>

                    {searchTerm && (
                        <button
                            onClick={() => {
                                setSearchTerm('')
                                const url = buildURL(1, sectionId?.toString(), '')
                                window.location.href = url
                            }}
                            className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-md hover:bg-red-200 transition-colors whitespace-nowrap"
                            title="Limpiar búsqueda"
                        >
                            ✕ Limpiar
                        </button>
                    )}
                </div>

                {/* Secciones con Colores */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700">Filtrar por Sección</h2>
                    <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                        {/* Todas las secciones */}
                        <button
                            onClick={() => handleSectionFilter()}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${!sectionId
                                ? 'bg-gray-200 border-gray-400 text-gray-800 shadow-md'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <div className="text-center">
                                <div className="font-semibold text-xs">Todas</div>
                                <div className="text-xs mt-1">{totalClientsCount}</div>
                            </div>
                        </button>

                        {/* Sin sección */}
                        <button
                            onClick={() => handleSectionFilter(undefined)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${sectionId === undefined
                                ? 'bg-gray-200 border-gray-400 text-gray-800 shadow-md'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <div className="text-center">
                                <div className="font-semibold text-xs">Sin Sección</div>
                                <div className="text-xs mt-1">{getClientsCountBySection(null)}</div>
                            </div>
                        </button>

                        {/* Secciones existentes */}
                        {sections.map((section) => (
                            <div
                                key={section.id}
                                className={`relative p-3 rounded-lg border-2 transition-all duration-200 group ${sectionId === section.id
                                    ? 'bg-black text-white border-black shadow-md transform scale-105'
                                    : `${getSectionColor(section.id)} opacity-70 hover:opacity-100 hover:transform hover:scale-105`
                                    }`}
                            >
                                {/* Botón principal de la sección */}
                                <button
                                    onClick={() => handleSectionFilter(section.id)}
                                    className="w-full text-center"
                                >
                                    <div className="font-semibold text-xs truncate" title={section.name}>{section.name}</div>
                                    <div className="text-xs mt-1">{getClientsCountBySection(section.id)}</div>
                                </button>

                                {/* Botón de editar (siempre visible) */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditSection(section);
                                    }}
                                    className={`absolute top-1 right-1 rounded-full p-1.5 shadow-md border transition-colors ${sectionId === section.id
                                        ? 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-blue-600'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-blue-600'
                                        }`}
                                    title="Editar sección"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        {/* Link to raffles with image and bottom text */}
                        <Link
                            href="/app/rifas"
                            className="p-3 rounded-lg border-2 bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200 transition-colors flex flex-col items-center justify-center"
                        >
                            <Image
                                width={32}
                                height={32}
                                src="/logo.png"
                                alt="Rifas"
                                className="w-8 h-8 mb-1"
                            />
                            <div className="text-xs font-semibold">Rifas</div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabla de Clientes */}
            <div className="bg-white rounded-lg shadow-md">
                {/* Resumen de Deudas */}
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {sectionId
                            ? `Clientes de ${sections.find(s => s.id === sectionId)?.name || 'Sección'}`
                            : searchTerm
                                ? `Resultados de búsqueda: "${searchTerm}"`
                                : 'Todos los Clientes'
                        }
                    </h2>
                </div>
                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                    Teléfono
                                </th>
                                <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sección
                                </th>
                                <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Deuda
                                </th>
                                <th className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rifas
                                </th>
                                <th className="px-2 sm:px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-2 sm:px-3 py-4 text-center text-gray-500">
                                        No se encontraron clientes
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client, index) => (
                                    <tr
                                        key={client.id}
                                        className={`hover:bg-gray-50 border-l-4 cursor-pointer transition-colors group ${client.sectionId
                                            ? getSectionColor(client.sectionId).split(' ')[2] // border color
                                            : 'border-gray-300'
                                            }`}
                                        onClick={() => window.location.href = `/app/${client.id}`}
                                        title={`Click para ver detalles de ${client.name}`}
                                    >
                                        <td className="px-2 sm:px-3 py-3 sm:py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                            #{index + 1}
                                                        </span>
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {client.name}
                                                        </div>
                                                    </div>
                                                    <div className="md:hidden text-xs text-gray-500 truncate">
                                                        {client.phone}
                                                    </div>
                                                    {client.address && (
                                                        <div className="text-xs text-gray-500 truncate">
                                                            {client.address}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 ml-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-sm text-gray-900 hidden md:table-cell">
                                            {client.phone}
                                        </td>
                                        <td className="px-2 sm:px-3 py-3 sm:py-4">
                                            <div className={`text-xs ${client.sectionId
                                                ? getSectionColor(client.sectionId)
                                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                                } rounded-md px-1.5 sm:px-2 py-1 inline-flex items-center space-x-1 max-w-full`}>
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${client.sectionId
                                                    ? getSectionColor(client.sectionId).split(' ')[1] // text color converted to bg
                                                    : 'bg-gray-400'
                                                    } border-white border`}></div>
                                                <span className="font-medium truncate text-xs">{getSectionName(client.sectionId)}</span>
                                            </div>
                                        </td>

                                        <td className="px-2 sm:px-3 py-3 sm:py-4">
                                            <div className="text-right">
                                                <span className={`text-sm font-medium ${client.totalDebt > 0
                                                    ? 'text-red-600'
                                                    : 'text-green-600'
                                                    }`}>
                                                    ${client.totalDebt.toFixed(0)}
                                                </span>
                                            </div>
                                        </td>

                                        {
                                            client.raffleDebt > 0 ? (
                                                <td className="px-2 sm:px-3 py-3 sm:py-4">
                                                    <Link 
                                                        href={`/app/rifas/${client.raffleId}`} 
                                                        className="text-center"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="flex flex-col items-center space-y-1">
                                                            <div className="flex items-center space-x-1">
                                                                <span className="text-xs font-semibold text-green-600">
                                                                    ${(client.raffleDebt - client.raffleRemaining).toFixed(0)}
                                                                </span>
                                                                <span className="text-xs text-gray-400">/</span>
                                                                <span className="text-xs font-semibold text-gray-800">
                                                                    ${client.raffleDebt.toFixed(0)}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-16">
                                                                <div
                                                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                                                    style={{
                                                                        width: `${((client.raffleDebt - client.raffleRemaining) / client.raffleDebt) * 100}%`
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            {client.raffleRemaining > 0 && (
                                                                <span className="text-xs text-red-500 font-medium">
                                                                    Resta: ${client.raffleRemaining.toFixed(0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Link>
                                                </td>
                                            ) : (
                                                <td className="px-2 sm:px-3 py-3 sm:py-4 text-center">
                                                    <div className="flex flex-col items-center space-y-1" onClick={(e) => e.stopPropagation()}>
                                                        <Link
                                                            href='/app/rifas'
                                                            className="flex flex-col items-center space-y-1 hover:bg-purple-50 rounded-md px-2 py-1 transition-colors"
                                                        >
                                                            <span className="text-xs text-gray-400">🎫</span>
                                                            <span className="text-xs text-purple-600 hover:text-purple-800 font-medium">Sin Rifas</span>
                                                        </Link>
                                                    </div>
                                                </td>
                                            )
                                        }

                                        <td className="px-2 sm:px-3 py-3 sm:py-4 text-right">
                                            <div className="flex justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleAddTransaction(client.id)}
                                                    className="text-green-600 hover:text-green-900 transition-colors p-1"
                                                    title="Ver detalles"
                                                >
                                                    ➕
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(client)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors p-1 text-xs"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                {/* <button
                                                    onClick={() => handleAddTransaction(client.id)}
                                                    className="text-purple-600 hover:text-purple-900 transition-colors p-1 text-xs"
                                                    title="Nueva Transacción"
                                                >
                                                    📋
                                                </button> */}
                                                <button
                                                    onClick={() => handleAddPayment(client)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors p-1 text-xs"
                                                    title="Agregar Pago"
                                                >
                                                    💵
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                                Página {currentPage} de {totalPages}
                            </div>
                            <div className="flex space-x-2">
                                {currentPage > 1 && (
                                    <Link
                                        href={buildURL(currentPage - 1, sectionId?.toString(), searchTerm)}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Anterior
                                    </Link>
                                )}

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        return page === 1 ||
                                            page === totalPages ||
                                            Math.abs(page - currentPage) <= 2
                                    })
                                    .map((page, index, array) => {
                                        const showEllipsis = index > 0 && array[index - 1] < page - 1
                                        return (
                                            <React.Fragment key={page}>
                                                {showEllipsis && (
                                                    <span className="px-2 py-1 text-gray-500">...</span>
                                                )}
                                                <Link
                                                    href={buildURL(page, sectionId?.toString(), searchTerm)}
                                                    className={`px-3 py-1 border rounded-md text-sm transition-colors ${page === currentPage
                                                        ? 'border-blue-500 bg-blue-500 text-white'
                                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </Link>
                                            </React.Fragment>
                                        )
                                    })}

                                {currentPage < totalPages && (
                                    <Link
                                        href={buildURL(currentPage + 1, sectionId?.toString(), searchTerm)}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Siguiente
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
            {debtSummary && (
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">
                            📊 Resumen Financiero
                            {sectionId
                                ? ` - ${sections.find(s => s.id === sectionId)?.name || 'Sección'}`
                                : searchTerm
                                    ? ` - Búsqueda: "${searchTerm}"`
                                    : ' - Total General'
                            }
                        </h3>
                        <div className="text-sm text-gray-600">
                            {totalClients} cliente{totalClients !== 1 ? 's' : ''}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Deuda de Transacciones */}
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <h4 className="text-xs font-medium text-gray-700">Transacciones</h4>
                            </div>
                            <p className="text-sm sm:text-lg font-bold text-blue-600 mt-1">
                                ${debtSummary.totalTransactionDebt.toLocaleString()}
                            </p>
                        </div>

                        {/* Deuda de Rifas */}
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <h4 className="text-xs font-medium text-gray-700">Rifas</h4>
                            </div>
                            <p className="text-sm sm:text-lg font-bold text-green-600 mt-1">
                                ${debtSummary.totalRaffleDebt.toLocaleString()}
                            </p>
                        </div>

                        {/* Servicios Mensuales */}
                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <h4 className="text-xs font-medium text-gray-700">Servicios</h4>
                            </div>
                            <p className="text-sm sm:text-lg font-bold text-purple-600 mt-1">
                                ${debtSummary.totalMonthlyServiceDebt.toLocaleString()}
                            </p>
                        </div>

                        {/* Total General */}
                        <div className="bg-white rounded-lg p-3 border-2 border-red-300 shadow-md">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <h4 className="text-xs font-bold text-gray-800">TOTAL</h4>
                            </div>
                            <p className="text-sm sm:text-lg font-bold text-red-600 mt-1">
                                ${debtSummary.grandTotalDebt.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Barra de progreso visual - Solo en pantallas grandes */}
                    <div className="mt-3 hidden lg:block">
                        <div className="flex items-center space-x-2 text-xs text-gray-600 mb-1">
                            <span>Distribución de deudas:</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 flex overflow-hidden">
                            {debtSummary.grandTotalDebt > 0 && (
                                <>
                                    <div
                                        className="bg-blue-500 h-full"
                                        style={{
                                            width: `${(debtSummary.totalTransactionDebt / debtSummary.grandTotalDebt) * 100}%`
                                        }}
                                        title={`Transacciones: ${((debtSummary.totalTransactionDebt / debtSummary.grandTotalDebt) * 100).toFixed(1)}%`}
                                    ></div>
                                    <div
                                        className="bg-green-500 h-full"
                                        style={{
                                            width: `${(debtSummary.totalRaffleDebt / debtSummary.grandTotalDebt) * 100}%`
                                        }}
                                        title={`Rifas: ${((debtSummary.totalRaffleDebt / debtSummary.grandTotalDebt) * 100).toFixed(1)}%`}
                                    ></div>
                                    <div
                                        className="bg-purple-500 h-full"
                                        style={{
                                            width: `${(debtSummary.totalMonthlyServiceDebt / debtSummary.grandTotalDebt) * 100}%`
                                        }}
                                        title={`Servicios: ${((debtSummary.totalMonthlyServiceDebt / debtSummary.grandTotalDebt) * 100).toFixed(1)}%`}
                                    ></div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para ClientForm */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4">
                            <ClientForm
                                client={editingClient}
                                sections={sections}
                                onSuccess={handleFormSuccess}
                                onCancel={handleFormCancel}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para SectionForm */}
            {showSectionForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4">
                            <SectionForm
                                section={editingSection}
                                onSuccess={handleSectionFormSuccess}
                                onCancel={handleSectionFormCancel}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para PaymentForm */}
            {showPaymentForm && selectedClientForPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4">
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-800">
                                    <span className="font-medium">Cliente:</span> {selectedClientForPayment.name}
                                </p>
                                <p className="text-sm text-blue-800">
                                    <span className="font-medium">Deuda Total:</span> ${selectedClientForPayment.totalDebt.toFixed(2)}
                                </p>
                            </div>
                            <PaymentForm
                                payment={null}
                                clientId={selectedClientForPayment.id}
                                onSuccess={handlePaymentSuccess}
                                onCancel={handlePaymentCancel}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para TransactionForm */}
            {showTransactionForm && selectedClientForTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4">
                            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                                <p className="text-sm text-purple-800">
                                    <span className="font-medium">Cliente:</span> {clients.find(c => c.id === selectedClientForTransaction)?.name}
                                </p>
                                <p className="text-sm text-purple-800">
                                    <span className="font-medium">Creando nueva transacción</span>
                                </p>
                            </div>
                            <TransactionForm
                                transaction={null}
                                clientId={selectedClientForTransaction}
                                onSuccess={handleTransactionSuccess}
                                onCancel={handleTransactionCancel}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Clientes con Atrasos */}
            {showDelayedModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header del modal */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-red-600">
                                    🚨 Clientes con Atrasos
                                </h2>
                                <button
                                    onClick={handleDelayedModalClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Contenido del modal */}
                            <div className="space-y-4">
                                {getDelayedClients().length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-6xl mb-4">🎉</div>
                                        <h3 className="text-xl font-semibold text-green-600 mb-2">
                                            ¡Excelente!
                                        </h3>
                                        <p className="text-gray-600">
                                            No hay clientes con deudas pendientes
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                            <p className="text-sm text-red-800">
                                                <span className="font-medium">Total de clientes con atrasos:</span> {getDelayedClients().length}
                                            </p>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Cliente
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Deuda Total
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Último Pago
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Días Sin Pagar
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Acciones
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {getDelayedClients().map((client) => (
                                                        <tr key={client.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center">
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {client.name}
                                                                        </div>
                                                                        <div className="text-sm text-gray-500">
                                                                            {client.phone}
                                                                        </div>
                                                                        <div className={`text-xs ${client.sectionId
                                                                            ? getSectionColor(client.sectionId)
                                                                            : 'bg-gray-50 text-gray-500 border-gray-200'
                                                                        } rounded-md px-2 py-1 inline-flex items-center mt-1`}>
                                                                            {getSectionName(client.sectionId)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="text-sm font-bold text-red-600">
                                                                    ${client.totalDebt.toFixed(0)}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="text-sm text-gray-900">
                                                                    {client.lastPayment 
                                                                        ? new Date(client.lastPayment.date).toLocaleDateString('es-ES')
                                                                        : 'Sin pagos'
                                                                    }
                                                                </div>
                                                                {client.lastPayment && (
                                                                    <div className="text-xs text-gray-500">
                                                                        ${client.lastPayment.amount.toFixed(0)}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className={`text-sm font-bold ${
                                                                    client.daysSinceLastPayment > 60 
                                                                        ? 'text-red-600' 
                                                                        : client.daysSinceLastPayment > 30 
                                                                        ? 'text-orange-600' 
                                                                        : 'text-yellow-600'
                                                                }`}>
                                                                    {client.daysSinceLastPayment} días
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-right">
                                                                <div className="flex justify-end space-x-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            handleDelayedModalClose()
                                                                            window.location.href = `/app/${client.id}`
                                                                        }}
                                                                        className="text-blue-600 hover:text-blue-900 transition-colors text-xs bg-blue-100 px-2 py-1 rounded"
                                                                        title="Ver detalles"
                                                                    >
                                                                        Ver
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleDelayedModalClose()
                                                                            handleAddPayment(client)
                                                                        }}
                                                                        className="text-green-600 hover:text-green-900 transition-colors text-xs bg-green-100 px-2 py-1 rounded"
                                                                        title="Agregar pago"
                                                                    >
                                                                        Pago
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
