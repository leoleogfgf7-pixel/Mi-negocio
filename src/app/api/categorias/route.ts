import { db } from "@/db";
import { categorias } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(categorias).orderBy(categorias.nombre);
    return NextResponse.json(rows);
  } catch (e) {
    console.error("Categorias GET error:", e);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const [row] = await db.insert(categorias).values({ nombre: body.nombre, color: body.color || "#6366f1" }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("Categorias POST error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await db.delete(categorias).where(eq(categorias.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Categorias DELETE error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
