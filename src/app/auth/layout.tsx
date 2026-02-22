
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../../../auth.config";

export const metadata: Metadata = {
    title: "Autenticación | Sistema Contable",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const session = await auth();

    if (session) {
        redirect('/');
    }

    return (
        <main className="blue-bg">
            {children}
        </main>
    );
}