import { NextResponse } from "next/server";
import { db } from "@/db";
import { categorias } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(categorias).where(eq(categorias.id, Number(id)));
  return NextResponse.json({ ok: true });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(categorias)
    .set({
      nombre: body.nombre,
      descripcion: body.descripcion ?? null,
      color: body.color ?? "#6366f1",
    })
    .where(eq(categorias.id, Number(id)))
    .returning();
  return NextResponse.json(row);
}