import { db } from "@/db";
import { ventas, ventaItems, productos, gastos, clientes } from "@/db/schema";
import { and, eq, gte, sql, desc } from "drizzle-orm";
import { formatMoney } from "@/lib/format";
import ReportesCharts from "@/components/ReportesCharts";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getReportes() {
  await db.execute(sql`select 1`);
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const hace30 = new Date();
  hace30.setDate(hace30.getDate() - 29);
  hace30.setHours(0, 0, 0, 0);

  // Ventas últimos 30 días
  const ventas30 = await db
    .select({
      dia: sql<string>`to_char(date_trunc('day', ${ventas.fecha}), 'YYYY-MM-DD')`,
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
      ganancia: sql<string>`coalesce(sum(${ventas.ganancia}), 0)`,
      cantidad: sql<number>`count(*)::int`,
    })
    .from(ventas)
    .where(and(eq(ventas.estado, "completada"), gte(ventas.fecha, hace30)))
    .groupBy(sql`date_trunc('day', ${ventas.fecha})`)
    .orderBy(sql`date_trunc('day', ${ventas.fecha})`);

  // Rellenar días
  const diasCompletos: { dia: string; label: string; total: string; ganancia: string; cantidad: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(hace30);
    d.setDate(hace30.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    const found = ventas30.find((v) => v.dia === key);
    diasCompletos.push({
      dia: key,
      label,
      total: found?.total ?? "0",
      ganancia: found?.ganancia ?? "0",
      cantidad: found?.cantidad ?? 0,
    });
  }

  // Ventas del mes por tipo
  const [mesMenor] = await db
    .select({
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
      cantidad: sql<number>`count(*)::int`,
      ganancia: sql<string>`coalesce(sum(${ventas.ganancia}), 0)`,
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
      ganancia: sql<string>`coalesce(sum(${ventas.ganancia}), 0)`,
    })
    .from(ventas)
    .where(
      and(
        eq(ventas.estado, "completada"),
        gte(ventas.fecha, inicioMes),
        eq(ventas.tipoVenta, "mayor")
      )
    );

  // Top productos
  const topProductos = await db
    .select({
      nombre: ventaItems.productoNombre,
      cantidad: sql<number>`sum(${ventaItems.cantidad})::int`,
      total: sql<string>`sum(${ventaItems.subtotal})`,
      ganancia: sql<string>`sum(${ventaItems.subtotal} - ${ventaItems.costoUnitario} * ${ventaItems.cantidad})`,
    })
    .from(ventaItems)
    .innerJoin(ventas, eq(ventaItems.ventaId, ventas.id))
    .where(eq(ventas.estado, "completada"))
    .groupBy(ventaItems.productoNombre)
    .orderBy(desc(sql`sum(${ventaItems.cantidad})`))
    .limit(10);

  // Top clientes
  const topClientes = await db
    .select({
      nombre: ventas.clienteNombre,
      cantidad: sql<number>`count(*)::int`,
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
    })
    .from(ventas)
    .where(eq(ventas.estado, "completada"))
    .groupBy(ventas.clienteNombre)
    .orderBy(desc(sql`sum(${ventas.total})`))
    .limit(10);

  // Métodos de pago
  const metodosPago = await db
    .select({
      metodo: ventas.metodoPago,
      cantidad: sql<number>`count(*)::int`,
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
    })
    .from(ventas)
    .where(eq(ventas.estado, "completada"))
    .groupBy(ventas.metodoPago)
    .orderBy(desc(sql`sum(${ventas.total})`));

  // Resumen del mes
  const [mes] = await db
    .select({
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
      ganancia: sql<string>`coalesce(sum(${ventas.ganancia}), 0)`,
      costo: sql<string>`coalesce(sum(${ventas.costoTotal}), 0)`,
      cantidad: sql<number>`count(*)::int`,
    })
    .from(ventas)
    .where(and(eq(ventas.estado, "completada"), gte(ventas.fecha, inicioMes)));

  const [gastosMes] = await db
    .select({ total: sql<string>`coalesce(sum(${gastos.monto}), 0)` })
    .from(gastos)
    .where(gte(gastos.fecha, inicioMes.toISOString().slice(0, 10)));

  // Inventario valorizado
  const [inv] = await db
    .select({
      productos: sql<number>`count(*)::int`,
      unidades: sql<number>`coalesce(sum(${productos.stockActual}), 0)::int`,
      costoTotal: sql<string>`coalesce(sum(${productos.stockActual} * ${productos.precioCompra}), 0)`,
      ventaTotal: sql<string>`coalesce(sum(${productos.stockActual} * ${productos.precioVenta}), 0)`,
      mayorTotal: sql<string>`coalesce(sum(${productos.stockActual} * coalesce(${productos.precioMayor}, 0)), 0)`,
    })
    .from(productos)
    .where(eq(productos.activo, true));

  const resultadoNeto =
    parseFloat(mes.total) - parseFloat(gastosMes.total);

  return {
    diasCompletos,
    topProductos,
    topClientes,
    metodosPago,
    mes,
    mesMenor,
    mesMayor,
    gastosMes,
    inv,
    resultadoNeto,
  };
}

export default async function ReportesPage() {
  const data = await getReportes();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">📈 Reportes</h1>
        <p className="text-sm text-slate-600">
          Análisis de tu negocio (últimos 30 días) - Montos en Soles (S/.)
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Ventas del mes</p>
          <p className="text-2xl font-bold text-slate-900">
            {formatMoney(data.mes.total)}
          </p>
          <p className="text-xs text-slate-500">{data.mes.cantidad} ventas</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Ganancia bruta</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatMoney(data.mes.ganancia)}
          </p>
          <p className="text-xs text-slate-500">Ventas - Costos</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Gastos del mes</p>
          <p className="text-2xl font-bold text-rose-600">
            {formatMoney(data.gastosMes.total)}
          </p>
          <p className="text-xs text-slate-500">Operativos</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase text-slate-500">Resultado neto</p>
          <p
            className={`text-2xl font-bold ${
              data.resultadoNeto >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {formatMoney(data.resultadoNeto)}
          </p>
          <p className="text-xs text-slate-500">Ganancia - Gastos</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-emerald-900">
              🛒 Ventas por MENOR (mes)
            </h2>
            <span className="badge bg-emerald-100 text-emerald-800">
              {data.mesMenor.cantidad} ventas
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-emerald-700">
            {formatMoney(data.mesMenor.total)}
          </p>
          <p className="mt-2 text-sm text-emerald-700">
            Ganancia: <strong>{formatMoney(data.mesMenor.ganancia)}</strong>
          </p>
          <p className="text-xs text-emerald-600">
            Promedio por venta: {data.mesMenor.cantidad > 0
              ? formatMoney(
                  (parseFloat(data.mesMenor.total) / data.mesMenor.cantidad).toString()
                )
              : "S/ 0,00"}
          </p>
        </div>
        <div className="card border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-indigo-900">
              📦 Ventas por MAYOR (mes)
            </h2>
            <span className="badge bg-indigo-100 text-indigo-800">
              {data.mesMayor.cantidad} ventas
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-indigo-700">
            {formatMoney(data.mesMayor.total)}
          </p>
          <p className="mt-2 text-sm text-indigo-700">
            Ganancia: <strong>{formatMoney(data.mesMayor.ganancia)}</strong>
          </p>
          <p className="text-xs text-indigo-600">
            Promedio por venta: {data.mesMayor.cantidad > 0
              ? formatMoney(
                  (parseFloat(data.mesMayor.total) / data.mesMayor.cantidad).toString()
                )
              : "S/ 0,00"}
          </p>
        </div>
      </section>

      <ReportesCharts data={data.diasCompletos} />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">🏆 Top productos vendidos</h2>
          {data.topProductos.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Sin datos aún
            </p>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th className="text-center">Cant.</th>
                  <th className="text-right">Ingresos</th>
                  <th className="text-right">Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {data.topProductos.map((p, i) => (
                  <tr key={p.nombre}>
                    <td className="font-bold text-slate-500">{i + 1}</td>
                    <td className="font-medium">{p.nombre}</td>
                    <td className="text-center">{p.cantidad}</td>
                    <td className="text-right">{formatMoney(p.total)}</td>
                    <td className="text-right text-emerald-600">
                      {formatMoney(p.ganancia)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">👥 Top clientes</h2>
          {data.topClientes.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Sin datos aún
            </p>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th className="text-center">Compras</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.topClientes.map((c, i) => (
                  <tr key={c.nombre}>
                    <td className="font-bold text-slate-500">{i + 1}</td>
                    <td className="font-medium">{c.nombre}</td>
                    <td className="text-center">{c.cantidad}</td>
                    <td className="text-right font-semibold">
                      {formatMoney(c.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">💳 Métodos de pago</h2>
          {data.metodosPago.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Sin datos aún
            </p>
          ) : (
            <ul className="space-y-3">
              {data.metodosPago.map((m) => {
                const max = parseFloat(
                  data.metodosPago[0]?.total ?? "0"
                );
                const pct = max > 0 ? (parseFloat(m.total) / max) * 100 : 0;
                return (
                  <li key={m.metodo}>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{m.metodo}</span>
                      <span className="font-semibold">
                        {formatMoney(m.total)} ({m.cantidad})
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">📦 Inventario valorizado</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Productos activos</span>
              <span className="font-semibold">{data.inv.productos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Unidades en stock</span>
              <span className="font-semibold">{data.inv.unidades}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-600">Valor al costo</span>
              <span className="font-semibold">
                {formatMoney(data.inv.costoTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Si vendo todo por MENOR</span>
              <span className="font-bold text-emerald-600">
                {formatMoney(data.inv.ventaTotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Si vendo todo por MAYOR</span>
              <span className="font-bold text-indigo-600">
                {formatMoney(data.inv.mayorTotal)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-600">Ganancia potencial menor</span>
              <span className="font-bold text-emerald-600">
                {formatMoney(
                  (
                    parseFloat(data.inv.ventaTotal) -
                    parseFloat(data.inv.costoTotal)
                  ).toString()
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Ganancia potencial mayor</span>
              <span className="font-bold text-indigo-600">
                {formatMoney(
                  (
                    parseFloat(data.inv.mayorTotal) -
                    parseFloat(data.inv.costoTotal)
                  ).toString()
                )}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}