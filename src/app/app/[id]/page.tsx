import { getClientById } from '@/actions/client';
import React from 'react'
import { ClientInfo } from './ui/ClientInfo';

export default async function ClientDetailPage({ params }: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Validar que el ID sea un número válido
    const clientId = parseInt(id);
    if (isNaN(clientId)) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    ID de cliente inválido
                </div>
            </div>
        );
    }

    const result = await getClientById(clientId);

    if (!result.ok) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {result.message}
                </div>
            </div>
        );
    }

    return (
        <ClientInfo client={result.client || null} />
    )
}