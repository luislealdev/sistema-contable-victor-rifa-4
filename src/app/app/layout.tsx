import type { Metadata } from "next";
import { auth } from "../../../auth.config";
import { redirect } from "next/navigation";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Gestión Contable",
};

export default async function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const session = await auth();

    if (!session) {
        redirect('/auth');
    }

    return (
        <main>
            {/* Header con Logo */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="container mx-auto px-6 py-3">
                    <div className="flex items-center justify-center space-x-3">
                        {/* Logo */}
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={100}
                            height={100}
                            className="h-30 w-30"
                        />
                    </div>
                </div>
            </header>
            {children}
        </main>
    );
}
