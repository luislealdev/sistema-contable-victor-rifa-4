import { getPaginatedRaffles } from '@/actions/raffles';
import React from 'react'
import { RafflesTable } from './ui/RafflesTable';

const RafflesPage = async ({ searchParams }: {
    searchParams: Promise<{
        page?: string;
        search?: string;
    }>;
}) => {

    const params = await searchParams;
    const page = parseInt(params.page || '1', 10);
    const search = params.search || '';

    const { raffles } = await getPaginatedRaffles(
        page,
        search
    );

    return (
        <RafflesTable search={search} raffles={raffles || []} />
    )
}

export default RafflesPage;