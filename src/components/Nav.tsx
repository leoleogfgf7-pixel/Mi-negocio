"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/productos", label: "Productos", icon: "📦" },
  { href: "/productos/rentabilidad", label: "Rentabilidad", icon: "💎" },
  { href: "/ventas", label: "Ventas", icon: "💰" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/movimientos", label: "Stock", icon: "🔄" },
  { href: "/gastos", label: "Gastos", icon: "💸" },
  { href: "/reportes", label: "Reportes", icon: "📈" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 h-16 overflow-x-auto">
        <Link href="/" className="flex items-center gap-2 mr-6 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/20">
            N
          </div>
          <span className="font-bold text-lg text-gradient hidden sm:block">NegocioPro</span>
        </Link>
        {links.map((l) => {
          const active = l.href === "/"
            ? path === "/"
            : l.href === "/productos"
              ? path === "/productos" || path.startsWith("/productos/") && !path.startsWith("/productos/rentabilidad")
              : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                active
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="mr-1.5">{l.icon}</span>
              <span className="hidden md:inline">{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
