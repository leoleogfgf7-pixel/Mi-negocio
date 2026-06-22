"use client";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";

interface Mov { id: number; productoNombre: string; tipo: string; cantidad: number; motivo: string | null; referencia: string | null; createdAt: string }
interface Prod { id: number; nombre: string; stock: number }

export default function MovimientosPage() {
  const [movs, setMovs] = useState<Mov[]>([]);
  const [prods, setProds] = useState<Prod[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productoId: "", tipo: "entrada", cantidad: "1", motivo: "" });

  const load = () => { fetch("/api/movimientos").then(r => r.ok ? r.json() : []).then(setMovs).catch(() => setMovs([])); };
  useEffect(() => {
    fetch("/api/setup").catch(() => {}).finally(() => {
      load();
      fetch("/api/productos").then(r => r.ok ? r.json() : []).then(setProds).catch(() => {});
    });
  }, []);

  const save = async () => {
    if (!form.productoId || !form.cantidad) return alert("Producto y cantidad requeridos");
    await fetch("/api/movimientos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false); setForm({ productoId: "", tipo: "entrada", cantidad: "1", motivo: "" }); load();
    fetch("/api/productos").then(r => r.json()).then(setProds);
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition";

  const tipoStyle: Record<string, { bg: string; text: string; icon: string }> = {
    entrada: { bg: "bg-emerald-500/15 border-emerald-500/20", text: "text-emerald-400", icon: "↑" },
    salida: { bg: "bg-red-500/15 border-red-500/20", text: "text-red-400", icon: "↓" },
    ajuste: { bg: "bg-amber-500/15 border-amber-500/20", text: "text-amber-400", icon: "=" },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Movimientos de Stock</h1>
          <p className="text-gray-500 text-sm mt-1">{movs.length} registros</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20">
          + Nuevo Movimiento
        </button>
      </div>

      {showForm && (
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-white">Registrar Movimiento</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <select value={form.productoId} onChange={e => setForm({ ...form, productoId: e.target.value })} className={inputCls}>
              <option value="">Seleccionar producto</option>
              {prods.map(p => <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>)}
            </select>
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className={inputCls}>
              <option value="entrada">↑ Entrada</option>
              <option value="salida">↓ Salida</option>
              <option value="ajuste">= Ajuste (fijar stock)</option>
            </select>
            <input type="number" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} placeholder="Cantidad" className={inputCls} min="1" />
            <input value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} placeholder="Motivo" className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-500 transition">Guardar</button>
            <button onClick={() => setShowForm(false)} className="glass hover:bg-white/10 px-5 py-2.5 rounded-xl text-sm font-medium transition">Cancelar</button>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Cantidad</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Motivo</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {movs.map(m => {
                const style = tipoStyle[m.tipo] || tipoStyle.ajuste;
                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 text-gray-500 text-xs">{formatDateTime(m.createdAt)}</td>
                    <td className="px-5 py-4 font-semibold text-white">{m.productoNombre}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.text}`}>
                        {style.icon} {m.tipo}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-mono font-bold ${style.text}`}>
                        {m.tipo === "entrada" ? "+" : m.tipo === "salida" ? "-" : "="}{m.cantidad}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">{m.motivo || "—"}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{m.referencia || "—"}</td>
                  </tr>
                );
              })}
              {movs.length === 0 && <tr><td colSpan={6} className="text-center py-16 text-gray-600">Sin movimientos registrados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
