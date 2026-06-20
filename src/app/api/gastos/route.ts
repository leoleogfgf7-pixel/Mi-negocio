import { NextResponse } from "next/server";
import { db } from "@/db";
import { gastos } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(gastos).orderBy(desc(gastos.fecha));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const [row] = await db
    .insert(gastos)
    .values({
      fecha: body.fecha || new Date().toISOString().slice(0, 10),
      categoria: body.categoria || "general",
      descripcion: String(body.descripcion).trim(),
      monto: String(body.monto ?? "0"),
    })
    .returning();
  return NextResponse.json(row);
}