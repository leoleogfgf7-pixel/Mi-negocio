"use client";
import { useEffect, useState } from "react";
import { formatSoles } from "@/lib/utils";

interface ReportData {
  ventasPorDia: { dia: string; total: string; costo: string; count: number }[];
  topProductos: { nombre: string; unidades: number; ingresos: string; costo: string }[];
  porMetodo: { metodo: string; total: string; count: number }[];
  inventario: { totalCosto: string; totalVenta: string; items: number };
  gastosMes: { categoria: string; total: string }[];
  totalGastos: number;
  gananciasMes: number;
  netoMes: number;
}

export default function ReportesPage() {
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    fetch("/api/setup").catch(() => {}).finally(() => {
      fetch("/api/reportes").then(r => r.ok ? r.json() : null).then(d => {
        setData(d || {
          ventasPorDia: [], topProductos: [], porMetodo: [],
          inventario: { totalCosto: "0", totalVenta: "0", items: 0 },
          gastosMes: [], totalGastos: 0, gananciasMes: 0, netoMes: 0,
        });
      }).catch(() => setData({
        ventasPorDia: [], topProductos: [], porMetodo: [],
        inventario: { totalCosto: "0", totalVenta: "0", items: 0 },
        gastosMes: [], totalGastos: 0, gananciasMes: 0, netoMes: 0,
      }));
    });
  }, []);

  if (!data) return (
    <div className="flex justify-center items-center py-32">
      <div className="w-12 h-12 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
    </div>
  );

  const maxVenta = Math.max(...data.ventasPorDia.map(d => Number(d.total)), 1);

  const metodoPagoColors: Record<string, string> = {
    efectivo: "bg-emerald-500", yape: "bg-purple-500", plin: "bg-cyan-500",
    transferencia: "bg-blue-500", tarjeta: "bg-amber-500", otro: "bg-gray-500",
  };

  const totalMetodos = data.porMetodo.reduce((s, m) => s + Number(m.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Análisis de rendimiento del negocio</p>
      </div>

      {/* Big metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-5 glow-green">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Ganancia Bruta (30d)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{formatSoles(data.gananciasMes)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl p-5 glow-red">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Gastos del Mes</p>
          <p className="text-2xl font-bold text-red-400 mt-2">{formatSoles(data.totalGastos)}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 rounded-2xl p-5 glow-purple">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Resultado Neto</p>
          <p className={`text-2xl font-bold mt-2 ${data.netoMes >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatSoles(data.netoMes)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 glow-blue">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Inventario Valorizado</p>
          <p className="text-2xl font-bold text-blue-400 mt-2">{formatSoles(data.inventario.totalVenta)}</p>
          <p className="text-xs text-gray-600 mt-1">Costo: {formatSoles(data.inventario.totalCosto)} · {data.inventario.items} productos</p>
        </div>
      </div>

      {/* Chart: ventas ultimos 30 dias */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold text-lg text-white mb-1">Ventas últimos 30 días</h2>
        <p className="text-gray-500 text-xs mb-6">{data.ventasPorDia.length} días con ventas</p>
        {data.ventasPorDia.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Sin datos de ventas</p>
        ) : (
          <div className="flex items-end gap-1 h-48 overflow-x-auto pb-2">
            {data.ventasPorDia.map((d, i) => {
              const pct = (Number(d.total) / maxVenta) * 100;
              const ganancia = Number(d.total) - Number(d.costo);
              return (
                <div key={i} className="flex flex-col items-center gap-1 min-w-[28px] group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 glass-strong rounded-lg px-3 py-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    <p className="text-white font-semibold">{formatSoles(d.total)}</p>
                    <p className="text-emerald-400">Ganancia: {formatSoles(ganancia)}</p>
                    <p className="text-gray-400">{d.count} ventas · {d.dia.slice(5)}</p>
                  </div>
                  <div
                    className="w-5 rounded-t-sm bg-gradient-to-t from-violet-600 to-indigo-400 hover:from-violet-500 hover:to-indigo-300 transition-all cursor-pointer"
                    style={{ height: `${Math.max(pct, 3)}%` }}
                  />
                  <span className="text-[9px] text-gray-600 rotate-[-45deg] origin-top-left mt-1">{d.dia.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top Productos */}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold text-lg text-white mb-4">🏆 Top Productos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2 text-xs text-gray-500 uppercase">#</th>
                  <th className="text-left py-2 text-xs text-gray-500 uppercase">Producto</th>
                  <th className="text-right py-2 text-xs text-gray-500 uppercase">Unids.</th>
                  <th className="text-right py-2 text-xs text-gray-500 uppercase">Ingresos</th>
                  <th className="text-right py-2 text-xs text-gray-500 uppercase">Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.topProductos.map((p, i) => {
                  const ganancia = Number(p.ingresos) - Number(p.costo);
                  return (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="py-3">
                        <span className={`w-6 h-6 inline-flex items-center justify-center rounded text-xs font-bold ${
                          i === 0 ? "bg-amber-500/20 text-amber-300" : i === 1 ? "bg-gray-500/20 text-gray-300" : i === 2 ? "bg-orange-800/20 text-orange-400" : "text-gray-600"
                        }`}>{i + 1}</span>
                      </td>
                      <td className="py-3 text-white font-medium">{p.nombre}</td>
                      <td className="py-3 text-right text-gray-400 font-mono">{p.unidades}</td>
                      <td className="py-3 text-right text-white font-mono">{formatSoles(p.ingresos)}</td>
                      <td className="py-3 text-right text-emerald-400 font-mono">{formatSoles(ganancia)}</td>
                    </tr>
                  );
                })}
                {data.topProductos.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-600">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          {/* Métodos de pago */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-lg text-white mb-4">💳 Métodos de Pago</h2>
            {data.porMetodo.length === 0 ? (
              <p className="text-gray-600 text-center py-4">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {data.porMetodo.map((m, i) => {
                  const pct = totalMetodos > 0 ? (Number(m.total) / totalMetodos) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-300">{m.metodo}</span>
                        <span className="text-white font-mono">{formatSoles(m.total)} <span className="text-gray-600 text-xs">({pct.toFixed(0)}%)</span></span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${metodoPagoColors[m.metodo] || "bg-gray-500"} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gastos por categoria */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-lg text-white mb-4">💸 Gastos por Categoría</h2>
            {data.gastosMes.length === 0 ? (
              <p className="text-gray-600 text-center py-4">Sin gastos este mes</p>
            ) : (
              <div className="space-y-2.5">
                {data.gastosMes.map((g, i) => {
                  const pct = data.totalGastos > 0 ? (Number(g.total) / data.totalGastos) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="capitalize text-gray-300 text-sm w-24 shrink-0">{g.categoria}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-red-400 font-mono text-sm shrink-0">{formatSoles(g.total)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
