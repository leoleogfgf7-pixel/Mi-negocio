import { NextResponse } from "next/server";
import { db } from "@/db";
import { productos, categorias, movimientosStock } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
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
      createdAt: productos.createdAt,
      updatedAt: productos.updatedAt,
    })
    .from(productos)
    .leftJoin(categorias, eq(productos.categoriaId, categorias.id))
    .orderBy(sql`${productos.nombre} asc`);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const stockInicial = Number(body.stockActual ?? 0);
  const [row] = await db
    .insert(productos)
    .values({
      nombre: String(body.nombre).trim(),
      descripcion: body.descripcion || null,
      sku: body.sku || null,
      categoriaId: body.categoriaId ? Number(body.categoriaId) : null,
      precioCompra: String(body.precioCompra ?? "0"),
      precioVenta: String(body.precioVenta ?? "0"),
      precioMayor: String(body.precioMayor ?? "0"),
      stockActual: stockInicial,
      stockMinimo: Number(body.stockMinimo ?? 5),
      unidad: body.unidad || "unidad",
      activo: true,
    })
    .returning();

  if (stockInicial > 0) {
    await db.insert(movimientosStock).values({
      productoId: row.id,
      tipo: "entrada",
      cantidad: stockInicial,
      stockAnterior: 0,
      stockNuevo: stockInicial,
      motivo: "Stock inicial",
    });
  }

  return NextResponse.json(row);
}