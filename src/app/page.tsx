import { db } from "@/db";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { formatMoney, formatNumber } from "@/lib/format";
import { DashboardCharts } from "@/components/DashboardCharts";
import {
  ventas,
  productos,
  clientes,
  ventaItems,
  gastos,
} from "@/db/schema";
import { and, eq, gte, lte, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  await db.execute(sql`select 1`);
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const [totales] = await db
    .select({
      totalVentas: sql<string>`coalesce(sum(${ventas.total}), 0)`,
      totalGanancia: sql<string>`coalesce(sum(${ventas.ganancia}), 0)`,
      cantidadVentas: sql<number>`count(*)::int`,
    })
    .from(ventas)
    .where(eq(ventas.estado, "completada"));

  const [hoyStats] = await db
    .select({
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
      ganancia: sql<string>`coalesce(sum(${ventas.ganancia}), 0)`,
      cantidad: sql<number>`count(*)::int`,
    })
    .from(ventas)
    .where(and(eq(ventas.estado, "completada"), gte(ventas.fecha, inicioHoy)));

  // Ventas por tipo hoy
  const [hoyMenor] = await db
    .select({
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
      cantidad: sql<number>`count(*)::int`,
    })
    .from(ventas)
    .where(
      and(
        eq(ventas.estado, "completada"),
        gte(ventas.fecha, inicioHoy),
        eq(ventas.tipoVenta, "menor")
      )
    );
  const [hoyMayor] = await db
    .select({
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
      cantidad: sql<number>`count(*)::int`,
    })
    .from(ventas)
    .where(
      and(
        eq(ventas.estado, "completada"),
        gte(ventas.fecha, inicioHoy),
        eq(ventas.tipoVenta, "mayor")
      )
    );

  const [mesStats] = await db
    .select({
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
      ganancia: sql<string>`coalesce(sum(${ventas.ganancia}), 0)`,
      cantidad: sql<number>`count(*)::int`,
    })
    .from(ventas)
    .where(and(eq(ventas.estado, "completada"), gte(ventas.fecha, inicioMes)));

  const [mesMenor] = await db
    .select({
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
      cantidad: sql<number>`count(*)::int`,
    })
    .from(ventas)
    .where(
      and(
        eq(ventas.estado, "completada"),
        gte(ventas.fecha, inicioMes),
        eq(ventas.tipoVenta, "menor")
      )
    );
  const [mesMayor] = await db
    .select({
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
      cantidad: sql<number>`count(*)::int`,
    })
    .from(ventas)
    .where(
      and(
        eq(ventas.estado, "completada"),
        gte(ventas.fecha, inicioMes),
        eq(ventas.tipoVenta, "mayor")
      )
    );

  const [productosStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      stockBajo: sql<number>`count(*) filter (where ${productos.stockActual} <= ${productos.stockMinimo})::int`,
      valorStock: sql<string>`coalesce(sum(${productos.stockActual} * ${productos.precioCompra}), 0)`,
    })
    .from(productos)
    .where(eq(productos.activo, true));

  const [clientesStats] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(clientes);

  const [gastosMes] = await db
    .select({ total: sql<string>`coalesce(sum(${gastos.monto}), 0)` })
    .from(gastos)
    .where(gte(gastos.fecha, inicioMes.toISOString().slice(0, 10)));

  const hace7 = new Date();
  hace7.setDate(hace7.getDate() - 6);
  hace7.setHours(0, 0, 0, 0);

  const ventas7dias = await db
    .select({
      dia: sql<string>`to_char(date_trunc('day', ${ventas.fecha}), 'DD/MM')`,
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
    })
    .from(ventas)
    .where(and(eq(ventas.estado, "completada"), gte(ventas.fecha, hace7)))
    .groupBy(sql`date_trunc('day', ${ventas.fecha})`)
    .orderBy(sql`date_trunc('day', ${ventas.fecha})`);

  const diasCompletos: { dia: string; total: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(hace7);
    d.setDate(hace7.getDate() + i);
    const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    const found = ventas7dias.find((v) => v.dia === key);
    diasCompletos.push({ dia: key, total: found?.total ?? "0" });
  }

  const topProductos = await db
    .select({
      nombre: ventaItems.productoNombre,
      cantidad: sql<number>`sum(${ventaItems.cantidad})::int`,
      total: sql<string>`sum(${ventaItems.subtotal})`,
    })
    .from(ventaItems)
    .innerJoin(ventas, eq(ventaItems.ventaId, ventas.id))
    .where(eq(ventas.estado, "completada"))
    .groupBy(ventaItems.productoNombre)
    .orderBy(desc(sql`sum(${ventaItems.cantidad})`))
    .limit(5);

  const stockBajo = await db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      stockActual: productos.stockActual,
      stockMinimo: productos.stockMinimo,
    })
    .from(productos)
    .where(and(eq(productos.activo, true), lte(productos.stockActual, productos.stockMinimo)))
    .orderBy(productos.stockActual)
    .limit(8);

  const ultimasVentas = await db
    .select({
      id: ventas.id,
      fecha: ventas.fecha,
      clienteNombre: ventas.clienteNombre,
      total: ventas.total,
      tipoVenta: ventas.tipoVenta,
      estado: ventas.estado,
    })
    .from(ventas)
    .orderBy(desc(ventas.fecha))
    .limit(8);

  return {
    totales,
    hoy: hoyStats,
    hoyMenor,
    hoyMayor,
    mes: mesStats,
    mesMenor,
    mesMayor,
    productos: productosStats,
    clientes: clientesStats,
    gastosMes,
    ventas7dias: diasCompletos,
    topProductos,
    stockBajo,
    ultimasVentas,
  };
}

