import { NextResponse } from "next/server";
import { db } from "@/db";
import { categorias } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(categorias).orderBy(asc(categorias.nombre));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const [row] = await db
    .insert(categorias)
    .values({
      nombre: String(body.nombre).trim(),
      descripcion: body.descripcion || null,
      color: body.color || "#6366f1",
    })
    .returning();
  return NextResponse.json(row);
}