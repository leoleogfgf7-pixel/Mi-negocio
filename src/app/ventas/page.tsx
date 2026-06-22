"use client";
import { useEffect, useState, Fragment } from "react";
import Link from "next/link";
import { formatSoles, formatDateTime } from "@/lib/utils";

interface Venta {
  id: number; clienteNombre: string; total: string; subtotal: string;
  descuento: string; costo: string; metodoPago: string; estado: string; createdAt: string;
  items: { productoNombre: string; cantidad: number; precioUnitario: string; subtotal: string; usoPrecioEspecial: boolean }[];
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState("");
  const [selMes, setSelMes] = useState(new Date().getMonth() + 1);
  const [selAnio, setSelAnio] = useState(new Date().getFullYear());

  const load = () => {
    const p = filter ? `?estado=${filter}` : "";
    fetch(`/api/ventas${p}`).then(r => r.ok ? r.json() : []).then(setVentas).catch(() => setVentas([]));
  };
  useEffect(() => { fetch("/api/setup").catch(() => {}).finally(() => load()); }, []);
  useEffect(() => { load(); }, [filter]);

  const cancelar = async (id: number) => {
    if (!confirm("¿Cancelar esta venta? Se devolverá el stock.")) return;
    await fetch(`/api/ventas/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: "cancelada" }) });
    load();
  };

  const eliminar = async (id: number) => {
    if (!confirm(`¿ELIMINAR la venta #${id}? Se borrará permanentemente y se devolverá el stock.`)) return;
    const res = await fetch(`/api/ventas/${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
    } else {
      alert("Error al eliminar la venta");
    }
  };

  const adminAction = async (action: string, extra?: Record<string, unknown>) => {
    const label = action === "reset_all" ? "REINICIAR TODO (productos, clientes, ventas, gastos, ABSOLUTAMENTE TODO)" :
                  action === "delete_all_ventas" ? "BORRAR TODAS LAS VENTAS y movimientos" :
                  `BORRAR las ventas de ${MESES[selMes - 1]} ${selAnio}`;
    if (!confirm(`⚠️ ¿Estás seguro de ${label}?\n\nEsta acción NO se puede deshacer.`)) return;
    if (!confirm(`🔴 ÚLTIMA CONFIRMACIÓN: ¿Realmente quieres ${label}?`)) return;

    setAdminLoading(true);
    setAdminMsg("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminMsg(`✅ ${data.message}`);
        load();
      } else {
        setAdminMsg(`❌ Error: ${data.error}`);
      }
    } catch {
      setAdminMsg("❌ Error de conexión");
    } finally {
      setAdminLoading(false);
    }
  };

  const completadas = ventas.filter(v => v.estado === "completada");
  const total = completadas.reduce((s, v) => s + Number(v.total), 0);
  const ganancia = completadas.reduce((s, v) => s + Number(v.total) - Number(v.costo || 0), 0);

  const metodoPagoIcon: Record<string, string> = {
    efectivo: "💵", yape: "📱", plin: "📲", transferencia: "🏦", tarjeta: "💳", otro: "💫"
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Ventas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {completadas.length} completadas · Total: <span className="text-emerald-400 font-semibold">{formatSoles(total)}</span>
            {ganancia > 0 && <> · Ganancia: <span className="text-violet-400 font-semibold">{formatSoles(ganancia)}</span></>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAdmin(!showAdmin)}
            className="glass hover:bg-white/10 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
            ⚙️ Administrar
          </button>
          <Link href="/ventas/nueva" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-emerald-500 hover:to-green-500 transition-all shadow-lg shadow-emerald-500/20">
            + Nueva Venta
          </Link>
        </div>
      </div>

      {/* Admin panel */}
      {showAdmin && (
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            ⚙️ Panel de Administración
            <span className="text-xs text-red-400 font-normal">Acciones irreversibles</span>
          </h3>

          {adminMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm ${adminMsg.startsWith("✅") ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
              {adminMsg}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            {/* Delete month */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-amber-400">📅 Borrar ventas de un mes</h4>
              <p className="text-xs text-gray-500">Elimina ventas, movimientos y gastos de un mes específico. El stock se restaura.</p>
              <div className="flex gap-2">
                <select value={selMes} onChange={e => setSelMes(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white flex-1 focus:outline-none">
                  {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <input type="number" value={selAnio} onChange={e => setSelAnio(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white w-20 focus:outline-none" />
              </div>
              <button onClick={() => adminAction("delete_ventas_mes", { month: selMes, year: selAnio })} disabled={adminLoading}
                className="w-full bg-amber-600/20 border border-amber-500/30 text-amber-400 py-2 rounded-lg text-sm font-medium hover:bg-amber-600/30 transition disabled:opacity-50">
                {adminLoading ? "Procesando..." : `Borrar ${MESES[selMes - 1]} ${selAnio}`}
              </button>
            </div>

            {/* Delete all sales */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-orange-400">🗑 Borrar todas las ventas</h4>
              <p className="text-xs text-gray-500">Elimina TODAS las ventas y movimientos. Los productos y clientes se mantienen. Stock se restaura.</p>
              <button onClick={() => adminAction("delete_all_ventas")} disabled={adminLoading}
                className="w-full bg-orange-600/20 border border-orange-500/30 text-orange-400 py-2 rounded-lg text-sm font-medium hover:bg-orange-600/30 transition disabled:opacity-50 mt-auto">
                {adminLoading ? "Procesando..." : "Borrar todas las ventas"}
              </button>
            </div>

            {/* Reset everything */}
            <div className="bg-white/[0.03] border border-red-500/10 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-red-400">💣 Reiniciar TODO desde 0</h4>
              <p className="text-xs text-gray-500">Borra ABSOLUTAMENTE TODO: productos, clientes, ventas, gastos, categorías. Empezar de cero.</p>
              <button onClick={() => adminAction("reset_all")} disabled={adminLoading}
                className="w-full bg-red-600/20 border border-red-500/30 text-red-400 py-2 rounded-lg text-sm font-medium hover:bg-red-600/30 transition disabled:opacity-50 mt-auto">
                {adminLoading ? "Procesando..." : "⚠️ REINICIAR TODO"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {["", "completada", "cancelada"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}>
            {f === "" ? "Todas" : f === "completada" ? "✓ Completadas" : "✕ Canceladas"}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Pago</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ventas.map(v => (
                <Fragment key={v.id}>
                  <tr className="hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
                    <td className="px-5 py-4 font-mono text-gray-400">{v.id}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{formatDateTime(v.createdAt)}</td>
                    <td className="px-5 py-4 text-white font-medium">{v.clienteNombre}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-gray-300 capitalize">
                        {metodoPagoIcon[v.metodoPago] || "💫"} {v.metodoPago}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-white font-mono">{formatSoles(v.total)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        v.estado === "completada" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"
                      }`}>
                        {v.estado === "completada" ? "✓" : "✕"} {v.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                        {v.estado === "completada" && (
                          <button onClick={() => cancelar(v.id)} className="text-amber-500/70 hover:text-amber-400 text-xs transition">
                            Cancelar
                          </button>
                        )}
                        <button onClick={() => eliminar(v.id)} className="text-gray-600 hover:text-red-400 text-xs transition">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === v.id && (
                    <tr>
                      <td colSpan={7} className="bg-white/[0.02] px-8 py-4 border-t border-white/5">
                        <div className="space-y-1.5">
                          {v.items.map((it, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-gray-300">
                                {it.productoNombre} × {it.cantidad}
                                {it.usoPrecioEspecial && <span className="text-amber-400 ml-1.5">⭐ Especial</span>}
                                <span className="text-gray-600 ml-1.5">@ {formatSoles(it.precioUnitario)}</span>
                              </span>
                              <span className="text-white font-mono">{formatSoles(it.subtotal)}</span>
                            </div>
                          ))}
                          {Number(v.descuento) > 0 && (
                            <div className="flex justify-between text-xs text-red-400 pt-1 border-t border-white/5">
                              <span>Descuento</span>
                              <span>-{formatSoles(v.descuento)}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {ventas.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-gray-600">Sin ventas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
