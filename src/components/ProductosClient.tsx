"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney, formatNumber } from "@/lib/format";

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

type Categoria = { id: number; nombre: string; color: string | null };

import { useAuth } from "./AuthProvider";

export default function ProductosClient() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [filterStock, setFilterStock] = useState<string>("");
  const [showCatModal, setShowCatModal] = useState(false);

  async function load() {
    setLoading(true);
    const [p, c] = await Promise.all([
      fetch("/api/productos").then((r) => r.json()),
      fetch("/api/categorias").then((r) => r.json()),
    ]);
    setProductos(p);
    setCategorias(c);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return productos.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.descripcion?.toLowerCase().includes(q);
      const matchCat = !filterCat || String(p.categoriaId) === filterCat;
      const matchStock =
        !filterStock ||
        (filterStock === "bajo" && p.stockActual <= p.stockMinimo) ||
        (filterStock === "sin" && p.stockActual === 0) ||
        (filterStock === "ok" && p.stockActual > p.stockMinimo);
      return matchSearch && matchCat && matchStock;
    });
  }, [productos, search, filterCat, filterStock]);

  const totalStock = productos.reduce((acc, p) => acc + p.stockActual, 0);
  const valorStock = productos.reduce(
    (acc, p) => acc + parseFloat(p.precioCompra) * p.stockActual,
    0
  );
  const valorVenta = productos.reduce(
    (acc, p) => acc + parseFloat(p.precioVenta) * p.stockActual,
    0
  );
  const valorMayor = productos.reduce(
    (acc, p) => acc + parseFloat(p.precioMayor || "0") * p.stockActual,
    0
  );
  const stockBajo = productos.filter(
    (p) => p.stockActual <= p.stockMinimo
  ).length;

  async function handleDelete(p: Producto) {
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`))
      return;
    await fetch(`/api/productos/${p.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📦 Stock</h1>
          <p className="text-sm text-slate-600">
            Gestioná tus productos y niveles de inventario (precios en S/.)
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowCatModal(true)}
              className="btn btn-secondary"
            >
              🏷️ Categorías
            </button>
            <Link href="/productos/nuevo" className="btn btn-primary">
              + Nuevo producto
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total productos
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {formatNumber(productos.length)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Unidades en stock
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {formatNumber(totalStock)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Valor al costo
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {formatMoney(valorStock)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Stock bajo / Venta total
          </p>
          <p className="text-2xl font-bold text-amber-600">
            {stockBajo} / {formatMoney(valorVenta)}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Buscar por nombre, SKU..."
            className="input sm:col-span-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
          >
            <option value="">Todos los stocks</option>
            <option value="ok">Stock OK</option>
            <option value="bajo">Stock bajo</option>
            <option value="sin">Sin stock</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">📦</p>
            <p className="mt-2 text-sm text-slate-600">
              No hay productos para mostrar
            </p>
            <Link
              href="/productos/nuevo"
              className="btn btn-primary mt-4 inline-flex"
            >
              Crear primer producto
            </Link>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="text-right">Costo</th>
                <th className="text-right">Precio MENOR</th>
                <th className="text-right">Precio MAYOR</th>
                <th className="text-center">Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const costo = parseFloat(p.precioCompra);
                const venta = parseFloat(p.precioVenta);
                const mayor = parseFloat(p.precioMayor || "0");
                const margen =
                  venta > 0 ? (((venta - costo) / venta) * 100).toFixed(1) : "0";
                const bajo = p.stockActual <= p.stockMinimo;
                return (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <p className="font-medium text-slate-900">{p.nombre}</p>
                        {p.sku && (
                          <p className="text-xs text-slate-500">SKU: {p.sku}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      {p.categoriaNombre ? (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: `${p.categoriaColor}20`,
                            color: p.categoriaColor || "#475569",
                          }}
                        >
                          {p.categoriaNombre}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="text-right text-slate-600">
                        {formatMoney(p.precioCompra)}
                      </td>
                    )}
                    <td className="text-right">
                      <span className="font-semibold text-emerald-700">
                        {formatMoney(p.precioVenta)}
                      </span>
                      {isAdmin && <p className="text-xs text-emerald-600">+{margen}%</p>}
                    </td>
                    <td className="text-right">
                      <span className="font-semibold text-indigo-700">
                        {mayor > 0 ? formatMoney(p.precioMayor) : "—"}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge ${
                          bajo
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {formatNumber(p.stockActual)} {p.unidad}
                      </span>
                      {bajo && (
                        <p className="mt-1 text-xs text-amber-700">
                          mín. {p.stockMinimo}
                        </p>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/productos/${p.id}`}
                          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                          title={isAdmin ? "Ver / Editar" : "Ver detalle"}
                        >
                          {isAdmin ? "✏️" : "👁️"}
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(p)}
                            className="rounded-md p-2 text-rose-600 hover:bg-rose-50"
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCatModal && (
        <CategoriasModal
          categorias={categorias}
          onClose={() => setShowCatModal(false)}
          onSaved={() => {
            setShowCatModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CategoriasModal({
  categorias,
  onClose,
  onSaved,
}: {
  categorias: Categoria[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, color }),
    });
    setNombre("");
    setSaving(false);
    window.location.reload();
  }

  async function del(id: number) {
    if (!confirm("¿Eliminar categoría?")) return;
    await fetch(`/api/categorias/${id}`, { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Categorías</h3>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <form onSubmit={add} className="mb-4 flex gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-12 cursor-pointer rounded border border-slate-300"
          />
          <input
            type="text"
            placeholder="Nueva categoría"
            className="input flex-1"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <button disabled={saving} className="btn btn-primary">
            +
          </button>
        </form>
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {categorias.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: c.color || "#6366f1" }}
                />
                <span className="text-sm">{c.nombre}</span>
              </div>
              <button
                onClick={() => del(c.id)}
                className="text-rose-600 hover:bg-rose-50 rounded p-1"
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}