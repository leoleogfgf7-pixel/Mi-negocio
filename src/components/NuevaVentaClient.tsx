"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/format";

type Producto = {
  id: number;
  nombre: string;
  precioVenta: string;
  precioCompra: string;
  precioMayor: string;
  stockActual: number;
  categoriaId: number | null;
  unidad: string;
};

type Item = { productoId: number; cantidad: number; precioUnitario: number };

type Categoria = { id: number; nombre: string; color: string | null };
type Cliente = { id: number; nombre: string };

import { useAuth } from "./AuthProvider";

export default function NuevaVentaClient({
  productos,
  categorias,
  clientes,
  tipoInicial = "menor",
}: {
  productos: Producto[];
  categorias: Categoria[];
  clientes: Cliente[];
  tipoInicial?: "mayor" | "menor";
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const router = useRouter();
  const [tipoVenta, setTipoVenta] = useState<"mayor" | "menor">(tipoInicial);
  const [items, setItems] = useState<Item[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [descuento, setDescuento] = useState("0");
  const [notas, setNotas] = useState("");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productosMap = useMemo(() => {
    const m = new Map<number, Producto>();
    productos.forEach((p) => m.set(p.id, p));
    return m;
  }, [productos]);

  function getPrecioUnitario(p: Producto): number {
    if (tipoVenta === "mayor") {
      const pm = parseFloat(p.precioMayor || "0");
      if (pm > 0) return pm;
    }
    return parseFloat(p.precioVenta);
  }

  const productosFiltrados = useMemo(() => {
    const q = search.toLowerCase();
    return productos.filter((p) => {
      const matchSearch = !q || p.nombre.toLowerCase().includes(q);
      const matchCat = !filterCat || String(p.categoriaId) === filterCat;
      return matchSearch && matchCat && p.stockActual > 0;
    });
  }, [productos, search, filterCat]);

  function addItem(p: Producto) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productoId === p.id);
      const precio = getPrecioUnitario(p);
      if (existing) {
        if (existing.cantidad + 1 > p.stockActual) return prev;
        return prev.map((i) =>
          i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { productoId: p.id, cantidad: 1, precioUnitario: precio }];
    });
  }

  function updateCantidad(productoId: number, cantidad: number) {
    const p = productosMap.get(productoId);
    if (!p) return;
    const cant = Math.max(1, Math.min(cantidad, p.stockActual));
    setItems((prev) =>
      prev.map((i) => (i.productoId === productoId ? { ...i, cantidad: cant } : i))
    );
  }

  function removeItem(productoId: number) {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  }

  function updatePrecio(productoId: number, precio: any) {
    // Permitir que el usuario borre el número para escribir uno nuevo
    const nuevoPrecio = precio === "" ? 0 : Number(precio);
    setItems((prev) =>
      prev.map((i) =>
        i.productoId === productoId ? { ...i, precioUnitario: nuevoPrecio } : i
      )
    );
  }

  const subtotal = items.reduce(
    (acc, it) => acc + it.precioUnitario * it.cantidad,
    0
  );
  const descuentoNum = Math.min(parseFloat(descuento || "0"), subtotal);
  const total = Math.max(0, subtotal - descuentoNum);
  const costo = items.reduce((acc, it) => {
    const p = productosMap.get(it.productoId);
    if (!p) return acc;
    return acc + parseFloat(p.precioCompra) * it.cantidad;
  }, 0);
  const ganancia = total - costo;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      setError("Agregá al menos un producto a la venta");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: clienteId ? Number(clienteId) : null,
          clienteNombre,
          metodoPago,
          tipoVenta,
          descuento: descuentoNum,
          notas,
          items: items.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const venta = await res.json();
      router.push(`/ventas?ok=${venta.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/ventas" className="text-slate-500 hover:text-slate-700">
          ← Ventas
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nueva venta</h1>
        <p className="text-sm text-slate-600">
          Elegí si es por mayor o menor, agregá productos y registrá la venta
        </p>
      </div>

      {/* Selector mayor/menor muy visible */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setTipoVenta("menor")}
          className={`flex items-center justify-between rounded-2xl border-2 p-5 text-left transition ${
            tipoVenta === "menor"
              ? "border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200"
              : "border-slate-200 bg-white hover:border-emerald-300"
          }`}
        >
          <div>
            <div className="text-2xl">🛒</div>
            <p className="mt-1 text-lg font-bold text-slate-900">Por MENOR</p>
            <p className="text-xs text-slate-600">
              Precio unitario normal
            </p>
          </div>
          {tipoVenta === "menor" && (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white">
              ✓
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTipoVenta("mayor")}
          className={`flex items-center justify-between rounded-2xl border-2 p-5 text-left transition ${
            tipoVenta === "mayor"
              ? "border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-200"
              : "border-slate-200 bg-white hover:border-indigo-300"
          }`}
        >
          <div>
            <div className="text-2xl">📦</div>
            <p className="mt-1 text-lg font-bold text-slate-900">Por MAYOR</p>
            <p className="text-xs text-slate-600">
              Precio mayorista (más barato)
            </p>
          </div>
          {tipoVenta === "mayor" && (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-500 text-white">
              ✓
            </span>
          )}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">Productos disponibles</h2>
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Buscar producto..."
                className="input"
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
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {productosFiltrados.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No hay productos disponibles con stock
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {productosFiltrados.map((p) => {
                    const cat = categorias.find((c) => c.id === p.categoriaId);
                    const precio = getPrecioUnitario(p);
                    const precioMayor = parseFloat(p.precioMayor || "0");
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addItem(p)}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-400 hover:bg-indigo-50/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {p.nombre}
                          </p>
                          <p className="text-xs text-slate-600">
                            <strong className="text-indigo-600">
                              {formatMoney(precio)}
                            </strong>
                            {tipoVenta === "mayor" && precioMayor > 0 && (
                              <span className="ml-1 text-slate-400 line-through">
                                {formatMoney(p.precioVenta)}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            Stock: {p.stockActual}
                          </p>
                          {cat && (
                            <span
                              className="mt-1 inline-block badge"
                              style={{
                                backgroundColor: `${cat.color}20`,
                                color: cat.color || "#475569",
                              }}
                            >
                              {cat.nombre}
                            </span>
                          )}
                        </div>
                        <span className="text-xl text-indigo-500">+</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">Items de la venta</h2>
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Agregá productos desde la lista de arriba
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((it) => {
                  const p = productosMap.get(it.productoId);
                  if (!p) return null;
                  const subtotalItem = it.precioUnitario * it.cantidad;
                  return (
                    <div
                      key={it.productoId}
                      className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">
                          {p.nombre}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.unidad} · Costo: {formatMoney(p.precioCompra)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateCantidad(it.productoId, it.cantidad - 1)}
                          className="h-8 w-8 rounded-md bg-slate-100 hover:bg-slate-200"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={p.stockActual}
                          value={it.cantidad}
                          onChange={(e) =>
                            updateCantidad(it.productoId, Number(e.target.value))
                          }
                          className="input-sm w-16 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => updateCantidad(it.productoId, it.cantidad + 1)}
                          className="h-8 w-8 rounded-md bg-slate-100 hover:bg-slate-200"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">Pagarán (S/.):</span>
                        <input
                          type="number"
                          step="0.10"
                          value={it.precioUnitario}
                          onChange={(e) =>
                            updatePrecio(it.productoId, e.target.value)
                          }
                          className={`input-sm w-28 text-right font-bold focus:ring-2 ${
                            it.precioUnitario < parseFloat(p.precioCompra) 
                            ? "border-red-500 bg-red-50 text-red-900 focus:ring-red-500" 
                            : "border-orange-400 bg-orange-50 text-orange-900 focus:ring-orange-500"
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="sm:w-28 sm:text-right">
                        <p className="font-semibold">{formatMoney(subtotalItem)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(it.productoId)}
                        className="rounded-md p-2 text-rose-600 hover:bg-rose-50"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-lg font-semibold">Cliente</h2>
            <div>
              <label className="label">Cliente existente</label>
              <select
                className="input"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">— Consumidor final —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">O nombre directo</label>
              <input
                className="input"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <label className="label">Método de pago</label>
              <select
                className="input"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="yape">Yape / Plin</option>
                <option value="credito">Crédito</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="label">Notas</label>
              <textarea
                className="input"
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Notas opcionales"
              />
            </div>
          </div>

          <div
            className={`card space-y-3 ${
              tipoVenta === "mayor" ? "bg-indigo-50/40" : "bg-emerald-50/40"
            }`}
          >
            <h2 className="text-lg font-semibold">
              {tipoVenta === "mayor" ? "📦 Resumen MAYOR" : "🛒 Resumen MENOR"}
            </h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Items</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unidades</span>
                <span>{items.reduce((acc, i) => acc + i.cantidad, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Descuento (S/.)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                  className="input-sm w-24 text-right"
                />
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold">
                <span>TOTAL</span>
                <span className={tipoVenta === "mayor" ? "text-indigo-600" : "text-emerald-600"}>
                  {formatMoney(total)}
                </span>
              </div>
              {isAdmin && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Costo</span>
                    <span>{formatMoney(costo)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Ganancia estimada</span>
                    <span className="font-semibold">{formatMoney(ganancia)}</span>
                  </div>
                </>
              )}
            </div>
            {error && (
              <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={saving || items.length === 0}
              className={`btn w-full ${
                tipoVenta === "mayor" ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {saving
                ? "Registrando..."
                : `✅ Registrar venta ${tipoVenta === "mayor" ? "por MAYOR" : "por MENOR"}`}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}