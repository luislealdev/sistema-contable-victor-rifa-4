import React from 'react'
import { getPaginatedClients } from '@/actions/client';
import { getSections } from '@/actions/section/get-sections';
import { ClientsTable } from './ui/ClientsTable';

const ClientsPage = async ({ searchParams }: {
    searchParams: Promise<{
        page?: string;
        sectionId?: string;
        search?: string;
        hideMoneyData?: string;
    }>;
}) => {

    const params = await searchParams;
    const page = parseInt(params.page || '1', 10);
    const sectionId = params.sectionId ? parseInt(params.sectionId, 10) : undefined;
    const search = params.search || '';
    // const hideMoneyData = params.hideMoneyData === 'true' || params.hideMoneyData === '1';

    const clientsResult = await getPaginatedClients(
        page,
        sectionId,
        search
    );
    const sectionsResult = await getSections();

    if (!clientsResult.ok || !sectionsResult.ok) {
        return (
            <div className="p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    Error al cargar los datos: {clientsResult.message || sectionsResult.message}
                </div>
            </div>
        );
    }

    return (
        <ClientsTable 
            // hideMoneyData={hideMoneyData}
            clients={clientsResult.clients || []} 
            sections={sectionsResult.sections || []}
            currentPage={clientsResult.currentPage || 1}
            totalPages={clientsResult.totalPages || 1}
            totalClients={clientsResult.totalClients || 0}
            debtSummary={clientsResult.debtSummary}
            sectionId={sectionId}
            search={search}
        />
    )
}

export default ClientsPage;