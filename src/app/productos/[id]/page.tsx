"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { formatSoles } from "@/lib/utils";

interface Cat { id: number; nombre: string }

export default function ProductoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "", sku: "", descripcion: "", categoriaId: "",
    precioCosto: "", precioVenta: "", precioEspecial: "",
    stock: "0", stockMinimo: "5", unidad: "unidad",
  });

  useEffect(() => {
    fetch("/api/setup").catch(() => {}).finally(() => {
      fetch(`/api/productos/${id}`).then(r => r.ok ? r.json() : null).then(p => {
        if (p && !p.error) {
          setForm({
            nombre: p.nombre || "", sku: p.sku || "", descripcion: p.descripcion || "",
            categoriaId: p.categoriaId ? String(p.categoriaId) : "",
            precioCosto: p.precioCosto || "0", precioVenta: p.precioVenta || "0",
            precioEspecial: p.precioEspecial || "",
            stock: String(p.stock ?? 0), stockMinimo: String(p.stockMinimo ?? 5),
            unidad: p.unidad || "unidad",
          });
        }
      }).catch(() => {});
      fetch("/api/categorias").then(r => r.ok ? r.json() : []).then(setCats).catch(() => {});
    });
  }, [id]);

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const margen = Number(form.precioVenta || 0) - Number(form.precioCosto || 0);

  const save = async () => {
    if (!form.nombre.trim()) return alert("Nombre requerido");
    setSaving(true);
    await fetch(`/api/productos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    router.push("/productos");
  };

  const del = async () => {
    if (!confirm("¿Desactivar este producto?")) return;
    await fetch(`/api/productos/${id}`, { method: "DELETE" });
    router.push("/productos");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Editar Producto</h1>
          <p className="text-gray-500 text-sm mt-1">ID #{id}</p>
        </div>
        <button onClick={del} className="text-red-400 hover:text-red-300 text-sm font-medium transition">🗑 Desactivar</button>
      </div>
      <div className="glass-strong rounded-2xl p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <DarkField label="Nombre *" value={form.nombre} onChange={v => set("nombre", v)} />
          <DarkField label="SKU" value={form.sku} onChange={v => set("sku", v)} />
        </div>
        <DarkField label="Descripción" value={form.descripcion} onChange={v => set("descripcion", v)} textarea />
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Categoría</label>
            <select value={form.categoriaId} onChange={e => set("categoriaId", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition">
              <option value="">Sin categoría</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Unidad</label>
            <select value={form.unidad} onChange={e => set("unidad", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition">
              {["unidad", "kg", "litro", "metro", "caja", "par", "servicio"].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-white/5 pt-5">
          <h3 className="font-semibold mb-4 text-white flex items-center gap-2">💰 Precios <span className="text-xs text-gray-500 font-normal">(en Soles)</span></h3>
          <div className="grid md:grid-cols-3 gap-4">
            <DarkField label="Costo (S/)" value={form.precioCosto} onChange={v => set("precioCosto", v)} type="number" />
            <DarkField label="Venta (S/)" value={form.precioVenta} onChange={v => set("precioVenta", v)} type="number" />
            <DarkField label="Especial (S/)" value={form.precioEspecial} onChange={v => set("precioEspecial", v)} type="number" placeholder="Opcional" />
          </div>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-gray-500">Margen: <span className={`font-semibold ${margen >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatSoles(margen)}</span></span>
            {form.precioEspecial && (
              <span className="text-gray-500">Especial: <span className="font-semibold text-amber-400">{formatSoles(Number(form.precioEspecial) - Number(form.precioCosto || 0))}</span></span>
            )}
          </div>
        </div>

        <div className="border-t border-white/5 pt-5">
          <h3 className="font-semibold mb-4 text-white">📦 Stock</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <DarkField label="Stock Actual" value={form.stock} onChange={v => set("stock", v)} type="number" />
            <DarkField label="Stock Mínimo" value={form.stockMinimo} onChange={v => set("stockMinimo", v)} type="number" />
          </div>
        </div>

        <div className="flex gap-3 pt-3">
          <button onClick={save} disabled={saving} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/20">
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button onClick={() => router.push("/productos")} className="glass hover:bg-white/10 px-6 py-2.5 rounded-xl font-medium transition">Volver</button>
        </div>
      </div>
    </div>
  );
}

function DarkField({ label, value, onChange, type = "text", textarea, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; textarea?: boolean; placeholder?: string;
}) {
  const cls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition";
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} className={cls} rows={2} placeholder={placeholder} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={cls} placeholder={placeholder} step={type === "number" ? "0.01" : undefined} />
      )}
    </div>
  );
}
