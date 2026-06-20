"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney, formatDate, todayISO } from "@/lib/format";

type Gasto = {
  id: number;
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: string;
};

export default function GastosClient() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    fecha: todayISO(),
    categoria: "general",
    descripcion: "",
    monto: "0",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/gastos").then((r) => r.json());
    setGastos(r);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/gastos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShow(false);
    setForm({ fecha: todayISO(), categoria: "general", descripcion: "", monto: "0" });
    load();
  }

  async function del(g: Gasto) {
    if (!confirm(`¿Eliminar gasto "${g.descripcion}"?`)) return;
    await fetch(`/api/gastos/${g.id}`, { method: "DELETE" });
    load();
  }

  const stats = useMemo(() => {
    const total = gastos.reduce((acc, g) => acc + parseFloat(g.monto), 0);
    const hoy = todayISO();
    const totalHoy = gastos
      .filter((g) => g.fecha === hoy)
      .reduce((acc, g) => acc + parseFloat(g.monto), 0);
    const mes = new Date().toISOString().slice(0, 7);
    const totalMes = gastos
      .filter((g) => g.fecha.startsWith(mes))
      .reduce((acc, g) => acc + parseFloat(g.monto), 0);
    return { total, totalHoy, totalMes };
  }, [gastos]);

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>();
    gastos.forEach((g) => {
      map.set(g.categoria, (map.get(g.categoria) ?? 0) + parseFloat(g.monto));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [gastos]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">💸 Gastos</h1>
          <p className="text-sm text-slate-600">
            Controlá todos los gastos de tu negocio
          </p>
        </div>
        <button onClick={() => setShow(true)} className="btn btn-primary">
          + Nuevo gasto
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Hoy</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatMoney(stats.totalHoy)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Este mes</p>
          <p className="text-2xl font-bold text-rose-600">
            {formatMoney(stats.totalMes)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Total histórico</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatMoney(stats.total)}
          </p>
        </div>
      </div>

      {porCategoria.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Por categoría</h2>
          <div className="space-y-2">
            {porCategoria.map(([cat, monto]) => {
              const pct = (monto / stats.total) * 100;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{cat}</span>
                    <span className="font-semibold">{formatMoney(monto)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-rose-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="table-wrap">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando...</div>
        ) : gastos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">💸</p>
            <p className="mt-2 text-sm text-slate-600">No hay gastos registrados</p>
            <button onClick={() => setShow(true)} className="btn btn-primary mt-4 inline-flex">
              Cargar primer gasto
            </button>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th className="text-right">Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g) => (
                <tr key={g.id}>
                  <td className="text-sm">{formatDate(g.fecha)}</td>
                  <td>
                    <span className="badge bg-slate-100 text-slate-700 capitalize">
                      {g.categoria}
                    </span>
                  </td>
                  <td>{g.descripcion}</td>
                  <td className="text-right font-semibold text-rose-600">
                    -{formatMoney(g.monto)}
                  </td>
                  <td>
                    <button
                      onClick={() => del(g)}
                      className="rounded-md p-2 text-rose-600 hover:bg-rose-50"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {show && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
          onClick={() => setShow(false)}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nuevo gasto</h3>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="rounded p-1 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Categoría</label>
                <select
                  className="input"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                >
                  <option value="general">General</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="servicios">Servicios</option>
                  <option value="sueldos">Sueldos</option>
                  <option value="proveedores">Proveedores</option>
                  <option value="marketing">Marketing</option>
                  <option value="transporte">Transporte</option>
                  <option value="impuestos">Impuestos</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Descripción *</label>
              <input
                required
                className="input"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Ej: Luz del local"
              />
            </div>
            <div>
              <label className="label">Monto</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="input"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setShow(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button disabled={saving} className="btn btn-primary">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}