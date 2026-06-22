import { db } from "@/db";
import { gastos } from "@/db/schema";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(gastos).orderBy(desc(gastos.createdAt)).limit(200);
    return NextResponse.json(rows);
  } catch (e) {
    console.error("Gastos GET error:", e);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const [row] = await db.insert(gastos).values({
      concepto: b.concepto, monto: String(b.monto),
      categoria: b.categoria || "otros", notas: b.notas || null,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("Gastos POST error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await db.delete(gastos).where(eq(gastos.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Gastos DELETE error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
