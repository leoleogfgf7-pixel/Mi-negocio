import { NextResponse } from "next/server";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { eq } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "secreto-muy-seguro-123");

export async function POST(req: Request) {
  const { username, password } = await req.json();

  // Si no hay usuarios, el primero que se registre es ADMIN
  const allUsers = await db.select().from(usuarios).limit(1);
  
  if (allUsers.length === 0) {
    // Registro automático del primer admin si no existe ninguno
    const hashedPassword = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(usuarios).values({
      nombre: "Administrador",
      username,
      password: hashedPassword,
      role: "admin",
    }).returning();

    const token = await new SignJWT({ id: newUser.id, role: newUser.role, nombre: newUser.nombre })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(JWT_SECRET);

    return NextResponse.json({ token, user: { nombre: newUser.nombre, role: newUser.role } });
  }

  // Login normal
  const [user] = await db.select().from(usuarios).where(eq(usuarios.username, username));
  if (!user || !user.activo) {
    return NextResponse.json({ error: "Usuario no encontrado o inactivo" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = await new SignJWT({ id: user.id, role: user.role, nombre: user.nombre })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);

  return NextResponse.json({ token, user: { nombre: user.nombre, role: user.role } });
}