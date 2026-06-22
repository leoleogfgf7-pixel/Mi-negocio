"use client";
import { useEffect, useState } from "react";
import { formatSoles, formatDateTime } from "@/lib/utils";
import Link from "next/link";

interface DashData {
  ventasHoy: { count: number; total: string };
  ventasMes: { count: number; total: string; costo: string };
  stockBajo: { id: number; nombre: string; stock: number; stockMinimo: number }[];
  prodCount: number;
  cliCount: number;
  gastosMes: string;
  ultimasVentas: { id: number; clienteNombre: string; total: string; estado: string; createdAt: string }[];
  topProductos: { productoNombre: string; totalUnidades: number; totalVentas: string }[];
}

const emptyDash: DashData = {
  ventasHoy: { count: 0, total: "0" },
  ventasMes: { count: 0, total: "0", costo: "0" },
  stockBajo: [], prodCount: 0, cliCount: 0, gastosMes: "0",
  ultimasVentas: [], topProductos: [],
};

export default function Dashboard() {
  const [d, setD] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        // ensure tables exist
        await fetch("/api/setup").catch(() => {});
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          setD(await res.json());
        } else {
          setD(emptyDash);
        }
      } catch {
        setD(emptyDash);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
      </div>
    </div>
  );

  if (!d) return null;

  const ganancia = Number(d.ventasMes.total) - Number(d.ventasMes.costo);
  const gastos = Number(d.gastosMes);
  const neto = ganancia - gastos;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen general de tu negocio</p>
        </div>
        <Link href="/ventas/nueva" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30">
          + Nueva Venta
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard icon="💰" label="Ventas Hoy" value={formatSoles(d.ventasHoy.total)} sub={`${d.ventasHoy.count} operaciones`} gradient="from-emerald-500/10 to-emerald-600/5" border="border-emerald-500/20" glow="glow-green" />
        <MetricCard icon="📈" label="Ventas del Mes" value={formatSoles(d.ventasMes.total)} sub={`${d.ventasMes.count} ventas totales`} gradient="from-blue-500/10 to-blue-600/5" border="border-blue-500/20" glow="glow-blue" />
        <MetricCard icon="🎯" label="Ganancia Bruta" value={formatSoles(ganancia)} sub={`Neto: ${formatSoles(neto)}`} gradient="from-violet-500/10 to-violet-600/5" border="border-violet-500/20" glow="glow-purple" />
        <MetricCard icon="💸" label="Gastos del Mes" value={formatSoles(gastos)} sub="total acumulado" gradient="from-red-500/10 to-red-600/5" border="border-red-500/20" glow="glow-red" />
        <MetricCard icon="📦" label="Productos" value={String(d.prodCount)} sub="en inventario activo" gradient="from-amber-500/10 to-amber-600/5" border="border-amber-500/20" glow="glow-amber" />
        <MetricCard icon="👥" label="Clientes" value={String(d.cliCount)} sub="registrados" gradient="from-cyan-500/10 to-cyan-600/5" border="border-cyan-500/20" glow="glow-blue" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Stock Bajo */}
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            Stock Bajo
          </h2>
          {d.stockBajo.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-green-400 text-sm">✓ Todo en orden</p>
              <p className="text-gray-600 text-xs mt-1">Stock suficiente en todos los productos</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {d.stockBajo.map((p) => (
                <li key={p.id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <Link href={`/productos/${p.id}`} className="text-sm text-red-300 hover:text-red-200 transition">{p.nombre}</Link>
                  <span className="bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium">
                    {p.stock}/{p.stockMinimo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top Productos */}
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />
            Top Productos
          </h2>
          {d.topProductos.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Aún sin datos de ventas</p>
          ) : (
            <ul className="space-y-2.5">
              {d.topProductos.map((p, i) => (
                <li key={i} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-amber-500/20 text-amber-300" : i === 1 ? "bg-gray-400/20 text-gray-300" : "bg-orange-800/20 text-orange-400"
                    }`}>{i + 1}</span>
                    <span className="text-gray-200">{p.productoNombre}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-medium">{formatSoles(p.totalVentas)}</span>
                    <span className="text-gray-600 text-xs ml-1.5">{p.totalUnidades}u</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Últimas Ventas */}
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-violet-400 rounded-full" />
            Últimas Ventas
          </h2>
          {d.ultimasVentas.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Sin ventas recientes</p>
          ) : (
            <ul className="space-y-2.5">
              {d.ultimasVentas.map((v) => (
                <li key={v.id} className="flex justify-between items-center text-sm py-1.5">
                  <div>
                    <span className="text-gray-500 font-mono text-xs">#{v.id}</span>
                    <span className="text-gray-300 ml-2">{v.clienteNombre}</span>
                  </div>
                  <span className="font-semibold text-white">{formatSoles(v.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, gradient, border, glow }: {
  icon: string; label: string; value: string; sub: string; gradient: string; border: string; glow: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} ${border} border rounded-2xl p-5 ${glow} transition-all hover:scale-[1.02]`}>
      <p className="text-sm text-gray-400 flex items-center gap-1.5">
        <span>{icon}</span> {label}
      </p>
      <p className="text-2xl font-bold mt-2 text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
