"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney, formatDateTime, formatNumber } from "@/lib/format";

type Producto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  sku: string | null;
  categoriaId: number | null;
  categoriaNombre: string | null;
  categoriaColor: string | null;
  precioCompra: string;
  precioVenta: string;
  precioMayor: string;
  stockActual: number;
  stockMinimo: number;
  unidad: string;
  activo: boolean;
};

type Categoria = { id: number; nombre: string };

type Movimiento = {
  id: number;
  fecha: Date | string;
  tipo: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string | null;
  referencia: string | null;
};

import { useAuth } from "./AuthProvider";

export default function ProductoDetalleClient({
  producto: initial,
  categorias,
  movimientos: movsIniciales,
  stats,
}: {
  producto: Producto;
  categorias: Categoria[];
  movimientos: Movimiento[];
  stats: { totalVendido: number; totalIngresos: string; ventasCount: number };
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMov, setShowMov] = useState(false);
  const [movTipo, setMovTipo] = useState<"entrada" | "salida" | "ajuste">("entrada");
  const [movCant, setMovCant] = useState("1");
  const [movMotivo, setMovMotivo] = useState("");

  const [nombre, setNombre] = useState(initial.nombre);
  const [descripcion, setDescripcion] = useState(initial.descripcion ?? "");
  const [sku, setSku] = useState(initial.sku ?? "");
  const [categoriaId, setCategoriaId] = useState(
    initial.categoriaId ? String(initial.categoriaId) : ""
  );
  const [precioCompra, setPrecioCompra] = useState(initial.precioCompra);
  const [precioVenta, setPrecioVenta] = useState(initial.precioVenta);
  const [precioMayor, setPrecioMayor] = useState(initial.precioMayor || "0");
  const [stockMinimo, setStockMinimo] = useState(String(initial.stockMinimo));
  const [unidad, setUnidad] = useState(initial.unidad);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/productos/${initial.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        descripcion,
        sku,
        categoriaId: categoriaId ? Number(categoriaId) : null,
        precioCompra,
        precioVenta,
        precioMayor,
        stockMinimo,
        unidad,
        activo: initial.activo,
      }),
    });
    setSaving(false);
    setEdit(false);
    router.refresh();
  }

  async function regMov(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/productos/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: movTipo,
        cantidad: Number(movCant),
        motivo: movMotivo,
      }),
    });
    setShowMov(false);
    setMovCant("1");
    setMovMotivo("");
    router.refresh();
  }

  const bajo = initial.stockActual <= initial.stockMinimo;
  const gananciaMenor =
    parseFloat(initial.precioVenta) - parseFloat(initial.precioCompra);
  const gananciaMayor =
    parseFloat(initial.precioMayor || "0") - parseFloat(initial.precioCompra);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/productos" className="text-slate-500 hover:text-slate-700">
          ← Stock
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{initial.nombre}</h1>
            {initial.descripcion && (
              <p className="mt-1 text-sm text-slate-600">{initial.descripcion}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {initial.sku && (
                <span className="badge bg-slate-100 text-slate-700">
                  SKU: {initial.sku}
                </span>
              )}
              {initial.categoriaNombre && (
                <span
                  className="badge"
                  style={{
                    backgroundColor: `${initial.categoriaColor}20`,
                    color: initial.categoriaColor || "#475569",
                  }}
                >
                  {initial.categoriaNombre}
                </span>
              )}
              <span className="badge bg-slate-100 text-slate-700">
                {initial.unidad}
              </span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => setShowMov(true)} className="btn btn-secondary">
                🔄 Movimiento stock
              </button>
              <button onClick={() => setEdit(!edit)} className="btn btn-primary">
                {edit ? "Cancelar" : "✏️ Editar"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Stock actual</p>
          <p className={`text-2xl font-bold ${bajo ? "text-amber-600" : "text-emerald-600"}`}>
            {formatNumber(initial.stockActual)}
          </p>
          <p className="text-xs text-slate-500">mín. {initial.stockMinimo}</p>
        </div>
        <div className="card border-emerald-200 bg-emerald-50/40">
          <p className="text-xs uppercase text-emerald-700">🛒 Precio MENOR</p>
          <p className="text-2xl font-bold text-emerald-700">
            {formatMoney(initial.precioVenta)}
          </p>
          {isAdmin && (
            <p className="text-xs text-emerald-600">
              Ganancia: {formatMoney(gananciaMenor)}
            </p>
          )}
        </div>
        <div className="card border-indigo-200 bg-indigo-50/40">
          <p className="text-xs uppercase text-indigo-700">📦 Precio MAYOR</p>
          <p className="text-2xl font-bold text-indigo-700">
            {parseFloat(initial.precioMayor || "0") > 0
              ? formatMoney(initial.precioMayor)
              : "—"}
          </p>
          {isAdmin && (
            <p className="text-xs text-indigo-600">
              Ganancia: {formatMoney(gananciaMayor)}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="card">
            <p className="text-xs uppercase text-slate-500">Costo</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatMoney(initial.precioCompra)}
            </p>
            <p className="text-xs text-slate-500">Lo que te costó</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Unidades vendidas</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatNumber(stats.totalVendido)}
          </p>
          <p className="text-xs text-slate-500">{stats.ventasCount} ventas</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Ingresos generados</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatMoney(stats.totalIngresos)}
          </p>
          <p className="text-xs text-slate-500">Histórico</p>
        </div>
      </div>

      {edit && (
        <form onSubmit={save} className="card space-y-4">
          <h2 className="text-lg font-semibold">Editar producto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Nombre</label>
              <input
                className="input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <label className="label">SKU</label>
              <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select
                className="input"
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
              >
                <option value="">Sin categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Descripción</label>
              <textarea
                className="input"
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Precio costo (S/.)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={precioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Precio MENOR (S/.)</label>
              <input
                type="number"
                step="0.01"
                className="input border-emerald-300"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Precio MAYOR (S/.)</label>
              <input
                type="number"
                step="0.01"
                className="input border-indigo-300"
                value={precioMayor}
                onChange={(e) => setPrecioMayor(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Stock mínimo</label>
              <input
                type="number"
                className="input"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Unidad</label>
              <select
                className="input"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
              >
                <option value="unidad">Unidad</option>
                <option value="kg">Kilogramo</option>
                <option value="g">Gramo</option>
                <option value="lt">Litro</option>
                <option value="mt">Metro</option>
                <option value="caja">Caja</option>
                <option value="pack">Pack</option>
                <option value="docena">Docena</option>
                <option value="ciento">Ciento</option>
                <option value="hora">Hora</option>
                <option value="servicio">Servicio</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setEdit(false)}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button disabled={saving} className="btn btn-primary">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold">📋 Historial de movimientos</h2>
        {movsIniciales.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Sin movimientos registrados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th className="text-center">Cantidad</th>
                  <th className="text-center">Stock</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movsIniciales.map((m) => (
                  <tr key={m.id}>
                    <td className="text-xs text-slate-600">
                      {formatDateTime(m.fecha)}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          m.tipo === "entrada"
                            ? "bg-emerald-100 text-emerald-800"
                            : m.tipo === "salida"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {m.tipo}
                      </span>
                    </td>
                    <td className="text-center font-semibold">
                      {m.tipo === "entrada" ? "+" : m.tipo === "salida" ? "-" : "="}
                      {m.cantidad}
                    </td>
                    <td className="text-center text-xs">
                      {m.stockAnterior} → {m.stockNuevo}
                    </td>
                    <td className="text-sm">
                      {m.motivo}
                      {m.referencia && (
                        <span className="ml-1 text-xs text-slate-500">
                          ({m.referencia})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showMov && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <form
            onSubmit={regMov}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Registrar movimiento</h3>
              <button
                type="button"
                onClick={() => setShowMov(false)}
                className="rounded p-1 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={movTipo}
                onChange={(e) =>
                  setMovTipo(e.target.value as "entrada" | "salida" | "ajuste")
                }
              >
                <option value="entrada">Entrada (compra, reposición)</option>
                <option value="salida">Salida (merma, consumo)</option>
                <option value="ajuste">Ajuste (inventario)</option>
              </select>
            </div>
            <div>
              <label className="label">
                {movTipo === "ajuste" ? "Stock final" : "Cantidad"}
              </label>
              <input
                type="number"
                min="0"
                className="input"
                value={movCant}
                onChange={(e) => setMovCant(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Motivo</label>
              <input
                className="input"
                value={movMotivo}
                onChange={(e) => setMovMotivo(e.target.value)}
                placeholder="Ej: Reposición proveedor"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setShowMov(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button className="btn btn-primary">Registrar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}