'use client'

import { AuditLog } from '@prisma/client'
import React, { FC, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDateTime } from '@/utils/formatDate'

interface Props {
    logs: AuditLog[]
    pagination: {
        currentPage: number
        totalPages: number
        totalItems: number
        itemsPerPage: number
        hasNext: boolean
        hasPrevious: boolean
    }
    currentFilters: {
        entity?: string
        action?: string
        entityId?: number
    }
}

export const AuditLogsTable: FC<Props> = ({
    logs,
    pagination,
    currentFilters
}) => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
    const [showDetails, setShowDetails] = useState(false)

    // Función para crear URLs con parámetros
    const createUrl = (params: Record<string, string | number | undefined>) => {
        const newParams = new URLSearchParams(searchParams)
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                newParams.set(key, value.toString())
            } else {
                newParams.delete(key)
            }
        })
        
        return `/app/auditoria?${newParams.toString()}`
    }

    // Función para cambiar página
    const handlePageChange = (page: number) => {
        router.push(createUrl({ ...currentFilters, page }))
    }

    // Función para cambiar filtros
    const handleFilterChange = (filterType: string, value: string) => {
        const newFilters = { ...currentFilters }
        if (value === '') {
            delete newFilters[filterType as keyof typeof newFilters]
        } else {
            if (filterType === 'entityId') {
                newFilters.entityId = parseInt(value)
            } else {
                newFilters[filterType as 'entity' | 'action'] = value as 'CREATE' | 'UPDATE' | 'DELETE'
            }
        }
        router.push(createUrl({ ...newFilters, page: 1 }))
    }

    // Función para mostrar detalles
    const showLogDetails = (log: AuditLog) => {
        setSelectedLog(log)
        setShowDetails(true)
    }

    // Función para formatear JSON
    const formatJson = (jsonString: string | null) => {
        if (!jsonString) return 'N/A'
        try {
            const parsed = JSON.parse(jsonString)
            return JSON.stringify(parsed, null, 2)
        } catch {
            return jsonString
        }
    }

    // Función para obtener color de la acción
    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE':
                return 'bg-green-100 text-green-800'
            case 'UPDATE':
                return 'bg-blue-100 text-blue-800'
            case 'DELETE':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Entidad
                        </label>
                        <select
                            value={currentFilters.entity || ''}
                            onChange={(e) => handleFilterChange('entity', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todas las entidades</option>
                            <option value="Order">Órdenes</option>
                            <option value="Client">Clientes</option>
                            <option value="Transaction">Transacciones</option>
                            <option value="Payment">Pagos</option>
                            <option value="Raffle">Rifas</option>
                            <option value="Section">Secciones</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Acción
                        </label>
                        <select
                            value={currentFilters.action || ''}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todas las acciones</option>
                            <option value="CREATE">Crear</option>
                            <option value="UPDATE">Actualizar</option>
                            <option value="DELETE">Eliminar</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ID de Entidad
                        </label>
                        <input
                            type="number"
                            value={currentFilters.entityId || ''}
                            onChange={(e) => handleFilterChange('entityId', e.target.value)}
                            placeholder="ID específico"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => router.push('/app/auditoria')}
                            className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Información de paginación */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-700">
                    Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} a {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} registros
                </p>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha/Hora
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acción
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Entidad
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Descripción
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDateTime(log.timestamp)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {log.entity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {log.entityId}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                        {log.info || 'Sin descripción'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {log.userId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <button
                                            onClick={() => showLogDetails(log)}
                                            className="text-blue-600 hover:text-blue-900 underline"
                                        >
                                            Ver detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {logs.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No se encontraron registros de auditoría</p>
                    </div>
                )}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                    <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevious}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                                page === pagination.currentPage
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {/* Modal de detalles */}
            {showDetails && selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Detalles del Log de Auditoría</h3>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID:</label>
                                    <p className="text-sm text-gray-900">{selectedLog.id}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Fecha/Hora:</label>
                                    <p className="text-sm text-gray-900">{formatDateTime(selectedLog.timestamp)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Acción:</label>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(selectedLog.action)}`}>
                                        {selectedLog.action}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Entidad:</label>
                                    <p className="text-sm text-gray-900">{selectedLog.entity}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ID de Entidad:</label>
                                    <p className="text-sm text-gray-900">{selectedLog.entityId}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Usuario:</label>
                                    <p className="text-sm text-gray-900">{selectedLog.userId}</p>
                                </div>
                            </div>

                            {selectedLog.info && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción:</label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{selectedLog.info}</p>
                                </div>
                            )}

                            {selectedLog.oldValues && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valores Anteriores:</label>
                                    <pre className="text-xs text-gray-900 bg-red-50 p-3 rounded overflow-x-auto border">
                                        {formatJson(selectedLog.oldValues)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.newValues && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valores Nuevos:</label>
                                    <pre className="text-xs text-gray-900 bg-green-50 p-3 rounded overflow-x-auto border">
                                        {formatJson(selectedLog.newValues)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowDetails(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}