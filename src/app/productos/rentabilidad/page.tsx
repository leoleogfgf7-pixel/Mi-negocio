"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSoles } from "@/lib/utils";

interface ProdRent {
  id: number;
  nombre: string;
  sku: string | null;
  categoriaNombre: string | null;
  categoriaColor: string | null;
  unidad: string;
  precioCosto: number;
  precioVenta: number;
  precioEspecial: number | null;
  stock: number;
  margenUnidad: number;
  margenEspecial: number | null;
  unidadesVendidas: number;
  ingresosVentas: number;
  costoVentas: number;
  gananciaGenerada: number;
  gananciaPotencial: number;
  gananciaPotencialEspecial: number | null;
  inversionStock: number;
  ingresosPotenciales: number;
  roi: number;
}

interface Totals {
  totalProductos: number;
  totalUnidadesVendidas: number;
  totalIngresosVentas: number;
  totalCostoVentas: number;
  totalGananciaGenerada: number;
  totalStockActual: number;
  totalInversionStock: number;
  totalIngresosPotenciales: number;
  totalGananciaPotencial: number;
  totalProyectado: number;
}

type SortKey = "nombre" | "gananciaGenerada" | "gananciaPotencial" | "unidadesVendidas" | "stock" | "roi" | "margenUnidad";

