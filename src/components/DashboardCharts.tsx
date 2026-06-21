"use client";

type DataPoint = { dia: string; total: string };

export function DashboardCharts({ data }: { data: DataPoint[] }) {
  const max = Math.max(
    1,
    ...data.map((d) => parseFloat(d.total))
  );
  const total = data.reduce((acc, d) => acc + parseFloat(d.total), 0);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total del período
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {new Intl.NumberFormat("es-PE", {
              style: "currency",
              currency: "PEN",
              minimumFractionDigits: 2,
            }).format(total)}
          </p>
        </div>
      </div>
      <div className="flex h-56 items-end gap-2 sm:gap-3">
        {data.map((d) => {
          const value = parseFloat(d.total);
          const height = (value / max) * 100;
          return (
            <div
              key={d.dia}
              className="group flex flex-1 flex-col items-center gap-2"
            >
              <div className="relative flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400 transition-all group-hover:from-indigo-600 group-hover:to-indigo-500"
                  style={{ height: `${height}%`, minHeight: value > 0 ? "4px" : "0" }}
                  title={`${d.dia}: S/ ${value.toFixed(2)}`}
                />
                <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100">
                  S/ {value.toFixed(0)}
                </div>
              </div>
              <span className="text-xs font-medium text-slate-600">
                {d.dia}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}