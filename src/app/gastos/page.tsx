"use client";
import { useEffect, useState } from "react";
import { formatSoles, formatDateTime } from "@/lib/utils";

interface Gasto { id: number; concepto: string; monto: string; categoria: string; notas: string | null; createdAt: string }

const categoriaOpts = ["alquiler", "sueldos", "proveedores", "servicios", "transporte", "impuestos", "marketing", "otros"];
const catColors: Record<string, string> = {
  alquiler: "text-blue-400", sueldos: "text-violet-400", proveedores: "text-amber-400",
  servicios: "text-cyan-400", transporte: "text-green-400", impuestos: "text-red-400",
  marketing: "text-pink-400", otros: "text-gray-400",
};

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ concepto: "", monto: "", categoria: "otros", notas: "" });

  const load = () => { fetch("/api/gastos").then(r => r.ok ? r.json() : []).then(setGastos).catch(() => setGastos([])); };
  useEffect(() => { fetch("/api/setup").catch(() => {}).finally(() => load()); }, []);

  const save = async () => {
    if (!form.concepto.trim() || !form.monto) return alert("Concepto y monto requeridos");
    await fetch("/api/gastos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false); setForm({ concepto: "", monto: "", categoria: "otros", notas: "" }); load();
  };

  const del = async (id: number) => {
    if (!confirm("¿Eliminar gasto?")) return;
    await fetch("/api/gastos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); load();
  };

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0);
  const byCat = gastos.reduce<Record<string, number>>((acc, g) => {
    acc[g.categoria] = (acc[g.categoria] || 0) + Number(g.monto);
    return acc;
  }, {});

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gastos</h1>
          <p className="text-gray-500 text-sm mt-1">{gastos.length} gastos · Total: <span className="text-red-400 font-semibold">{formatSoles(total)}</span></p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20">
          + Nuevo Gasto
        </button>
      </div>

      {showForm && (
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} placeholder="Concepto *" className={inputCls} />
            <input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="Monto (S/) *" className={inputCls} step="0.01" />
            <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className={inputCls}>
              {categoriaOpts.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Notas" className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-500 transition">Guardar</button>
            <button onClick={() => setShowForm(false)} className="glass hover:bg-white/10 px-5 py-2.5 rounded-xl text-sm font-medium transition">Cancelar</button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl p-4 glow-red">
          <p className="text-xs text-gray-400">Total Gastos</p>
          <p className="text-xl font-bold text-red-400 mt-1">{formatSoles(total)}</p>
        </div>
        {Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat, monto]) => (
          <div key={cat} className="glass rounded-2xl p-4">
            <p className={`text-xs capitalize ${catColors[cat] || "text-gray-400"}`}>{cat}</p>
            <p className="text-xl font-bold text-white mt-1">{formatSoles(monto)}</p>
            <p className="text-xs text-gray-600 mt-0.5">{total > 0 ? ((monto / total) * 100).toFixed(0) : 0}% del total</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Concepto</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Notas</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {gastos.map(g => (
                <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 text-gray-500 text-xs">{formatDateTime(g.createdAt)}</td>
                  <td className="px-5 py-4 font-semibold text-white">{g.concepto}</td>
                  <td className="px-5 py-4">
                    <span className={`capitalize font-medium ${catColors[g.categoria] || "text-gray-400"}`}>{g.categoria}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-red-400 font-mono">{formatSoles(g.monto)}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{g.notas || "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => del(g.id)} className="text-gray-600 hover:text-red-400 text-xs transition">Eliminar</button>
                  </td>
                </tr>
              ))}
              {gastos.length === 0 && <tr><td colSpan={6} className="text-center py-16 text-gray-600">Sin gastos registrados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
