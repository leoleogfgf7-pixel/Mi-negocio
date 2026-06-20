import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(clientes)
    .set({
      nombre: body.nombre,
      email: body.email ?? null,
      telefono: body.telefono ?? null,
      direccion: body.direccion ?? null,
      notas: body.notas ?? null,
    })
    .where(eq(clientes.id, Number(id)))
    .returning();
  return NextResponse.json(row);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(clientes).where(eq(clientes.id, Number(id)));
  return NextResponse.json({ ok: true });
}