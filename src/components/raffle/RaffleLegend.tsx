'use client';
import { FC } from "react";

export const RaffleLegend: FC = () => {
    return (
        <div className="flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-sm text-gray-600">Pagado</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span className="text-sm text-gray-600">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">Disponible</span>
            </div>
        </div>
    );
};
