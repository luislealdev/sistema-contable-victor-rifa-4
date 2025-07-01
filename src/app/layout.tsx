import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sistema Contable",
  description: "Sistema de contabilidad.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        {children}
      </body>
      <footer>
        <div className="text-center text-sm text-gray-500 p-4">
          © {new Date().getFullYear()} Sistema Contable. Todos los derechos
          reservados. <br />
          Creado por: <Link href="https://luisrrleal.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">luisrrleal.com</Link>
        </div>
      </footer>
    </html>
  );
}
