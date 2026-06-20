"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type Usuario = {
  id: number;
  nombre: string;
  username: string;
  role: string;
  activo: boolean;
};

export default function UsuariosPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", username: "", password: "", role: "vendedor" });

  const load = async () => {
    const token = localStorage.getItem("authToken");
    const res = await fetch("/api/usuarios", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setUsuarios(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ nombre: "", username: "", password: "", role: "vendedor" });
      load();
    }
  };

  const toggleStatus = async (u: Usuario) => {
    const token = localStorage.getItem("authToken");
    await fetch(`/api/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ activo: !u.activo })
    });
    load();
  };

  const deleteUser = async (u: Usuario) => {
    if (!confirm(`¿Eliminar usuario ${u.username}?`)) return;
    const token = localStorage.getItem("authToken");
    await fetch(`/api/usuarios/${u.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  if (user?.role !== "admin") return <p className="p-8 text-center">No tienes permiso para estar aquí.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Usuarios</h1>
          <p className="text-sm text-slate-500">Crea y gestiona el acceso de tus vendedores</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          + Crear Usuario
        </button>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Username</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td className="font-bold">{u.nombre}</td>
                <td>{u.username}</td>
                <td>
                  <span className={`badge ${u.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.activo ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => toggleStatus(u)} className="btn-secondary btn px-2 py-1 text-xs">
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                    <button onClick={() => deleteUser(u)} className="btn px-2 py-1 text-xs text-rose-600">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <form onSubmit={handleCreate} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Nuevo Usuario</h2>
            <div>
              <label className="label">Nombre Real</label>
              <input required className="input" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
            </div>
            <div>
              <label className="label">Usuario (Login)</label>
              <input required className="input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input required type="password" className="input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <div>
              <label className="label">Rol</label>
              <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="vendedor">Vendedor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancelar</button>
              <button type="submit" className="btn btn-primary">Crear</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}