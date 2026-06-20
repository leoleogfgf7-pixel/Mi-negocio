"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = { nombre: string; role: "admin" | "vendedor" } | null;

interface AuthContextType {
  user: User;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("userData");
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al entrar");
      
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));
      setUser(data.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setUser(null);
    router.push("/");
  };

  if (loading) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-100 p-4">
        <div className="w-full max-w-sm space-y-6 rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-600 text-3xl shadow-lg">
              🔐
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Iniciar Sesión</h1>
            <p className="text-slate-500 text-sm">Ingresa tus credenciales</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Usuario</label>
              <input
                required
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                required
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-xs font-bold text-rose-600">{error}</p>
            )}
            <button type="submit" className="btn btn-primary w-full py-3 text-base">
              ENTRAR
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login: async () => {}, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}