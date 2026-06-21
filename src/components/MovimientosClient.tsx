"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateTime, formatNumber } from "@/lib/format";

type Movimiento = {
  id: number;
  fecha: string | Date;
  productoId: number;
  productoNombre: string | null;
  tipo: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string | null;
  referencia: string | null;
};

export default function MovimientosClient() {
  const [movs, setMovs] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/movimientos").then((r) => r.json());
    setMovs(r);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return movs.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        m.productoNombre?.toLowerCase().includes(q) ||
        m.motivo?.toLowerCase().includes(q) ||
        m.referencia?.toLowerCase().includes(q);
      const matchTipo = !filterTipo || m.tipo === filterTipo;
      return matchSearch && matchTipo;
    });
  }, [movs, search, filterTipo]);

  const stats = useMemo(() => {
    const entradas = movs.filter((m) => m.tipo === "entrada").length;
    const salidas = movs.filter((m) => m.tipo === "salida").length;
    const ajustes = movs.filter((m) => m.tipo === "ajuste").length;
    return { entradas, salidas, ajustes };
  }, [movs]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">🔄 Movimientos de stock</h1>
        <p className="text-sm text-slate-600">
          Historial completo de entradas, salidas y ajustes
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Entradas</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.entradas}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Salidas</p>
          <p className="text-2xl font-bold text-rose-600">{stats.salidas}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Ajustes</p>
          <p className="text-2xl font-bold text-slate-900">{stats.ajustes}</p>
        </div>
      </div>

      <div className="card grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Buscar por producto, motivo..."
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input"
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="entrada">Entradas</option>
          <option value="salida">Salidas</option>
          <option value="ajuste">Ajustes</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">🔄</p>
            <p className="mt-2 text-sm text-slate-600">
              No hay movimientos registrados
            </p>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th className="text-center">Cantidad</th>
                <th className="text-center">Stock</th>
                <th>Motivo / Referencia</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td className="text-xs">{formatDateTime(m.fecha)}</td>
                  <td className="font-medium">{m.productoNombre}</td>
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
                    {formatNumber(m.cantidad)}
                  </td>
                  <td className="text-center text-xs text-slate-600">
                    {m.stockAnterior} → <strong>{m.stockNuevo}</strong>
                  </td>
                  <td className="text-sm">
                    {m.motivo}
                    {m.referencia && (
                      <span className="ml-1 text-xs text-slate-500">
                        · {m.referencia}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}