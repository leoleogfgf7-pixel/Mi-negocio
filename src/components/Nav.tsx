"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/productos", label: "Stock", icon: "📦" },
  { href: "/ventas", label: "Ventas", icon: "💰" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/movimientos", label: "Movimientos", icon: "🔄" },
  { href: "/gastos", label: "Gastos", icon: "💸" },
  { href: "/reportes", label: "Reportes", icon: "📈" },
  { href: "/usuarios", label: "Usuarios", icon: "⚙️" },
];

import { useAuth } from "./AuthProvider";

export function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role;

  const filteredItems = items.filter(it => {
    if (role === "vendedor") {
      return !["Reportes", "Gastos", "Dashboard", "Movimientos"].includes(it.label);
    }
    return true;
  });

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href={role === "admin" ? "/" : "/ventas"} className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-md">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Mi Negocio</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">{user?.nombre} ({role})</p>
            </div>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {filteredItems.map((it) => {
              const active =
                it.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{it.icon}</span>
                  {it.label}
                </Link>
              );
            })}
            <button onClick={logout} className="ml-4 text-xs font-bold text-rose-600 hover:underline">SALIR</button>
          </nav>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-3 md:hidden">
          {filteredItems.map((it) => {
            const active =
              it.href === "/"
                ? pathname === "/"
                : pathname.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{it.icon}</span>
                {it.label}
              </Link>
            );
          })}
          <button onClick={logout} className="shrink-0 px-3 text-xs font-bold text-rose-600">SALIR</button>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-md">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Mi Negocio</p>
              <p className="text-xs text-slate-500">Gestión integral</p>
            </div>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {items.map((it) => {
              const active =
                it.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{it.icon}</span>
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-3 md:hidden">
          {items.map((it) => {
            const active =
              it.href === "/"
                ? pathname === "/"
                : pathname.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{it.icon}</span>
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}