import { NextResponse } from "next/server";
import { db } from "@/db";
import { productos, movimientosStock } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const [prev] = await db
    .select()
    .from(productos)
    .where(eq(productos.id, Number(id)));
  if (!prev) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const [row] = await db
    .update(productos)
    .set({
      nombre: body.nombre ?? prev.nombre,
      descripcion: body.descripcion ?? prev.descripcion,
      sku: body.sku ?? prev.sku,
      categoriaId: body.categoriaId ? Number(body.categoriaId) : null,
      precioCompra: body.precioCompra ?? prev.precioCompra,
      precioVenta: body.precioVenta ?? prev.precioVenta,
      precioMayor: body.precioMayor ?? prev.precioMayor,
      stockMinimo:
        body.stockMinimo !== undefined ? Number(body.stockMinimo) : prev.stockMinimo,
      unidad: body.unidad ?? prev.unidad,
      activo: body.activo ?? prev.activo,
      updatedAt: new Date(),
    })
    .where(eq(productos.id, Number(id)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(productos).where(eq(productos.id, Number(id)));
  return NextResponse.json({ ok: true });
}

// PATCH para ajustar stock
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const [prev] = await db
    .select()
    .from(productos)
    .where(eq(productos.id, Number(id)));
  if (!prev) return NextResponse.json({ error: "No existe" }, { status: 404 });

  const cantidad = Number(body.cantidad);
  const tipo = body.tipo as "entrada" | "salida" | "ajuste";
  let nuevoStock = prev.stockActual;
  if (tipo === "entrada") nuevoStock = prev.stockActual + cantidad;
  else if (tipo === "salida") nuevoStock = prev.stockActual - cantidad;
  else if (tipo === "ajuste") nuevoStock = cantidad;

  const [row] = await db
    .update(productos)
    .set({ stockActual: nuevoStock, updatedAt: new Date() })
    .where(eq(productos.id, Number(id)))
    .returning();

  await db.insert(movimientosStock).values({
    productoId: Number(id),
    tipo,
    cantidad,
    stockAnterior: prev.stockActual,
    stockNuevo: nuevoStock,
    motivo: body.motivo || null,
  });

  return NextResponse.json(row);
}