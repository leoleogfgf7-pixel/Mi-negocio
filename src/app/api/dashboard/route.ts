import { db } from "@/db";
import { ventas, productos, clientes, gastos, ventaItems } from "@/db/schema";
import { NextResponse } from "next/server";
import { sql, eq, gte, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const empty = {
  ventasHoy: { count: 0, total: "0" },
  ventasMes: { count: 0, total: "0", costo: "0" },
  stockBajo: [],
  prodCount: 0,
  cliCount: 0,
  gastosMes: "0",
  ultimasVentas: [],
  topProductos: [],
};

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [ventasHoy] = await db.select({
      count: sql<number>`count(*)::int`,
      total: sql<string>`coalesce(sum(${ventas.total}::numeric),0)::text`,
    }).from(ventas).where(and(gte(ventas.createdAt, todayStart), eq(ventas.estado, "completada")));

    const [ventasMes] = await db.select({
      count: sql<number>`count(*)::int`,
      total: sql<string>`coalesce(sum(${ventas.total}::numeric),0)::text`,
      costo: sql<string>`coalesce(sum(${ventas.costo}::numeric),0)::text`,
    }).from(ventas).where(and(gte(ventas.createdAt, monthStart), eq(ventas.estado, "completada")));

    const stockBajo = await db.select().from(productos)
      .where(and(eq(productos.activo, true), sql`${productos.stock} <= ${productos.stockMinimo}`))
      .orderBy(productos.stock).limit(10);

    const [prodCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(productos).where(eq(productos.activo, true));

    const [cliCount] = await db.select({ count: sql<number>`count(*)::int` }).from(clientes);

    const [gastosMes] = await db.select({
      total: sql<string>`coalesce(sum(${gastos.monto}::numeric),0)::text`,
    }).from(gastos).where(gte(gastos.createdAt, monthStart));

    const ultimasVentas = await db.select().from(ventas).orderBy(desc(ventas.createdAt)).limit(5);

    const topProductos = await db.select({
      productoNombre: ventaItems.productoNombre,
      totalUnidades: sql<number>`sum(${ventaItems.cantidad})::int`,
      totalVentas: sql<string>`sum(${ventaItems.subtotal}::numeric)::text`,
    }).from(ventaItems)
      .innerJoin(ventas, eq(ventaItems.ventaId, ventas.id))
      .where(eq(ventas.estado, "completada"))
      .groupBy(ventaItems.productoNombre)
      .orderBy(sql`sum(${ventaItems.subtotal}::numeric) desc`)
      .limit(5);

    return NextResponse.json({
      ventasHoy, ventasMes, stockBajo, prodCount: prodCount.count,
      cliCount: cliCount.count, gastosMes: gastosMes.total,
      ultimasVentas, topProductos,
    });
  } catch (e) {
    console.error("Dashboard API error:", e);
    return NextResponse.json(empty);
  }
}
