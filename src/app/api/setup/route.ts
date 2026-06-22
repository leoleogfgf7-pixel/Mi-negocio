import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let initialized = false;

export async function GET() {
  if (initialized) return NextResponse.json({ ok: true, cached: true });

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY, nombre TEXT NOT NULL,
        color TEXT DEFAULT '#6366f1', created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY, nombre TEXT NOT NULL, sku TEXT, descripcion TEXT,
        categoria_id INTEGER, precio_costo NUMERIC(12,2) DEFAULT 0,
        precio_venta NUMERIC(12,2) DEFAULT 0, precio_especial NUMERIC(12,2),
        stock INTEGER DEFAULT 0, stock_minimo INTEGER DEFAULT 5,
        unidad TEXT DEFAULT 'unidad', activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY, nombre TEXT NOT NULL, email TEXT, telefono TEXT,
        direccion TEXT, ruc TEXT, notas TEXT, created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY, cliente_id INTEGER, cliente_nombre TEXT,
        subtotal NUMERIC(12,2) DEFAULT 0, descuento NUMERIC(12,2) DEFAULT 0,
        total NUMERIC(12,2) DEFAULT 0, costo NUMERIC(12,2) DEFAULT 0,
        metodo_pago TEXT DEFAULT 'efectivo', estado TEXT DEFAULT 'completada',
        notas TEXT, created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS venta_items (
        id SERIAL PRIMARY KEY, venta_id INTEGER NOT NULL, producto_id INTEGER NOT NULL,
        producto_nombre TEXT NOT NULL, cantidad INTEGER DEFAULT 1,
        precio_unitario NUMERIC(12,2) DEFAULT 0, precio_costo NUMERIC(12,2) DEFAULT 0,
        uso_precio_especial BOOLEAN DEFAULT false, subtotal NUMERIC(12,2) DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS movimientos (
        id SERIAL PRIMARY KEY, producto_id INTEGER NOT NULL, producto_nombre TEXT,
        tipo TEXT NOT NULL, cantidad INTEGER NOT NULL, motivo TEXT, referencia TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS gastos (
        id SERIAL PRIMARY KEY, concepto TEXT NOT NULL, monto NUMERIC(12,2) NOT NULL,
        categoria TEXT DEFAULT 'otros', notas TEXT, created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    initialized = true;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Setup error:", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
