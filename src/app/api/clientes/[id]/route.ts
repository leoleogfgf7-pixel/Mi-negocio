import { db } from "@/db";
import { clientes } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const b = await req.json();
    const [row] = await db.update(clientes).set({
      nombre: b.nombre, email: b.email || null, telefono: b.telefono || null,
      direccion: b.direccion || null, ruc: b.ruc || null, notas: b.notas || null,
    }).where(eq(clientes.id, Number(id))).returning();
    return NextResponse.json(row);
  } catch (e) {
    console.error("Cliente PUT error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(clientes).where(eq(clientes.id, Number(id)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Cliente DELETE error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
