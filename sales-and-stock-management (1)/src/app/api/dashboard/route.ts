import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  ventas,
  productos,
  clientes,
  ventaItems,
  gastos,
} from "@/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  // Métricas globales
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
    .where(
      and(
        eq(ventas.estado, "completada"),
        gte(ventas.fecha, inicioHoy)
      )
    );

  const [mesStats] = await db
    .select({
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
      ganancia: sql<string>`coalesce(sum(${ventas.ganancia}), 0)`,
      cantidad: sql<number>`count(*)::int`,
    })
    .from(ventas)
    .where(
      and(
        eq(ventas.estado, "completada"),
        gte(ventas.fecha, inicioMes)
      )
    );

  const [productosCount] = await db
    .select({
      total: sql<number>`count(*)::int`,
      stockBajo: sql<number>`count(*) filter (where ${productos.stockActual} <= ${productos.stockMinimo})::int`,
      valorStock: sql<string>`coalesce(sum(${productos.stockActual} * ${productos.precioCompra}), 0)`,
    })
    .from(productos)
    .where(eq(productos.activo, true));

  const [clientesCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(clientes);

  const [gastosMes] = await db
    .select({
      total: sql<string>`coalesce(sum(${gastos.monto}), 0)`,
    })
    .from(gastos)
    .where(gte(gastos.fecha, inicioMes.toISOString().slice(0, 10)));

  // Ventas últimos 7 días
  const hace7 = new Date();
  hace7.setDate(hace7.getDate() - 6);
  hace7.setHours(0, 0, 0, 0);

  const ventas7dias = await db
    .select({
      dia: sql<string>`to_char(date_trunc('day', ${ventas.fecha}), 'YYYY-MM-DD')`,
      total: sql<string>`coalesce(sum(${ventas.total}), 0)`,
    })
    .from(ventas)
    .where(and(eq(ventas.estado, "completada"), gte(ventas.fecha, hace7)))
    .groupBy(sql`date_trunc('day', ${ventas.fecha})`)
    .orderBy(sql`date_trunc('day', ${ventas.fecha})`);

  // Top productos vendidos
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
    .orderBy(sql`sum(${ventaItems.cantidad}) desc`)
    .limit(5);

  // Stock bajo
  const stockBajo = await db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      stockActual: productos.stockActual,
      stockMinimo: productos.stockMinimo,
    })
    .from(productos)
    .where(
      and(
        eq(productos.activo, true),
        lte(productos.stockActual, productos.stockMinimo)
      )
    )
    .orderBy(productos.stockActual)
    .limit(8);

  return NextResponse.json({
    totales,
    hoy: hoyStats,
    mes: mesStats,
    productos: productosCount,
    clientes: clientesCount,
    gastosMes,
    ventas7dias,
    topProductos,
    stockBajo,
  });
}