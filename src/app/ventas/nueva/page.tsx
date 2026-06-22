"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatSoles } from "@/lib/utils";

interface Prod {
  id: number; nombre: string; precioVenta: string; precioCosto: string;
  precioEspecial: string | null; stock: number; unidad: string;
}
interface Cliente { id: number; nombre: string }
interface CartItem {
  productoId: number; nombre: string; cantidad: number;
  precioUnitario: number; precioCosto: number; stock: number;
  usoPrecioEspecial: boolean; precioNormal: number; precioEsp: number | null;
}

export default function NuevaVenta() {
  const router = useRouter();
  const [prods, setProds] = useState<Prod[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [descuento, setDescuento] = useState("0");
  const [notas, setNotas] = useState("");
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/setup").catch(() => {}).finally(() => {
      fetch("/api/productos").then(r => r.ok ? r.json() : []).then(setProds).catch(() => {});
      fetch("/api/clientes").then(r => r.ok ? r.json() : []).then(setClientes).catch(() => {});
    });
  }, []);

  const filteredProds = prods.filter(p => p.nombre.toLowerCase().includes(q.toLowerCase()));

  const addToCart = (p: Prod) => {
    const exists = cart.find(c => c.productoId === p.id);
    if (exists) {
      setCart(cart.map(c => c.productoId === p.id ? { ...c, cantidad: c.cantidad + 1 } : c));
    } else {
      setCart([...cart, {
        productoId: p.id, nombre: p.nombre, cantidad: 1,
        precioUnitario: Number(p.precioVenta), precioCosto: Number(p.precioCosto),
        stock: p.stock, usoPrecioEspecial: false,
        precioNormal: Number(p.precioVenta),
        precioEsp: p.precioEspecial ? Number(p.precioEspecial) : null,
      }]);
    }
  };

  const updateQty = (pid: number, qty: number) => {
    if (qty <= 0) { setCart(cart.filter(c => c.productoId !== pid)); return; }
    setCart(cart.map(c => c.productoId === pid ? { ...c, cantidad: qty } : c));
  };

  const togglePrecio = (pid: number) => {
    setCart(cart.map(c => {
      if (c.productoId !== pid || !c.precioEsp) return c;
      const useEsp = !c.usoPrecioEspecial;
      return { ...c, usoPrecioEspecial: useEsp, precioUnitario: useEsp ? c.precioEsp : c.precioNormal };
    }));
  };

  const setPrecioManual = (pid: number, precio: number) => {
    setCart(cart.map(c => c.productoId === pid ? { ...c, precioUnitario: precio } : c));
  };

  const subtotal = cart.reduce((s, c) => s + c.precioUnitario * c.cantidad, 0);
  const total = subtotal - Number(descuento || 0);
  const gananciaEstimada = cart.reduce((s, c) => s + (c.precioUnitario - c.precioCosto) * c.cantidad, 0) - Number(descuento || 0);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (cart.length === 0) return alert("Agrega productos al carrito");
    setError("");
    setSaving(true);
    try {
      const items = cart.map(c => ({
        productoId: c.productoId, productoNombre: c.nombre,
        cantidad: c.cantidad, precioUnitario: c.precioUnitario,
        precioCosto: c.precioCosto, usoPrecioEspecial: c.usoPrecioEspecial,
      }));
      const selCliente = clientes.find(c => c.id === Number(clienteId));
      const res = await fetch("/api/ventas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items, clienteId: clienteId || null,
          clienteNombre: selCliente?.nombre || clienteNombre || "Público General",
          metodoPago, descuento: Number(descuento || 0), notas,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/ventas"), 1000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al registrar la venta. Verifica la conexión a la base de datos.");
        setSaving(false);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Nueva Venta</h1>
        <p className="text-gray-500 text-sm mt-1">Selecciona productos y completa la venta</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Product selector */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition" />
          </div>
          <div className="glass rounded-2xl max-h-[520px] overflow-y-auto divide-y divide-white/5">
            {filteredProds.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} className="w-full text-left px-4 py-3.5 hover:bg-white/5 transition-all flex justify-between items-center group">
                <div>
                  <p className="font-medium text-sm text-white group-hover:text-violet-300 transition">{p.nombre}</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono">
                    {formatSoles(p.precioVenta)}
                    {p.precioEspecial && <span className="text-amber-400/70 ml-2">Esp: {formatSoles(p.precioEspecial)}</span>}
                    <span className={`ml-2 ${p.stock <= 5 ? "text-red-400" : "text-gray-600"}`}>Stock: {p.stock}</span>
                  </p>
                </div>
                <span className="text-violet-500 text-xl opacity-0 group-hover:opacity-100 transition">+</span>
              </button>
            ))}
            {filteredProds.length === 0 && <p className="text-center py-8 text-gray-600 text-sm">Sin resultados</p>}
          </div>
        </div>

        {/* Cart & checkout */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-strong rounded-2xl p-5">
            <h2 className="font-semibold mb-4 text-white flex items-center gap-2">
              🛒 Carrito
              <span className="bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full text-xs">{cart.length}</span>
            </h2>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">Agrega productos desde la lista</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(c => (
                  <div key={c.productoId} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm text-white">{c.nombre}</p>
                        {c.usoPrecioEspecial && (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-xs mt-1">
                            ⭐ Precio Especial
                          </span>
                        )}
                      </div>
                      <button onClick={() => updateQty(c.productoId, 0)} className="text-gray-600 hover:text-red-400 transition text-sm">✕</button>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                        <button onClick={() => updateQty(c.productoId, c.cantidad - 1)} className="px-3 py-1.5 hover:bg-white/5 text-gray-400 transition">−</button>
                        <input type="number" value={c.cantidad} onChange={e => updateQty(c.productoId, Number(e.target.value))}
                          className="w-12 text-center text-sm py-1.5 bg-transparent border-x border-white/10 text-white focus:outline-none" min={1} />
                        <button onClick={() => updateQty(c.productoId, c.cantidad + 1)} className="px-3 py-1.5 hover:bg-white/5 text-gray-400 transition">+</button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">S/</span>
                        <input type="number" value={c.precioUnitario} onChange={e => setPrecioManual(c.productoId, Number(e.target.value))}
                          className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500/50" step="0.01" />
                      </div>
                      {c.precioEsp !== null && (
                        <button onClick={() => togglePrecio(c.productoId)}
                          className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
                            c.usoPrecioEspecial
                              ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                              : "border border-white/10 text-gray-400 hover:bg-white/5"
                          }`}>
                          {c.usoPrecioEspecial ? "✓ Especial" : "Usar Especial"}
                        </button>
                      )}
                      <span className="ml-auto font-bold text-emerald-400 font-mono">{formatSoles(c.precioUnitario * c.cantidad)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout */}
          <div className="glass-strong rounded-2xl p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Cliente</label>
                <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition">
                  <option value="">Público General</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">O nombre manual</label>
                <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Nombre del cliente"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Método de Pago</label>
                <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition">
                  {[["efectivo","💵 Efectivo"],["yape","📱 Yape"],["plin","📲 Plin"],["transferencia","🏦 Transferencia"],["tarjeta","💳 Tarjeta"],["otro","💫 Otro"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Descuento (S/)</label>
                <input type="number" value={descuento} onChange={e => setDescuento(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 transition" step="0.01" min="0" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Notas</label>
              <input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Opcional"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition" />
            </div>

            <div className="border-t border-white/5 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-400"><span>Subtotal</span><span className="font-mono">{formatSoles(subtotal)}</span></div>
              {Number(descuento) > 0 && <div className="flex justify-between text-sm text-red-400"><span>Descuento</span><span className="font-mono">-{formatSoles(descuento)}</span></div>}
              <div className="flex justify-between text-sm text-emerald-400/70"><span>Ganancia estimada</span><span className="font-mono">{formatSoles(gananciaEstimada)}</span></div>
              <div className="flex justify-between text-2xl font-bold pt-2 border-t border-white/5">
                <span className="text-white">Total</span>
                <span className="text-emerald-400">{formatSoles(total)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">
                ✅ ¡Venta registrada exitosamente! Redirigiendo...
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={submit} disabled={saving || cart.length === 0 || success}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3.5 rounded-xl font-bold text-lg hover:from-emerald-500 hover:to-green-500 disabled:opacity-30 transition-all shadow-lg shadow-emerald-500/20">
                {saving ? "Procesando..." : success ? "✅ ¡Registrada!" : `💰 Cobrar ${formatSoles(total)}`}
              </button>
              <button onClick={() => router.push("/ventas")} className="glass hover:bg-white/10 px-5 py-3.5 rounded-xl font-medium transition">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
