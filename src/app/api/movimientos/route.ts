import { NextResponse } from "next/server";
import { db } from "@/db";
import { movimientosStock, productos } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: movimientosStock.id,
      fecha: movimientosStock.fecha,
      productoId: movimientosStock.productoId,
      productoNombre: productos.nombre,
      tipo: movimientosStock.tipo,
      cantidad: movimientosStock.cantidad,
      stockAnterior: movimientosStock.stockAnterior,
      stockNuevo: movimientosStock.stockNuevo,
      motivo: movimientosStock.motivo,
      referencia: movimientosStock.referencia,
    })
    .from(movimientosStock)
    .leftJoin(productos, eq(movimientosStock.productoId, productos.id))
    .orderBy(desc(movimientosStock.fecha));
  return NextResponse.json(rows);
}