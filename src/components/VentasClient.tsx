"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney, formatDateTime } from "@/lib/format";

type Venta = {
  id: number;
  fecha: string | Date;
  clienteNombre: string;
  estado: string;
  tipoVenta: string;
  metodoPago: string;
  subtotal: string;
  descuento: string;
  total: string;
  ganancia: string;
  items: { id: number; productoNombre: string; cantidad: number; subtotal: string }[];
};

type Tab = "todas" | "menor" | "mayor";

import { useAuth } from "./AuthProvider";

export default function VentasClient() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [tab, setTab] = useState<Tab>("todas");
  const [open, setOpen] = useState<Venta | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/ventas").then((r) => r.json());
    setVentas(r);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return ventas.filter((v) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        v.clienteNombre.toLowerCase().includes(q) ||
        String(v.id).includes(q);
      const matchEstado = !filterEstado || v.estado === filterEstado;
      const matchTipo =
        tab === "todas" ||
        (tab === "menor" && v.tipoVenta === "menor") ||
        (tab === "mayor" && v.tipoVenta === "mayor");
      return matchSearch && matchEstado && matchTipo;
    });
  }, [ventas, search, filterEstado, tab]);

  const totales = useMemo(() => {
    const completadas = ventas.filter((v) => v.estado === "completada");
    const totalVentas = completadas.reduce((acc, v) => acc + parseFloat(v.total), 0);
    const totalGanancia = completadas.reduce(
      (acc, v) => acc + parseFloat(v.ganancia),
      0
    );
    const ventasMenor = completadas.filter((v) => v.tipoVenta === "menor");
    const ventasMayor = completadas.filter((v) => v.tipoVenta === "mayor");
    return {
      totalVentas,
      totalGanancia,
      count: completadas.length,
      totalMenor: ventasMenor.reduce((acc, v) => acc + parseFloat(v.total), 0),
      countMenor: ventasMenor.length,
      totalMayor: ventasMayor.reduce((acc, v) => acc + parseFloat(v.total), 0),
      countMayor: ventasMayor.length,
    };
  }, [ventas]);

  async function cancelar(v: Venta) {
    if (!confirm(`¿Cancelar venta #${v.id}? Se repondrá el stock.`)) return;
    await fetch(`/api/ventas/${v.id}`, { method: "DELETE" });
    load();
    setOpen(null);
  }

  const exportCSV = () => {
    const filas = [
      ["ID", "Fecha", "Cliente", "Tipo", "Estado", "Método pago", "Items", "Subtotal", "Descuento", "Total", "Ganancia"],
      ...filtered.map((v) => [
        v.id,
        formatDateTime(v.fecha),
        v.clienteNombre,
        v.tipoVenta,
        v.estado,
        v.metodoPago,
        v.items.length,
        v.subtotal,
        v.descuento,
        v.total,
        v.ganancia,
      ]),
    ];
    const csv = filas
      .map((r) =>
        r
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">💰 Ventas</h1>
          <p className="text-sm text-slate-600">
            Listado completo de ventas realizadas
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn btn-secondary">
            📥 Exportar CSV
          </button>
          <Link href="/ventas/nueva" className="btn btn-primary">
            + Nueva venta
          </Link>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            🛒 Ventas por MENOR
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {formatMoney(totales.totalMenor)}
          </p>
          <p className="mt-1 text-xs text-emerald-600">
            {totales.countMenor} ventas realizadas
          </p>
        </div>
        <div className="card border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
            📦 Ventas por MAYOR
          </p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">
            {formatMoney(totales.totalMayor)}
          </p>
          <p className="mt-1 text-xs text-indigo-600">
            {totales.countMayor} ventas realizadas
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Ganancia total
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatMoney(totales.totalGanancia)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {totales.count} ventas en total
          </p>
        </div>
      </section>

      <div className="card">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setTab("todas")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "todas"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            📋 Todas ({ventas.length})
          </button>
          <button
            onClick={() => setTab("menor")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "menor"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            🛒 Por menor ({totales.countMenor})
          </button>
          <button
            onClick={() => setTab("mayor")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "mayor"
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            📦 Por mayor ({totales.countMayor})
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Buscar por cliente o número..."
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="completada">Completada</option>
            <option value="pendiente">Pendiente</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">💰</p>
            <p className="mt-2 text-sm text-slate-600">
              {tab === "todas"
                ? "No hay ventas registradas"
                : `No hay ventas por ${tab}`}
            </p>
            <Link href="/ventas/nueva" className="btn btn-primary mt-4 inline-flex">
              Registrar primera venta
            </Link>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Items</th>
                <th className="text-right">Total</th>
                {isAdmin && <th className="text-right">Ganancia</th>}
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td className="font-mono text-xs">#{v.id}</td>
                  <td className="text-xs">{formatDateTime(v.fecha)}</td>
                  <td>{v.clienteNombre}</td>
                  <td>
                    <span
                      className={`badge ${
                        v.tipoVenta === "mayor"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {v.tipoVenta === "mayor" ? "📦 Mayor" : "🛒 Menor"}
                    </span>
                  </td>
                  <td className="text-xs text-slate-500">
                    {v.items.length} {v.items.length === 1 ? "producto" : "productos"}
                  </td>
                  <td className="text-right font-semibold">{formatMoney(v.total)}</td>
                  {isAdmin && (
                    <td className="text-right text-emerald-600">
                      {formatMoney(v.ganancia)}
                    </td>
                  )}
                  <td>
                    <span
                      className={`badge ${
                        v.estado === "completada"
                          ? "bg-emerald-100 text-emerald-800"
                          : v.estado === "pendiente"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {v.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setOpen(v)}
                      className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
          onClick={() => setOpen(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Venta #{open.id}</h3>
                <p className="text-sm text-slate-500">{formatDateTime(open.fecha)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`badge ${
                      open.tipoVenta === "mayor"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {open.tipoVenta === "mayor" ? "📦 Venta por MAYOR" : "🛒 Venta por MENOR"}
                  </span>
                  <span
                    className={`badge ${
                      open.estado === "completada"
                        ? "bg-emerald-100 text-emerald-800"
                        : open.estado === "pendiente"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {open.estado}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="rounded p-1 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Cliente</p>
                <p className="font-medium">{open.clienteNombre}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Método de pago</p>
                <p className="font-medium capitalize">{open.metodoPago}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200">
              <table className="data">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Cant.</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {open.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.productoNombre}</td>
                      <td className="text-center">{it.cantidad}</td>
                      <td className="text-right font-semibold">
                        {formatMoney(it.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span>{formatMoney(open.subtotal)}</span>
              </div>
              {parseFloat(open.descuento) > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Descuento</span>
                  <span>-{formatMoney(open.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                <span>TOTAL</span>
                <span className="text-indigo-600">{formatMoney(open.total)}</span>
              </div>
              {isAdmin && (
                <div className="flex justify-between text-emerald-600">
                  <span>Ganancia</span>
                  <span className="font-semibold">{formatMoney(open.ganancia)}</span>
                </div>
              )}
            </div>
            {isAdmin && open.estado !== "cancelada" && (
              <div className="flex justify-end border-t border-slate-200 pt-4">
                <button
                  onClick={() => cancelar(open)}
                  className="btn btn-danger"
                >
                  Cancelar venta (repone stock)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}