'use client';
import { FC } from "react";

interface Props {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filteredCount: number;
    totalCount: number;
}

export const RaffleSearch: FC<Props> = ({ searchTerm, setSearchTerm, filteredCount, totalCount }) => {
    return (
        <div className="w-full max-w-md">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar por número o nombre de cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                        <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            {searchTerm && (
                <p className="text-xs text-gray-500 mt-1">
                    Mostrando {filteredCount} de {totalCount} números
                </p>
            )}
        </div>
    );
};
