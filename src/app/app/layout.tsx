import type { Metadata } from "next";
import { auth } from "../../../auth.config";
import { redirect } from "next/navigation";

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
            {children}
        </main>
    );
}
