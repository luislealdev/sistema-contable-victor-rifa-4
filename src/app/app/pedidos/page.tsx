import { getOrders } from '@/actions/order/get-orders';
import { OrdersTable } from './ui/OrdersTable';
import Link from 'next/link';

const OrdersPage = async () => {

    const { orders } = await getOrders();

    return (
        <div className="container mx-auto p-4 md:p-6">
            <div className="mb-6">
                <div>
                    <Link href="/app" className="text-blue-600 hover:underline mb-2 inline-block">&#8592; Volver</Link>
                </div>
                <div className="mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Órdenes</h1>
                </div>
                <p className="text-gray-600">
                    Administra las órdenes del 1 al 75. Cada línea puede contener información del cliente, género y producto.
                </p>
            </div>

            <OrdersTable orders={orders || []} />
        </div>
    );
};

export default OrdersPage;