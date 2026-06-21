"use client";

import { formatMoney } from "@/lib/format";

type Dia = {
  dia: string;
  label: string;
  total: string;
  ganancia: string;
  cantidad: number;
};

export default function ReportesCharts({ data }: { data: Dia[] }) {
  const max = Math.max(1, ...data.map((d) => parseFloat(d.total)));
  const total = data.reduce((acc, d) => acc + parseFloat(d.total), 0);
  const totalGanancia = data.reduce((acc, d) => acc + parseFloat(d.ganancia), 0);
  const totalCantidad = data.reduce((acc, d) => acc + d.cantidad, 0);
  const promedio = total / 30;

  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Evolución últimos 30 días
          </h2>
          <p className="text-sm text-slate-500">Ventas y ganancias diarias</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-right text-sm">
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="font-bold text-slate-900">{formatMoney(total)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Ganancia</p>
            <p className="font-bold text-emerald-600">
              {formatMoney(totalGanancia)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Promedio diario</p>
            <p className="font-bold text-indigo-600">{formatMoney(promedio)}</p>
          </div>
        </div>
      </div>
      <div className="flex h-64 items-end gap-1 overflow-x-auto pb-2">
        {data.map((d) => {
          const total = parseFloat(d.total);
          const ganancia = parseFloat(d.ganancia);
          const heightTotal = (total / max) * 100;
          const heightGanancia =
            total > 0 ? (ganancia / total) * heightTotal : 0;
          return (
            <div
              key={d.dia}
              className="group flex shrink-0 flex-col items-center gap-1"
              style={{ width: "20px" }}
            >
              <div className="relative flex h-full w-full items-end">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t bg-gradient-to-t from-indigo-500 to-indigo-400"
                  style={{ height: `${heightTotal}%`, minHeight: total > 0 ? "3px" : "0" }}
                />
                {heightGanancia > 0 && (
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400"
                    style={{ height: `${heightGanancia}%` }}
                  />
                )}
                <div className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                  <div className="font-semibold">{d.label}</div>
                  <div>Venta: S/ {total.toFixed(0)}</div>
                  <div className="text-emerald-300">
                    Gan: S/ {ganancia.toFixed(0)}
                  </div>
                  <div className="text-slate-300">{d.cantidad} ventas</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-400">
        {data
          .filter((_, i) => i % 5 === 0)
          .map((d) => (
            <span key={d.dia}>{d.label}</span>
          ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-indigo-500" />
          Ventas totales
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-emerald-500" />
          Ganancia
        </div>
      </div>
    </div>
  );
}