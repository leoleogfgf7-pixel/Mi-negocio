import { db } from "@/db";
import { ventas, ventaItems, productos, movimientos } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [venta] = await db.select().from(ventas).where(eq(ventas.id, Number(id)));
    if (!venta) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    const items = await db.select().from(ventaItems).where(eq(ventaItems.ventaId, venta.id));
    return NextResponse.json({ ...venta, items });
  } catch (e) {
    console.error("Venta GET error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const b = await req.json();

    if (b.estado === "cancelada") {
      const items = await db.select().from(ventaItems).where(eq(ventaItems.ventaId, Number(id)));
      for (const it of items) {
        await db.update(productos).set({
          stock: sql`${productos.stock} + ${it.cantidad}`,
        }).where(eq(productos.id, it.productoId));

        await db.insert(movimientos).values({
          productoId: it.productoId, productoNombre: it.productoNombre,
          tipo: "entrada", cantidad: it.cantidad!,
          motivo: "Cancelación de venta", referencia: `Venta #${id} cancelada`,
        });
      }
    }

    const [row] = await db.update(ventas).set({ estado: b.estado })
      .where(eq(ventas.id, Number(id))).returning();
    return NextResponse.json(row);
  } catch (e) {
    console.error("Venta PUT error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vid = Number(id);

    // Get the venta to check if we need to restore stock
    const [venta] = await db.select().from(ventas).where(eq(ventas.id, vid));
    if (!venta) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

    // If it was completed, restore stock
    if (venta.estado === "completada") {
      const items = await db.select().from(ventaItems).where(eq(ventaItems.ventaId, vid));
      for (const it of items) {
        await db.update(productos).set({
          stock: sql`${productos.stock} + ${it.cantidad}`,
        }).where(eq(productos.id, it.productoId));

        await db.insert(movimientos).values({
          productoId: it.productoId, productoNombre: it.productoNombre,
          tipo: "entrada", cantidad: it.cantidad!,
          motivo: "Venta eliminada", referencia: `Venta #${id} eliminada`,
        });
      }
    }

    // Delete items then venta
    await db.delete(ventaItems).where(eq(ventaItems.ventaId, vid));
    await db.delete(ventas).where(eq(ventas.id, vid));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Venta DELETE error:", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
