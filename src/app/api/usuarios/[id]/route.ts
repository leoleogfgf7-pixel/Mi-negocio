import { NextResponse } from "next/server";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "secreto-muy-seguro-123"
);

// ✅ OBTENER USUARIO POR ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [user] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.id, Number(id)));

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(user);
}

// 🔐 VERIFICAR ADMIN
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

// 🗑 ELIMINAR USUARIO
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  await db.delete(usuarios).where(eq(usuarios.id, Number(id)));

  return NextResponse.json({ ok: true });
}

// ✏️ ACTUALIZAR USUARIO (activar/desactivar)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  await db
    .update(usuarios)
    .set({ activo: body.activo })
    .where(eq(usuarios.id, Number(id)));

  return NextResponse.json({ ok: true });
}
