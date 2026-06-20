import { NextResponse } from "next/server";
import { db } from "@/db";
import { ventas, ventaItems, productos, movimientosStock } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Cancelar venta: repone stock
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ventaId = Number(id);

  const [venta] = await db
    .select()
    .from(ventas)
    .where(eq(ventas.id, ventaId));
  if (!venta) return NextResponse.json({ error: "No existe" }, { status: 404 });
  if (venta.estado === "cancelada") {
    return NextResponse.json({ ok: true });
  }

  const items = await db
    .select()
    .from(ventaItems)
    .where(eq(ventaItems.ventaId, ventaId));

  // Reponer stock
  for (const it of items) {
    const [p] = await db
      .select()
      .from(productos)
      .where(eq(productos.id, it.productoId));
    if (p) {
      const nuevoStock = p.stockActual + it.cantidad;
      await db
        .update(productos)
        .set({ stockActual: nuevoStock, updatedAt: new Date() })
        .where(eq(productos.id, it.productoId));
      await db.insert(movimientosStock).values({
        productoId: it.productoId,
        tipo: "entrada",
        cantidad: it.cantidad,
        stockAnterior: p.stockActual,
        stockNuevo: nuevoStock,
        motivo: "Cancelación de venta",
        referencia: `Venta #${ventaId}`,
      });
    }
  }

  await db
    .update(ventas)
    .set({ estado: "cancelada" })
    .where(eq(ventas.id, ventaId));
  return NextResponse.json({ ok: true });
}