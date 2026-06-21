"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Categoria = { id: number; nombre: string };

type Initial = {
  id?: number;
  nombre?: string;
  descripcion?: string | null;
  sku?: string | null;
  categoriaId?: number | null;
  precioCompra?: string;
  precioVenta?: string;
  precioMayor?: string;
  stockActual?: number;
  stockMinimo?: number;
  unidad?: string;
  activo?: boolean;
};

export default function ProductoForm({
  categorias,
  initial,
}: {
  categorias: Categoria[];
  initial?: Initial;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [categoriaId, setCategoriaId] = useState<string>(
    initial?.categoriaId ? String(initial.categoriaId) : ""
  );
  const [precioCompra, setPrecioCompra] = useState(initial?.precioCompra ?? "0");
  const [precioVenta, setPrecioVenta] = useState(initial?.precioVenta ?? "0");
  const [precioMayor, setPrecioMayor] = useState(initial?.precioMayor ?? "0");
  const [stockActual, setStockActual] = useState(
    initial?.stockActual !== undefined ? String(initial.stockActual) : "0"
  );
  const [stockMinimo, setStockMinimo] = useState(
    initial?.stockMinimo !== undefined ? String(initial.stockMinimo) : "5"
  );
  const [unidad, setUnidad] = useState(initial?.unidad ?? "unidad");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        nombre,
        descripcion,
        sku,
        categoriaId: categoriaId ? Number(categoriaId) : null,
        precioCompra,
        precioVenta,
        precioMayor,
        stockActual: isEdit ? undefined : Number(stockActual),
        stockMinimo,
        unidad,
      };
      const url = isEdit ? `/api/productos/${initial!.id}` : "/api/productos";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/productos");
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const costo = parseFloat(precioCompra || "0");
  const venta = parseFloat(precioVenta || "0");
  const mayor = parseFloat(precioMayor || "0");
  const margen =
    venta > 0 ? (((venta - costo) / venta) * 100).toFixed(1) : "0";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? "Editar producto" : "Nuevo producto"}
        </h1>
        <p className="text-sm text-slate-600">
          {isEdit
            ? "Modificá los datos del producto"
            : "Cargá un producto a tu inventario"}
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nombre *</label>
            <input
              required
              className="input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Arroz superior 1kg"
            />
          </div>
          <div>
            <label className="label">SKU / Código</label>
            <input
              className="input"
              value={sku ?? ""}
              onChange={(e) => setSku(e.target.value)}
              placeholder="ARR-1KG"
            />
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
              value={descripcion ?? ""}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
            💰 Precios (en Soles)
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Precio de costo (S/.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
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
                min="0"
                className="input border-emerald-300 focus:border-emerald-500"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
              />
              <p className="mt-1 text-xs text-emerald-600">
                Venta al detalle
              </p>
            </div>
            <div>
              <label className="label">Precio MAYOR (S/.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input border-indigo-300 focus:border-indigo-500"
                value={precioMayor}
                onChange={(e) => setPrecioMayor(e.target.value)}
              />
              <p className="mt-1 text-xs text-indigo-600">
                Venta al por mayor
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Margen menor</p>
              <p className="text-lg font-bold text-emerald-600">{margen}%</p>
            </div>
            <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Ganancia x unidad menor</p>
              <p className="text-lg font-bold text-emerald-600">
                S/ {(venta - costo).toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
              <p className="text-xs text-slate-500">Ganancia x unidad mayor</p>
              <p className="text-lg font-bold text-indigo-600">
                S/ {Math.max(0, mayor - costo).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {!isEdit && (
            <div>
              <label className="label">Stock inicial</label>
              <input
                type="number"
                min="0"
                className="input"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="label">Stock mínimo</label>
            <input
              type="number"
              min="0"
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

        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button disabled={saving} className="btn btn-primary">
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
          </button>
        </div>
      </form>
    </div>
  );
}