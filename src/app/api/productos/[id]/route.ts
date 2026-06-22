import { db } from "@/db";
import { productos } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [row] = await db.select().from(productos).where(eq(productos.id, Number(id)));
    if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error("Producto GET error:", e);
    return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const b = await req.json();
    const [row] = await db.update(productos).set({
      nombre: b.nombre, sku: b.sku || null, descripcion: b.descripcion || null,
      categoriaId: b.categoriaId ? Number(b.categoriaId) : null,
      precioCosto: String(b.precioCosto || 0), precioVenta: String(b.precioVenta || 0),
      precioEspecial: b.precioEspecial ? String(b.precioEspecial) : null,
      stock: Number(b.stock ?? 0), stockMinimo: Number(b.stockMinimo || 5),
      unidad: b.unidad || "unidad", updatedAt: new Date(),
    }).where(eq(productos.id, Number(id))).returning();
    return NextResponse.json(row);
  } catch (e) {
    console.error("Producto PUT error:", e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.update(productos).set({ activo: false }).where(eq(productos.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Producto DELETE error:", e);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