export default async function HomePage() {
  const data = await getDashboardData();

  const cards = [
    {
      label: "Ventas hoy",
      value: formatMoney(data.hoy.total),
      sub: `${data.hoy.cantidad} ventas`,
      icon: "💵",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Ventas del mes",
      value: formatMoney(data.mes.total),
      sub: `${data.mes.cantidad} ventas`,
      icon: "📅",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      label: "Ganancia del mes",
      value: formatMoney(data.mes.ganancia),
      sub: "Ventas - Costos",
      icon: "📈",
      color: "from-violet-500 to-violet-600",
    },
    {
      label: "Productos en stock",
      value: formatNumber(data.productos.total),
      sub: `Valor: ${formatMoney(data.productos.valorStock)}`,
      icon: "📦",
      color: "from-amber-500 to-amber-600",
    },
    {
      label: "Clientes",
      value: formatNumber(data.clientes.total),
      sub: "Registrados",
      icon: "👥",
      color: "from-sky-500 to-sky-600",
    },
    {
      label: "Gastos del mes",
      value: formatMoney(data.gastosMes.total),
      sub: "Registrados",
      icon: "💸",
      color: "from-rose-500 to-rose-600",
    },
  ];

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">📊 Dashboard</h1>
          <p className="text-sm text-slate-600">
            Resumen general de tu negocio
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ventas/nueva?tipo=menor" className="btn btn-primary">
            🛒 Venta por menor
          </Link>
          <Link href="/ventas/nueva?tipo=mayor" className="btn btn-secondary">
            📦 Venta por mayor
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-4">
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-2xl text-white shadow-sm ${c.color}`}
            >
              <span>{c.icon}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {c.label}
              </p>
              <p className="truncate text-xl font-bold text-slate-900">
                {c.value}
              </p>
              <p className="text-xs text-slate-500">{c.sub}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card border-2 border-emerald-200 bg-emerald-50/40">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-emerald-900">
              🛒 Ventas por MENOR (hoy)
            </h2>
            <span className="badge bg-emerald-100 text-emerald-800">
              {data.hoyMenor.cantidad} ventas
            </span>
          </div>
          <p className="text-3xl font-bold text-emerald-700">
            {formatMoney(data.hoyMenor.total)}
          </p>
          <p className="mt-2 text-xs text-emerald-700">
            Este mes: <strong>{formatMoney(data.mesMenor.total)}</strong> · {data.mesMenor.cantidad} ventas
          </p>
        </div>
        <div className="card border-2 border-indigo-200 bg-indigo-50/40">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-indigo-900">
              📦 Ventas por MAYOR (hoy)
            </h2>
            <span className="badge bg-indigo-100 text-indigo-800">
              {data.hoyMayor.cantidad} ventas
            </span>
          </div>
          <p className="text-3xl font-bold text-indigo-700">
            {formatMoney(data.hoyMayor.total)}
          </p>
          <p className="mt-2 text-xs text-indigo-700">
            Este mes: <strong>{formatMoney(data.mesMayor.total)}</strong> · {data.mesMayor.cantidad} ventas
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Ventas últimos 7 días
            </h2>
            <Link
              href="/reportes"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Ver reportes →
            </Link>
          </div>
          <DashboardCharts data={data.ventas7dias} />
        </div>
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Top productos
            </h2>
          </div>
          {data.topProductos.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Aún no hay ventas registradas
            </p>
          ) : (
            <ul className="space-y-3">
              {data.topProductos.map((p, i) => (
                <li key={p.nombre} className="flex items-center gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {p.nombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.cantidad} unidades
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatMoney(p.total)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              ⚠️ Stock bajo
            </h2>
            <Link
              href="/productos"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Ver stock →
            </Link>
          </div>
          {data.stockBajo.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              ¡Todo el stock está saludable! 🎉
            </p>
          ) : (
            <div className="space-y-2">
              {data.stockBajo.map((p) => (
                <Link
                  key={p.id}
                  href={`/productos/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 hover:bg-amber-100"
                >
                  <span className="text-sm font-medium text-slate-900">
                    {p.nombre}
                  </span>
                  <span className="badge bg-amber-200 text-amber-900">
                    {p.stockActual} / mín. {p.stockMinimo}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Últimas ventas
            </h2>
            <Link
              href="/ventas"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Ver todas →
            </Link>
          </div>
          {data.ultimasVentas.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Aún no hay ventas registradas
            </p>
          ) : (
            <ul className="space-y-2">
              {data.ultimasVentas.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      #{v.id} · {v.clienteNombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(v.fecha).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        v.tipoVenta === "mayor"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {v.tipoVenta}
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      {formatMoney(v.total)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}