export default function RentabilidadPage() {
  const [data, setData] = useState<{ productos: ProdRent[]; totals: Totals } | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("gananciaGenerada");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/setup").catch(() => {}).finally(() => {
      fetch("/api/productos/rentabilidad")
        .then((r) => r.ok ? r.json() : null)
        .then(d => setData(d || { productos: [], totals: { totalProductos: 0, totalUnidadesVendidas: 0, totalIngresosVentas: 0, totalCostoVentas: 0, totalGananciaGenerada: 0, totalStockActual: 0, totalInversionStock: 0, totalIngresosPotenciales: 0, totalGananciaPotencial: 0, totalProyectado: 0 } }))
        .catch(() => setData({ productos: [], totals: { totalProductos: 0, totalUnidadesVendidas: 0, totalIngresosVentas: 0, totalCostoVentas: 0, totalGananciaGenerada: 0, totalStockActual: 0, totalInversionStock: 0, totalIngresosPotenciales: 0, totalGananciaPotencial: 0, totalProyectado: 0 } }));
    });
  }, []);

  if (!data) return (
    <div className="flex justify-center items-center py-32">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
      </div>
    </div>
  );

  const { totals } = data;

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const sorted = [...data.productos].sort((a, b) => {
    const av = a[sortBy] ?? 0;
    const bv = b[sortBy] ?? 0;
    if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === "asc" ? (Number(av) - Number(bv)) : (Number(bv) - Number(av));
  });

  const arrow = (key: SortKey) => sortBy === key ? (sortDir === "desc" ? " ↓" : " ↑") : "";

  const maxGanancia = Math.max(...data.productos.map(p => p.gananciaGenerada), 1);
  const maxPotencial = Math.max(...data.productos.map(p => p.gananciaPotencial), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Rentabilidad por Producto</h1>
          <p className="text-gray-500 text-sm mt-1">Cuánto ganaste y cuánto ganarías si vendes todo el stock</p>
        </div>
        <Link href="/productos" className="glass hover:bg-white/10 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
          ← Volver a Productos
        </Link>
      </div>

      {/* Big summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          label="Ganancia Generada"
          value={formatSoles(totals.totalGananciaGenerada)}
          sub={`${totals.totalUnidadesVendidas} unidades vendidas`}
          gradient="from-emerald-500/10 to-emerald-600/5"
          border="border-emerald-500/20"
          glow="glow-green"
          valueColor="text-emerald-400"
        />
        <SummaryCard
          label="Ganancia Potencial"
          value={formatSoles(totals.totalGananciaPotencial)}
          sub={`Si vendes las ${totals.totalStockActual} unidades en stock`}
          gradient="from-blue-500/10 to-blue-600/5"
          border="border-blue-500/20"
          glow="glow-blue"
          valueColor="text-blue-400"
        />
        <SummaryCard
          label="Total Proyectado"
          value={formatSoles(totals.totalProyectado)}
          sub="Generada + Potencial"
          gradient="from-violet-500/10 to-violet-600/5"
          border="border-violet-500/20"
          glow="glow-purple"
          valueColor="text-violet-400"
        />
        <SummaryCard
          label="Inversión en Stock"
          value={formatSoles(totals.totalInversionStock)}
          sub={`${totals.totalStockActual} unidades`}
          gradient="from-amber-500/10 to-amber-600/5"
          border="border-amber-500/20"
          glow="glow-amber"
          valueColor="text-amber-400"
        />
        <SummaryCard
          label="Ingreso si vendo todo"
          value={formatSoles(totals.totalIngresosPotenciales)}
          sub="A precio de venta normal"
          gradient="from-cyan-500/10 to-cyan-600/5"
          border="border-cyan-500/20"
          glow="glow-blue"
          valueColor="text-cyan-400"
        />
      </div>

      {/* Visual bar comparison */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-1">Ganancia Generada vs Potencial por Producto</h2>
        <p className="text-gray-500 text-xs mb-5">Barra verde = ya ganaste · Barra azul = ganarías si vendes todo el stock</p>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {[...data.productos]
            .sort((a, b) => (b.gananciaGenerada + b.gananciaPotencial) - (a.gananciaGenerada + a.gananciaPotencial))
            .filter(p => p.gananciaGenerada > 0 || p.gananciaPotencial > 0)
            .map((p) => {
              const maxVal = Math.max(maxGanancia, maxPotencial);
              const genPct = maxVal > 0 ? (p.gananciaGenerada / maxVal) * 100 : 0;
              const potPct = maxVal > 0 ? (p.gananciaPotencial / maxVal) * 100 : 0;
              return (
                <div key={p.id} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <Link href={`/productos/${p.id}`} className="text-sm text-gray-300 hover:text-white transition truncate mr-3">
                      {p.nombre}
                    </Link>
                    <div className="flex items-center gap-3 text-xs shrink-0 font-mono">
                      <span className="text-emerald-400">{formatSoles(p.gananciaGenerada)}</span>
                      <span className="text-gray-600">+</span>
                      <span className="text-blue-400">{formatSoles(p.gananciaPotencial)}</span>
                      <span className="text-gray-600">=</span>
                      <span className="text-violet-400 font-semibold">{formatSoles(p.gananciaGenerada + p.gananciaPotencial)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-4">
                    <div className="bg-emerald-500/30 rounded-l-sm relative overflow-hidden" style={{ width: `${Math.max(genPct, 0.5)}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-400 opacity-80" />
                    </div>
                    <div className="bg-blue-500/30 rounded-r-sm relative overflow-hidden" style={{ width: `${Math.max(potPct, 0.5)}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-60" />
                    </div>
                  </div>
                </div>
              );
            })}
          {data.productos.filter(p => p.gananciaGenerada > 0 || p.gananciaPotencial > 0).length === 0 && (
            <p className="text-gray-600 text-center py-8">Aún no hay datos. ¡Empieza a vender!</p>
          )}
        </div>
        <div className="flex gap-5 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500/70" /> Ganancia ya generada</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500/50" /> Ganancia potencial (stock restante)</span>
        </div>
      </div>

      {/* Detailed table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <Th label="Producto" sortKey="nombre" current={sortBy} dir={sortDir} onClick={toggleSort} align="left" />
                <Th label="Margen/u" sortKey="margenUnidad" current={sortBy} dir={sortDir} onClick={toggleSort} align="right" />
                <Th label="Vendidos" sortKey="unidadesVendidas" current={sortBy} dir={sortDir} onClick={toggleSort} align="right" />
                <Th label="Ganancia Generada" sortKey="gananciaGenerada" current={sortBy} dir={sortDir} onClick={toggleSort} align="right" />
                <Th label="Stock" sortKey="stock" current={sortBy} dir={sortDir} onClick={toggleSort} align="center" />
                <Th label="Potencial" sortKey="gananciaPotencial" current={sortBy} dir={sortDir} onClick={toggleSort} align="right" />
                <Th label="ROI" sortKey="roi" current={sortBy} dir={sortDir} onClick={toggleSort} align="right" />
                <th className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sorted.map((p) => {
                const total = p.gananciaGenerada + p.gananciaPotencial;
                return (
                  <TableRow key={p.id} p={p} total={total} expanded={expanded} setExpanded={setExpanded} />
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={8} className="text-center py-16 text-gray-600">Sin productos</td></tr>
              )}
            </tbody>
            {/* Totals row */}
            <tfoot>
              <tr className="border-t-2 border-white/10 bg-white/[0.02]">
                <td className="px-4 py-4 font-bold text-white">TOTALES</td>
                <td className="px-4 py-4 text-right text-gray-500">—</td>
                <td className="px-4 py-4 text-right font-bold text-white font-mono">{totals.totalUnidadesVendidas}</td>
                <td className="px-4 py-4 text-right font-bold text-emerald-400 font-mono">{formatSoles(totals.totalGananciaGenerada)}</td>
                <td className="px-4 py-4 text-center font-bold text-white font-mono">{totals.totalStockActual}</td>
                <td className="px-4 py-4 text-right font-bold text-blue-400 font-mono">{formatSoles(totals.totalGananciaPotencial)}</td>
                <td className="px-4 py-4 text-right text-gray-500">—</td>
                <td className="px-4 py-4 text-center">
                  <span className="text-violet-400 font-bold font-mono text-xs">{formatSoles(totals.totalProyectado)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function TableRow({ p, total, expanded, setExpanded }: { p: ProdRent; total: number; expanded: number | null; setExpanded: (id: number | null) => void }) {
  const isExpanded = expanded === p.id;
  return (
    <>
      <tr className="hover:bg-white/[0.02] transition-colors">
        <td className="px-4 py-4">
          <div>
            <Link href={`/productos/${p.id}`} className="font-semibold text-white hover:text-violet-300 transition">{p.nombre}</Link>
            {p.categoriaNombre && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: (p.categoriaColor || "#8b5cf6") + "22", color: p.categoriaColor || "#8b5cf6" }}>
                {p.categoriaNombre}
              </span>
            )}
            {p.sku && <p className="text-[10px] text-gray-600 font-mono mt-0.5">{p.sku}</p>}
          </div>
        </td>
        <td className="px-4 py-4 text-right">
          <span className={`font-mono text-sm ${p.margenUnidad >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatSoles(p.margenUnidad)}
          </span>
          {p.margenEspecial !== null && (
            <p className="text-[10px] text-amber-400/60 font-mono mt-0.5">Esp: {formatSoles(p.margenEspecial)}</p>
          )}
        </td>
        <td className="px-4 py-4 text-right font-mono text-white">
          {p.unidadesVendidas > 0 ? p.unidadesVendidas : <span className="text-gray-700">0</span>}
        </td>
        <td className="px-4 py-4 text-right">
          <span className={`font-mono font-bold ${p.gananciaGenerada > 0 ? "text-emerald-400" : p.gananciaGenerada < 0 ? "text-red-400" : "text-gray-700"}`}>
            {formatSoles(p.gananciaGenerada)}
          </span>
        </td>
        <td className="px-4 py-4 text-center">
          <span className={`font-mono font-bold ${p.stock > 0 ? "text-white" : "text-gray-700"}`}>{p.stock}</span>
        </td>
        <td className="px-4 py-4 text-right">
          <span className={`font-mono font-medium ${p.gananciaPotencial > 0 ? "text-blue-400" : "text-gray-700"}`}>
            {formatSoles(p.gananciaPotencial)}
          </span>
        </td>
        <td className="px-4 py-4 text-right">
          {p.roi > 0 ? (
            <span className={`font-mono text-xs font-bold ${p.roi >= 50 ? "text-emerald-400" : p.roi >= 20 ? "text-amber-400" : "text-gray-400"}`}>
              {p.roi.toFixed(0)}%
            </span>
          ) : <span className="text-gray-700">—</span>}
        </td>
        <td className="px-4 py-4 text-center">
          <button onClick={() => setExpanded(isExpanded ? null : p.id)}
            className="text-gray-500 hover:text-violet-400 transition text-xs">
            {isExpanded ? "Cerrar ▲" : "Ver ▼"}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="bg-white/[0.015] border-t border-white/5 px-6 py-5">
            <div className="grid md:grid-cols-3 gap-4">
              <DetailBlock title="📊 Ventas Realizadas" items={[
                { label: "Unidades vendidas", value: String(p.unidadesVendidas) },
                { label: "Ingresos por ventas", value: formatSoles(p.ingresosVentas), color: "text-white" },
                { label: "Costo de lo vendido", value: formatSoles(p.costoVentas), color: "text-red-400" },
                { label: "Ganancia generada", value: formatSoles(p.gananciaGenerada), color: "text-emerald-400", bold: true },
                { label: "ROI", value: `${p.roi.toFixed(1)}%`, color: p.roi >= 50 ? "text-emerald-400" : "text-amber-400" },
              ]} />
              <DetailBlock title="📦 Stock Actual" items={[
                { label: "Unidades en stock", value: `${p.stock} ${p.unidad}` },
                { label: "Inversión en stock", value: formatSoles(p.inversionStock), color: "text-amber-400" },
                { label: `Ingreso si vendo todo`, value: formatSoles(p.ingresosPotenciales), color: "text-white" },
                { label: "Ganancia potencial", value: formatSoles(p.gananciaPotencial), color: "text-blue-400", bold: true },
                ...(p.gananciaPotencialEspecial !== null ? [
                  { label: "Potencial (P. Especial)", value: formatSoles(p.gananciaPotencialEspecial), color: "text-amber-400" },
                ] : []),
              ]} />
              <DetailBlock title="💎 Proyección Total" items={[
                { label: "Ya gané", value: formatSoles(p.gananciaGenerada), color: "text-emerald-400" },
                { label: "Puedo ganar aún", value: formatSoles(p.gananciaPotencial), color: "text-blue-400" },
                { label: "TOTAL PROYECTADO", value: formatSoles(p.gananciaGenerada + p.gananciaPotencial), color: "text-violet-400", bold: true },
                { label: "Precio costo", value: formatSoles(p.precioCosto), color: "text-gray-500" },
                { label: "Precio venta", value: formatSoles(p.precioVenta), color: "text-white" },
                ...(p.precioEspecial !== null ? [
                  { label: "Precio especial", value: formatSoles(p.precioEspecial), color: "text-amber-400" },
                ] : []),
              ]} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailBlock({ title, items }: { title: string; items: { label: string; value: string; color?: string; bold?: boolean }[] }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-gray-300 mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-xs">
            <span className="text-gray-500">{item.label}</span>
            <span className={`font-mono ${item.bold ? "font-bold text-sm" : ""} ${item.color || "text-gray-300"}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, gradient, border, glow, valueColor }: {
  label: string; value: string; sub: string; gradient: string; border: string; glow: string; valueColor: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} ${border} border rounded-2xl p-5 ${glow} transition-all hover:scale-[1.02]`}>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-2 ${valueColor}`}>{value}</p>
      <p className="text-[10px] text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function Th({ label, sortKey, current, dir, onClick, align }: {
  label: string; sortKey: SortKey; current: SortKey; dir: "asc" | "desc";
  onClick: (k: SortKey) => void; align: "left" | "right" | "center";
}) {
  const active = current === sortKey;
  const alignCls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th
      className={`px-4 py-4 ${alignCls} text-xs font-semibold uppercase tracking-wider cursor-pointer transition select-none ${
        active ? "text-violet-400" : "text-gray-500 hover:text-gray-300"
      }`}
      onClick={() => onClick(sortKey)}
    >
      {label}{active ? (dir === "desc" ? " ↓" : " ↑") : ""}
    </th>
  );
}

interface ProdRent {
  id: number;
  nombre: string;
  sku: string | null;
  categoriaNombre: string | null;
  categoriaColor: string | null;
  unidad: string;
  precioCosto: number;
  precioVenta: number;
  precioEspecial: number | null;
  stock: number;
  margenUnidad: number;
  margenEspecial: number | null;
  unidadesVendidas: number;
  ingresosVentas: number;
  costoVentas: number;
  gananciaGenerada: number;
  gananciaPotencial: number;
  gananciaPotencialEspecial: number | null;
  inversionStock: number;
  ingresosPotenciales: number;
  roi: number;
}
