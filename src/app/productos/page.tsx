"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSoles } from "@/lib/utils";

interface Producto {
  id: number; nombre: string; sku: string | null;
  precioCosto: string; precioVenta: string; precioEspecial: string | null;
  stock: number; stockMinimo: number; unidad: string;
  categoriaNombre: string | null; categoriaColor: string | null;
}
interface Cat { id: number; nombre: string; color: string }

export default function ProductosPage() {
  const [prods, setProds] = useState<Producto[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCat, setNewCat] = useState({ nombre: "", color: "#8b5cf6" });

  const load = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (catFilter) params.set("categoria", catFilter);
    fetch(`/api/productos?${params}`).then(r => r.ok ? r.json() : []).then(setProds).catch(() => setProds([]));
  };

  useEffect(() => {
    fetch("/api/setup").catch(() => {}).finally(() => {
      load();
      fetch("/api/categorias").then(r => r.ok ? r.json() : []).then(setCats).catch(() => {});
    });
  }, []);
  useEffect(() => { load(); }, [q, catFilter]);

  const delCat = async (id: number) => {
    await fetch("/api/categorias", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setCats(cats.filter(c => c.id !== id));
  };

  const addCat = async () => {
    if (!newCat.nombre.trim()) return;
    const r = await fetch("/api/categorias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newCat) });
    const c = await r.json();
    setCats([...cats, c]);
    setNewCat({ nombre: "", color: "#8b5cf6" });
  };

  const delProd = async (id: number) => {
    if (!confirm("¿Desactivar este producto?")) return;
    await fetch(`/api/productos/${id}`, { method: "DELETE" });
    load();
  };

  const totalStockCosto = prods.reduce((s, p) => s + (Number(p.precioCosto) * p.stock), 0);
  const totalGananciaPotencial = prods.reduce((s, p) => s + (Number(p.precioVenta) - Number(p.precioCosto)) * p.stock, 0);
  const totalStockUnidades = prods.reduce((s, p) => s + p.stock, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Productos</h1>
          <p className="text-gray-500 text-sm mt-1">{prods.length} productos · Inversión: {formatSoles(totalStockCosto)} · Potencial: <span className="text-blue-400">{formatSoles(totalGananciaPotencial)}</span></p>
        </div>
        <div className="flex gap-2">
          <Link href="/productos/rentabilidad" className="glass hover:bg-white/10 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5">
            💎 Rentabilidad
          </Link>
          <button onClick={() => setShowCatModal(!showCatModal)} className="glass hover:bg-white/10 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
            🏷️ Categorías
          </button>
          <Link href="/productos/nuevo" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/20">
            + Nuevo Producto
          </Link>
        </div>
      </div>

      {showCatModal && (
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-white">Gestionar Categorías</h3>
          <div className="flex gap-2 flex-wrap">
            {cats.map(c => (
              <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-white font-medium" style={{ backgroundColor: c.color + "33", border: `1px solid ${c.color}55` }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.nombre}
                <button onClick={() => delCat(c.id)} className="ml-1 opacity-60 hover:opacity-100 transition">×</button>
              </span>
            ))}
            {cats.length === 0 && <p className="text-gray-500 text-sm">Sin categorías</p>}
          </div>
          <div className="flex gap-2 items-center">
            <input value={newCat.nombre} onChange={e => setNewCat({ ...newCat, nombre: e.target.value })} placeholder="Nueva categoría..." className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm flex-1 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50" />
            <input type="color" value={newCat.color} onChange={e => setNewCat({ ...newCat, color: e.target.value })} className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border border-white/10" />
            <button onClick={addCat} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-500 transition">Agregar</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition">
          <option value="">Todas las categorías</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Costo</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Venta</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Especial</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Margen/u</th>
                <th className="px-5 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Si vendo todo</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {prods.map(p => {
                const margen = Number(p.precioVenta) - Number(p.precioCosto);
                const margenPct = Number(p.precioCosto) > 0 ? (margen / Number(p.precioCosto) * 100) : 0;
                const bajo = p.stock <= p.stockMinimo;
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-white">{p.nombre}</p>
                        {p.sku && <p className="text-xs text-gray-500 font-mono mt-0.5">{p.sku}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {p.categoriaNombre ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: (p.categoriaColor || "#8b5cf6") + "22", color: p.categoriaColor || "#8b5cf6", border: `1px solid ${p.categoriaColor || "#8b5cf6"}33` }}>
                          {p.categoriaNombre}
                        </span>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-400 font-mono text-xs">{formatSoles(p.precioCosto)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-white font-mono">{formatSoles(p.precioVenta)}</td>
                    <td className="px-5 py-4 text-right">
                      {p.precioEspecial ? (
                        <span className="text-amber-400 font-mono font-medium">{formatSoles(p.precioEspecial)}</span>
                      ) : <span className="text-gray-700">—</span>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-mono text-sm ${margen >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatSoles(margen)}
                      </span>
                      <span className="text-gray-600 text-xs ml-1">({margenPct.toFixed(0)}%)</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                        bajo ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {bajo && <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-mono text-sm font-semibold ${margen * p.stock > 0 ? "text-blue-400" : "text-gray-700"}`}>
                        {formatSoles(margen * p.stock)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/productos/${p.id}`} className="text-violet-400 hover:text-violet-300 text-xs font-medium transition">Editar</Link>
                        <button onClick={() => delProd(p.id)} className="text-gray-600 hover:text-red-400 text-xs transition">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {prods.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <p className="text-gray-500">No hay productos</p>
                    <Link href="/productos/nuevo" className="text-violet-400 hover:text-violet-300 text-sm mt-2 inline-block">Crear el primero →</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
