import { NextResponse } from "next/server";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { eq, desc } from "drizzle-orm";

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

export async function GET(req: Request) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const rows = await db.select({
    id: usuarios.id,
    nombre: usuarios.nombre,
    username: usuarios.username,
    role: usuarios.role,
    activo: usuarios.activo,
    createdAt: usuarios.createdAt
  }).from(usuarios).orderBy(desc(usuarios.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json();
  const hashedPassword = await bcrypt.hash(body.password, 10);
  
  const [newUser] = await db.insert(usuarios).values({
    nombre: body.nombre,
    username: body.username,
    password: hashedPassword,
    role: body.role || "vendedor",
  }).returning();

  return NextResponse.json(newUser);
}