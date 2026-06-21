import { db } from "@/db";
import { productos, categorias, movimientosStock, ventas, ventaItems } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatMoney, formatDateTime, formatNumber } from "@/lib/format";
import Link from "next/link";
import ProductoDetalleClient from "@/components/ProductoDetalleClient";

export const dynamic = "force-dynamic";

export default async function ProductoDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [producto] = await db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      descripcion: productos.descripcion,
      sku: productos.sku,
      categoriaId: productos.categoriaId,
      categoriaNombre: categorias.nombre,
      categoriaColor: categorias.color,
      precioCompra: productos.precioCompra,
      precioVenta: productos.precioVenta,
      precioMayor: productos.precioMayor,
      stockActual: productos.stockActual,
      stockMinimo: productos.stockMinimo,
      unidad: productos.unidad,
      activo: productos.activo,
    })
    .from(productos)
    .leftJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(eq(productos.id, Number(id)));

  if (!producto) notFound();

  const cats = await db.select().from(categorias);

  const movimientos = await db
    .select()
    .from(movimientosStock)
    .where(eq(movimientosStock.productoId, producto.id))
    .orderBy(desc(movimientosStock.fecha))
    .limit(30);

  const [stats] = await db
    .select({
      totalVendido: sql<number>`coalesce(sum(${ventaItems.cantidad}), 0)::int`,
      totalIngresos: sql<string>`coalesce(sum(${ventaItems.subtotal}), 0)`,
      ventasCount: sql<number>`count(distinct ${ventaItems.ventaId})::int`,
    })
    .from(ventaItems)
    .innerJoin(ventas, eq(ventaItems.ventaId, ventas.id))
    .where(
      sql`${ventaItems.productoId} = ${producto.id} and ${ventas.estado} = 'completada'`
    );

  return (
    <ProductoDetalleClient
      producto={producto}
      categorias={cats}
      movimientos={movimientos}
      stats={stats}
    />
  );
}