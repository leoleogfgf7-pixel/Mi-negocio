import "./globals.css";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Mi Negocio - Gestión de Ventas y Stock",
  description: "Sistema para gestionar ventas, stock, clientes y reportes.",
};

import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-100 antialiased">
        <AuthProvider>
          <Nav />
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}