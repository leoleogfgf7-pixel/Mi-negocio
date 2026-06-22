import { db } from "@/db";
import { movimientos, productos } from "@/db/schema";
import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(movimientos).orderBy(desc(movimientos.createdAt)).limit(200);
    return NextResponse.json(rows);
  } catch (e) {
    console.error("Movimientos GET error:", e);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const [prod] = await db.select().from(productos).where(eq(productos.id, Number(b.productoId)));
    if (!prod) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });

    const cant = Number(b.cantidad);
    const tipo = b.tipo as string;

    const [row] = await db.insert(movimientos).values({
      productoId: prod.id, productoNombre: prod.nombre,
      tipo, cantidad: cant, motivo: b.motivo || null, referencia: b.referencia || null,
    }).returning();

    if (tipo === "entrada") {
      await db.update(productos).set({ stock: sql`${productos.stock} + ${cant}`, updatedAt: new Date() })
        .where(eq(productos.id, prod.id));
    } else if (tipo === "salida") {
      await db.update(productos).set({ stock: sql`${productos.stock} - ${cant}`, updatedAt: new Date() })
        .where(eq(productos.id, prod.id));
    } else {
      await db.update(productos).set({ stock: cant, updatedAt: new Date() })
        .where(eq(productos.id, prod.id));
    }

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("Movimientos POST error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
