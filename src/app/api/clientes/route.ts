import { NextResponse } from "next/server";
import { db } from "@/db";
import { clientes } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(clientes).orderBy(asc(clientes.nombre));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const [row] = await db
    .insert(clientes)
    .values({
      nombre: String(body.nombre).trim(),
      email: body.email || null,
      telefono: body.telefono || null,
      direccion: body.direccion || null,
      notas: body.notas || null,
    })
    .returning();
  return NextResponse.json(row);
}