import React from 'react'
import { getPaginatedAuditLogs } from '@/actions/audit/audit-log';
import { AuditLogsTable } from './ui/AuditLogsTable';

const AuditPage = async ({ searchParams }: {
    searchParams: Promise<{
        page?: string;
        entity?: string;
        action?: string;
        entityId?: string;
    }>;
}) => {

    const params = await searchParams;
    const page = parseInt(params.page || '1', 10);
    const entity = params.entity || undefined;
    const action = params.action as 'CREATE' | 'UPDATE' | 'DELETE' | undefined;
    const entityId = params.entityId ? parseInt(params.entityId, 10) : undefined;

    const auditResult = await getPaginatedAuditLogs({
        page,
        entity,
        action,
        entityId,
        limit: 20
    });

    if (!auditResult.ok) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Error al cargar los logs de auditoría: {auditResult.error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Auditoría del Sistema</h1>
                <p className="text-gray-600">
                    Visualiza todos los cambios realizados en el sistema. Puedes filtrar por entidad, acción o ID específico.
                </p>
            </div>

            <AuditLogsTable
                logs={auditResult.logs || []} 
                pagination={auditResult.pagination}
                currentFilters={{
                    entity,
                    action,
                    entityId
                }}
            />
        </div>
    );
};

export default AuditPage;