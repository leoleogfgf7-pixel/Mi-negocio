"use client";

import { useEffect, useState } from "react";
import { formatMoney, formatDateTime } from "@/lib/format";

type Cliente = {
  id: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  notas: string | null;
  createdAt: string | Date;
};

export default function ClientesClient() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Cliente | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    notas: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/clientes").then((r) => r.json());
    setClientes(r);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function open(c?: Cliente) {
    if (c) {
      setEdit(c);
      setForm({
        nombre: c.nombre,
        email: c.email ?? "",
        telefono: c.telefono ?? "",
        direccion: c.direccion ?? "",
        notas: c.notas ?? "",
      });
    } else {
      setEdit(null);
      setForm({ nombre: "", email: "", telefono: "", direccion: "", notas: "" });
    }
    setShow(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (edit) {
      await fetch(`/api/clientes/${edit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setShow(false);
    load();
  }

  async function del(c: Cliente) {
    if (!confirm(`¿Eliminar cliente "${c.nombre}"?`)) return;
    await fetch(`/api/clientes/${c.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">👥 Clientes</h1>
          <p className="text-sm text-slate-600">
            Base de datos de tus clientes
          </p>
        </div>
        <button onClick={() => open()} className="btn btn-primary">
          + Nuevo cliente
        </button>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando...</div>
        ) : clientes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">👥</p>
            <p className="mt-2 text-sm text-slate-600">No hay clientes cargados</p>
            <button onClick={() => open()} className="btn btn-primary mt-4 inline-flex">
              Agregar primer cliente
            </button>
          </div>
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium text-slate-900">{c.nombre}</td>
                  <td className="text-sm">{c.email || "—"}</td>
                  <td className="text-sm">{c.telefono || "—"}</td>
                  <td className="text-sm">{c.direccion || "—"}</td>
                  <td className="text-sm text-slate-500">{c.notas || "—"}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => open(c)}
                        className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => del(c)}
                        className="rounded-md p-2 text-rose-600 hover:bg-rose-50"
                      >
                        🗑️
                      </button>
                    </div>
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
              <h3 className="text-lg font-semibold">
                {edit ? "Editar cliente" : "Nuevo cliente"}
              </h3>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="rounded p-1 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div>
              <label className="label">Nombre *</label>
              <input
                required
                className="input"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input
                  className="input"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Dirección</label>
              <input
                className="input"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notas</label>
              <textarea
                rows={2}
                className="input"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
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