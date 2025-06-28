'use client'

import { Client, Payment, Raffle, RaffleTicket, Section, Transaction } from '@prisma/client'
import React, { FC, useState } from 'react'
import Link from 'next/link'
import ClientForm from '@/components/forms/ClientForm'
import SectionForm from '@/components/forms/SectionForm'
import { deleteClient } from '@/actions/client/delete-client'

interface Props {
    clients: (Client & {
        debt: {
            transactionDebt: number
            raffleDebt: number
            monthlyServiceDebt: number
            totalDebt: number
        },
        transactions: Transaction[] | undefined,
        raffleTickets: (RaffleTicket & {
            raffle: Raffle,
            payments: Payment[]
        })[] | undefined
    })[]
    sections: Section[]
    currentPage: number
    totalPages: number
    totalClients: number
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
    debtSummary,
    sectionId,
    search
}) => {
    const [showForm, setShowForm] = useState(false)
    const [showSectionForm, setShowSectionForm] = useState(false)
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    // const [filterSection, setFilterSection] = useState(sectionId?.toString() || '')
    const [searchTerm, setSearchTerm] = useState(search || '')
    const [loading, setLoading] = useState(false)

    const handleDelete = async (clientId: number, clientName: string) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar a ${clientName}?`)) {
            return
        }

        setLoading(true)
        try {
            const result = await deleteClient(clientId)
            if (result.ok) {
                window.location.reload() // Refresh the page
            } else {
                alert(result.message)
            }
        } catch {
            alert('Error al eliminar el cliente')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (client: Client) => {
        setEditingClient(client)
        setShowForm(true)
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
        window.location.reload() // Refresh the page to show new section
    }

    const handleSectionFormCancel = () => {
        setShowSectionForm(false)
    }

    // Genera colores consistentes para las secciones
    const getSectionColor = (sectionId: number) => {
        const colors = [
            'bg-blue-100 text-blue-800 border-blue-200',
            'bg-green-100 text-green-800 border-green-200',
            'bg-purple-100 text-purple-800 border-purple-200',
            'bg-yellow-100 text-yellow-800 border-yellow-200',
            'bg-pink-100 text-pink-800 border-pink-200',
            'bg-indigo-100 text-indigo-800 border-indigo-200',
            'bg-red-100 text-red-800 border-red-200',
            'bg-orange-100 text-orange-800 border-orange-200',
        ]
        return colors[sectionId % colors.length]
    }

    const handleSectionFilter = (sectionId?: number) => {
        const url = buildURL(1, sectionId?.toString(), searchTerm)
        window.location.href = url
    }

    // Cuenta clientes por sección
    const getClientsCountBySection = (sectionId: number | null) => {
        return clients.filter(client => client.sectionId === sectionId).length
    }

    const buildURL = (page: number, section?: string, searchValue?: string) => {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        if (section) params.set('sectionId', section)
        if (searchValue) params.set('search', searchValue)
        return `/app?${params.toString()}`
    }

    const handleFilter = () => {
        const url = buildURL(1, sectionId?.toString(), searchTerm)
        window.location.href = url
    }

    const getSectionName = (sectionId: number | null) => {
        if (!sectionId) return 'Sin sección'
        const section = sections.find(s => s.id === sectionId)
        return section?.name || 'Sección desconocida'
    }

    if (showSectionForm) {
        return (
            <div className="container mx-auto p-6">
                <SectionForm
                    section={null}
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
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Clientes</h1>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowSectionForm(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                        >
                            Nueva Sección
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
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o teléfono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={handleFilter}
                        className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                        Buscar
                    </button>
                </div>

                {/* Secciones con Colores */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700">Filtrar por Sección</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {/* Todas las secciones */}
                        <button
                            onClick={() => handleSectionFilter()}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${!sectionId
                                ? 'bg-gray-200 border-gray-400 text-gray-800 shadow-md'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <div className="text-center">
                                <div className="font-semibold">Todas</div>
                                <div className="text-sm mt-1">{clients.length} clientes</div>
                            </div>
                        </button>

                        {/* Sin sección */}
                        <button
                            onClick={() => handleSectionFilter(undefined)}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${sectionId === undefined
                                ? 'bg-gray-200 border-gray-400 text-gray-800 shadow-md'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <div className="text-center">
                                <div className="font-semibold">Sin Sección</div>
                                <div className="text-sm mt-1">{getClientsCountBySection(null)} clientes</div>
                            </div>
                        </button>

                        {/* Secciones existentes */}
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => handleSectionFilter(section.id)}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 ${sectionId === section.id
                                    ? `${getSectionColor(section.id)} shadow-md transform scale-105`
                                    : `${getSectionColor(section.id)} opacity-70 hover:opacity-100 hover:transform hover:scale-105`
                                    }`}
                            >
                                <div className="text-center">
                                    <div className="font-semibold truncate">{section.name}</div>
                                    <div className="text-sm mt-1">{getClientsCountBySection(section.id)} clientes</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabla de Clientes */}
            <div className="bg-white rounded-lg shadow-md">
                {/* Resumen de Deudas */}
                {debtSummary && (
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                📊 Resumen Financiero
                                {sectionId
                                    ? ` - ${sections.find(s => s.id === sectionId)?.name || 'Sección'}`
                                    : searchTerm
                                        ? ` - Búsqueda: "${searchTerm}"`
                                        : ' - Total General'
                                }
                            </h3>
                            <div className="text-sm text-gray-600">
                                {totalClients} cliente{totalClients !== 1 ? 's' : ''} total{totalClients !== 1 ? 'es' : ''}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Deuda de Transacciones */}
                            <div className="bg-white rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <h4 className="text-sm font-medium text-gray-700">Transacciones</h4>
                                </div>
                                <p className="text-2xl font-bold text-blue-600 mt-2">
                                    ${debtSummary.totalTransactionDebt.toLocaleString()}
                                </p>
                            </div>

                            {/* Deuda de Rifas */}
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <h4 className="text-sm font-medium text-gray-700">Rifas</h4>
                                </div>
                                <p className="text-2xl font-bold text-green-600 mt-2">
                                    ${debtSummary.totalRaffleDebt.toLocaleString()}
                                </p>
                            </div>

                            {/* Servicios Mensuales */}
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                    <h4 className="text-sm font-medium text-gray-700">Servicios</h4>
                                </div>
                                <p className="text-2xl font-bold text-purple-600 mt-2">
                                    ${debtSummary.totalMonthlyServiceDebt.toLocaleString()}
                                </p>
                            </div>

                            {/* Total General */}
                            <div className="bg-white rounded-lg p-4 border-2 border-red-300 shadow-md">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <h4 className="text-sm font-bold text-gray-800">TOTAL ADEUDADO</h4>
                                </div>
                                <p className="text-2xl font-bold text-red-600 mt-2">
                                    ${debtSummary.grandTotalDebt.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Barra de progreso visual */}
                        <div className="mt-4">
                            <div className="flex items-center space-x-2 text-xs text-gray-600 mb-1">
                                <span>Distribución de deudas:</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
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
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Teléfono
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sección
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Deuda Total
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No se encontraron clientes
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client) => (
                                    <tr
                                        key={client.id}
                                        className={`hover:bg-gray-50 border-l-4 cursor-pointer transition-colors group ${client.sectionId
                                                ? getSectionColor(client.sectionId).split(' ')[2] // border color
                                                : 'border-gray-300'
                                            }`}
                                        onClick={() => window.location.href = `/app/${client.id}`}
                                        title={`Click para ver detalles de ${client.name}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {client.name}
                                                    </div>
                                                    {client.address && (
                                                        <div className="text-sm text-gray-500">
                                                            {client.address}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {client.phone}
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${client.sectionId
                                                ? getSectionColor(client.sectionId)
                                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                            } rounded-md mx-2`}>
                                            <div className="flex items-center space-x-2 py-1 px-2">
                                                <div className={`w-2 h-2 rounded-full ${client.sectionId
                                                        ? getSectionColor(client.sectionId).split(' ')[1] // text color converted to bg
                                                        : 'bg-gray-400'
                                                    } border-white border`}></div>
                                                <span className="font-medium">{getSectionName(client.sectionId)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-medium ${client.debt.totalDebt > 0
                                                ? 'text-red-600'
                                                : 'text-green-600'
                                                }`}>
                                                ${client.debt.totalDebt.toFixed(2)}
                                            </span>
                                            {client.debt.totalDebt > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    Transacciones: ${client.debt.transactionDebt}
                                                    {client.debt.raffleDebt > 0 && (
                                                        <> | Rifas: ${client.debt.raffleDebt}</>
                                                    )}
                                                    {client.debt.monthlyServiceDebt > 0 && (
                                                        <> | Servicios: ${client.debt.monthlyServiceDebt}</>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                                                <Link
                                                    href={`/app/${client.id}`}
                                                    className="text-green-600 hover:text-green-900 transition-colors inline-flex items-center space-x-1"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    <span>Ver</span>
                                                </Link>
                                                <button
                                                    onClick={() => handleEdit(client)}
                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client.id, client.name)}
                                                    disabled={loading}
                                                    className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50"
                                                >
                                                    Eliminar
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
        </div>
    )
}
