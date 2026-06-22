import { db } from "@/db";
import { clientes } from "@/db/schema";
import { NextResponse } from "next/server";
import { ilike, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get("q") || "";
    const where = q ? or(ilike(clientes.nombre, `%${q}%`), ilike(clientes.telefono, `%${q}%`)) : undefined;
    const rows = await db.select().from(clientes).where(where).orderBy(clientes.nombre);
    return NextResponse.json(rows);
  } catch (e) {
    console.error("Clientes GET error:", e);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const [row] = await db.insert(clientes).values({
      nombre: b.nombre, email: b.email || null, telefono: b.telefono || null,
      direccion: b.direccion || null, ruc: b.ruc || null, notas: b.notas || null,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("Clientes POST error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
