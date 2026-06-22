import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "NegocioPro — Gestión Premium",
  description: "Sistema profesional de gestión de ventas, stock y clientes",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0a0a0f] text-gray-100 antialiased min-h-screen">
        <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-transparent to-blue-950/20 pointer-events-none" />
        <div className="relative z-10">
          <Nav />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
