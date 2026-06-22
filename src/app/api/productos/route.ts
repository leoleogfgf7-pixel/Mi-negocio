import { db } from "@/db";
import { productos, categorias } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, ilike, sql, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const catId = url.searchParams.get("categoria");

    const conditions = [];
    if (q) conditions.push(ilike(productos.nombre, `%${q}%`));
    if (catId) conditions.push(eq(productos.categoriaId, Number(catId)));
    conditions.push(eq(productos.activo, true));

    const rows = await db
      .select({
        id: productos.id, nombre: productos.nombre, sku: productos.sku,
        descripcion: productos.descripcion, categoriaId: productos.categoriaId,
        precioCosto: productos.precioCosto, precioVenta: productos.precioVenta,
        precioEspecial: productos.precioEspecial,
        stock: productos.stock, stockMinimo: productos.stockMinimo,
        unidad: productos.unidad, activo: productos.activo,
        createdAt: productos.createdAt, updatedAt: productos.updatedAt,
        categoriaNombre: categorias.nombre, categoriaColor: categorias.color,
      })
      .from(productos)
      .leftJoin(categorias, eq(productos.categoriaId, categorias.id))
      .where(and(...conditions))
      .orderBy(productos.nombre);

    return NextResponse.json(rows);
  } catch (e) {
    console.error("Productos GET error:", e);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const [row] = await db.insert(productos).values({
      nombre: b.nombre, sku: b.sku || null, descripcion: b.descripcion || null,
      categoriaId: b.categoriaId ? Number(b.categoriaId) : null,
      precioCosto: String(b.precioCosto || 0), precioVenta: String(b.precioVenta || 0),
      precioEspecial: b.precioEspecial ? String(b.precioEspecial) : null,
      stock: Number(b.stock || 0), stockMinimo: Number(b.stockMinimo || 5),
      unidad: b.unidad || "unidad",
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("Productos POST error:", e);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
