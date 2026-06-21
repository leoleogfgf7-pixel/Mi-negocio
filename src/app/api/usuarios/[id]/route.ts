import { NextResponse } from "next/server";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secreto-muy-seguro-123");

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

// ✅ GET (ESTO SOLUCIONA TU ERROR 405)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const usuario = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, Number(id)));

    return NextResponse.json(usuario[0] || {});
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = params;

  await db.delete(usuarios).where(eq(usuarios.id, Number(id)));

  return NextResponse.json({ ok: true });
}

// PATCH
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = params;
  const body = await req.json();

  await db
    .update(usuarios)
    .set({ activo: body.activo })
    .where(eq(usuarios.id, Number(id)));

  return NextResponse.json({ ok: true });
}
