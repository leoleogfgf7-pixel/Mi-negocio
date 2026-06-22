"use client";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";

interface Cliente { id: number; nombre: string; email: string | null; telefono: string | null; direccion: string | null; ruc: string | null; notas: string | null; createdAt: string }

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", direccion: "", ruc: "", notas: "" });

  const load = () => { fetch(`/api/clientes?q=${q}`).then(r => r.ok ? r.json() : []).then(setClientes).catch(() => setClientes([])); };
  useEffect(() => { fetch("/api/setup").catch(() => {}).finally(() => load()); }, []);
  useEffect(() => { load(); }, [q]);

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const save = async () => {
    if (!form.nombre.trim()) return alert("Nombre requerido");
    if (editing) {
      await fetch(`/api/clientes/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/clientes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setShowForm(false); setEditing(null); setForm({ nombre: "", email: "", telefono: "", direccion: "", ruc: "", notas: "" }); load();
  };

  const edit = (c: Cliente) => {
    setEditing(c);
    setForm({ nombre: c.nombre, email: c.email || "", telefono: c.telefono || "", direccion: c.direccion || "", ruc: c.ruc || "", notas: c.notas || "" });
    setShowForm(true);
  };

  const del = async (id: number) => {
    if (!confirm("¿Eliminar cliente?")) return;
    await fetch(`/api/clientes/${id}`, { method: "DELETE" }); load();
  };

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{clientes.length} clientes registrados</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ nombre: "", email: "", telefono: "", direccion: "", ruc: "", notas: "" }); }}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20">
          + Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-white">{editing ? "Editar" : "Nuevo"} Cliente</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <input value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre *" className={inputCls} />
            <input value={form.ruc} onChange={e => set("ruc", e.target.value)} placeholder="RUC / DNI" className={inputCls} />
            <input value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="Teléfono" className={inputCls} />
            <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="Email" className={inputCls} />
            <input value={form.direccion} onChange={e => set("direccion", e.target.value)} placeholder="Dirección" className={inputCls} />
            <input value={form.notas} onChange={e => set("notas", e.target.value)} placeholder="Notas" className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-violet-500 transition">Guardar</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="glass hover:bg-white/10 px-5 py-2.5 rounded-xl text-sm font-medium transition">Cancelar</button>
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cliente..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition" />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">RUC/DNI</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Teléfono</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Dirección</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clientes.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white">{c.nombre}</p>
                    {c.notas && <p className="text-xs text-gray-600 mt-0.5">{c.notas}</p>}
                  </td>
                  <td className="px-5 py-4 text-gray-400 font-mono">{c.ruc || "—"}</td>
                  <td className="px-5 py-4 text-gray-300">{c.telefono || "—"}</td>
                  <td className="px-5 py-4 text-gray-400">{c.email || "—"}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">{c.direccion || "—"}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => edit(c)} className="text-violet-400 hover:text-violet-300 text-xs font-medium transition">Editar</button>
                      <button onClick={() => del(c.id)} className="text-gray-600 hover:text-red-400 text-xs transition">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && <tr><td colSpan={6} className="text-center py-16 text-gray-600">Sin clientes registrados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
